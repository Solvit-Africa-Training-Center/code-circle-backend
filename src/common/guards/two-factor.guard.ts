import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { TwoFactorService } from '@circle-backend/modules/auth/services/two-factor.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@circle-backend/modules/users/entities/user.entity';

interface AuthRequest extends Request {
  user?: User;
}

interface JwtPayload {
  sub: string;
  email?: string;
}

@Injectable()
export class TwoFactorGuard implements CanActivate {
  private readonly logger = new Logger(TwoFactorGuard.name);
  constructor(
    private readonly jwtService: JwtService,
    private readonly twoFactorService: TwoFactorService,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}
  private extractToken(authHeader: string | undefined): string {
    if (!authHeader) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization format');
    }

    return token;
  }

  private extract2FAToken(header: string | string[] | undefined): string | null {
    if (!header) {
      return null;
    }

    return Array.isArray(header) ? header[0] : header;
  }


  async canActivate(context: ExecutionContext): Promise<boolean> {

    const request = context.switchToHttp().getRequest<AuthRequest>();
    const token = this.extractToken(request.headers['authorization']);

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(token);
    } catch (error) {
      this.logger.warn(`JWT verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.userRepo.findOne({
      where: { id: payload.sub },
      relations: ['twoFactorSecrets'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const has2FA = user.twoFactorSecrets?.some((s) => s.enabled) ?? false;

    if (!has2FA) {
      request.user = user;
      return true;
    }

    const twoFAToken = this.extract2FAToken(request.headers['x-2fa-token']);

    if (!twoFAToken) {
      this.logger.warn(`User ${user.id} requires 2FA but no token provided`);
      throw new ForbiddenException('2FA token required');
    }

    const isValid = await this.twoFactorService.validateToken(user, twoFAToken);

    if (!isValid) {
      this.logger.warn(`Invalid 2FA token for user ${user.id}`);
      throw new ForbiddenException('Invalid 2FA token');
    }

    request.user = user;

    return true;

  }
}