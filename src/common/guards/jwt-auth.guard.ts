import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';;

@Injectable()
export class JwtAuthGuard extends PassportAuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

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
