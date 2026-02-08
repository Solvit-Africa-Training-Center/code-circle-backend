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
    // Diagnostic log
    console.log('JwtAuthGuard constructed. TokenService:', !!tokenService);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Diagnostic log
    if (!this.tokenService) {
      console.error('JwtAuthGuard: tokenService is undefined in canActivate!');
    }
    const req: { headers: Record<string, string> } = context
      .switchToHttp()
      .getRequest();
    const token = req.headers.authorization?.split(' ')[1];

    if (token && (await this.tokenService.isBlacklisted(token))) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const can = await super.canActivate(context);

    return can as boolean;
  }

  handleRequest<TUser = any>(err: any, user: TUser, info: any): TUser {
    if (err || !user) {
      let msg: string | undefined;
      if (info && typeof info === 'object' && 'message' in info) {
        msg = (info as Record<string, unknown>).message as string;
      } else if (typeof info === 'string') {
        msg = info;
      }
      this.logger.warn(
        `Authentication failed: ${
          msg ??
          (err && typeof err === 'object' && 'message' in err
            ? String((err as Record<string, unknown>).message)
            : undefined) ??
          'Unknown error'
        }`,
      );
      throw err || new UnauthorizedException('Invalid or expired token');
    }
    return user;
  }
}
