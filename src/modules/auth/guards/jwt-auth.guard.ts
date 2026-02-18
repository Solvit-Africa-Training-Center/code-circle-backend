import { TokenService } from '@circle-backend/modules/auth/services/token.service';
import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
  Optional,
  Inject,
} from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends PassportAuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);
  constructor(
    @Optional()
    @Inject(TokenService)
    private readonly tokenService?: TokenService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: { headers: Record<string, string> } = context
      .switchToHttp()
      .getRequest();
    const token = req.headers.authorization?.split(' ')[1];

    if (token && this.tokenService) {
      try {
        if (await this.tokenService.isBlacklisted(token)) {
          throw new UnauthorizedException('Token has been revoked');
        }
      } catch (error) {
        this.logger.warn(
          'TokenService check failed, proceeding with authentication',
          error,
        );
      }
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
      } else if (err && typeof err === 'object' && 'message' in err) {
        msg = String((err as Record<string, unknown>).message);
      }

      this.logger.warn(`Authentication failed: ${msg ?? 'Unknown error'}`);

      if (err instanceof UnauthorizedException) {
        throw err;
      }

      throw new UnauthorizedException(
        msg && typeof msg === 'string' ? msg : 'Invalid or expired token',
      );
    }
    return user;
  }
}
