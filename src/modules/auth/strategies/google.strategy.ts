import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from 'passport-google-oauth20';
import { AuthProvider } from "../enums/auth-provider";
import { AuthService } from "../auth.service";
import { User } from "../../users/entities/user.entity";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: config.get('GOOGLE_CLIENT_ID'),
      clientSecret: config.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: config.get('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ): Promise<User> {
    if (!profile || !profile.id) {
      throw new BadRequestException('Invalid Google profile');
    }

    const email = profile.emails?.[0]?.value;
    if (!email) {
      throw new BadRequestException('Google account has no email');
    }

    const firstName = profile.name?.givenName || profile.displayName || '';
    const lastName = profile.name?.familyName || '';

    const user = await this.authService.validateOAuthLogin({
      provider: AuthProvider.GOOGLE,
      providerId: profile.id,
      email,
      firstName,
      lastName,
      accessToken,
      refreshToken,
    });

    if (!user) throw new BadRequestException('Unable to create or login user');
    return user;
  }
}
