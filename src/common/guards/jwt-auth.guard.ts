/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { TokenService } from '@circle-backend/modules/auth/services/token.service';
import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends PassportAuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private readonly tokenService: TokenService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const token = req.headers.authorization?.split(' ')[1];

    if (token && (await this.tokenService.isBlacklisted(token))) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const can = await super.canActivate(context);

    return can as boolean;
  }

  handleRequest<TUser = any>(
    err: any,
    user: TUser,
    info: any,
    context: ExecutionContext,
  ): TUser {
    if (err || !user) {
      this.logger.warn(
        `Authentication failed: ${info?.message || err?.message || 'Unknown error'}`,
      );
      throw err || new UnauthorizedException('Invalid or expired token');
    }
    return user;
  }
}
