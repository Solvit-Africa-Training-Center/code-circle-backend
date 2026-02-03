import {
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';

export type OAuthProvider = 'google' | 'github' | 'linkedin';

export const OAuthGuard = (provider: OAuthProvider) => {
  @Injectable()
  class OAuthGuardMixin extends PassportAuthGuard(provider) {
    public readonly logger = new Logger(`${provider}Guard`);

    handleRequest<TUser = any>(
      err: any,
      user: TUser,
      info: any,
      context: ExecutionContext,
    ): TUser {
      if (err || !user) {
        this.logger.warn(
          `OAuth login failed for ${provider}: ${info?.message || err?.message || 'Unknown error'}`,
        );

        throw (
          err || new UnauthorizedException(`${provider} OAuth login failed`)
        );
      }

      return user;
    }
  }

  return OAuthGuardMixin;
};
