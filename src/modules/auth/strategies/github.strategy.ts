import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { AuthProvider } from '../enums/auth-provider';
import { AuthService } from '../auth.service';
import { User } from '../../users/entities/user.entity';

interface GithubEmail {
  value: string;
  primary?: boolean;
  verified?: boolean;
}

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private readonly config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: config.get<string>('GITHUB_CLIENT_ID'),
      clientSecret: config.get<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: config.get<string>('GITHUB_CALLBACK_URL'),
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<User> {
    if (!profile?.id) {
      throw new BadRequestException('Invalid GitHub profile');
    }

    const emails = profile.emails as GithubEmail[] | undefined;
    const email =
      emails?.find((e) => e.primary)?.value || emails?.[0]?.value;

    if (!email) {
      throw new BadRequestException('GitHub account has no email');
    }

    const firstName = profile.displayName || profile.username || '';
    const lastName = '';

    const user = await this.authService.validateOAuthLogin({
      provider: AuthProvider.GITHUB,
      providerId: profile.id,
      email,
      firstName,
      lastName,
      accessToken,
      refreshToken,
    });

    if (!user) {
      throw new BadRequestException('Unable to create or login user');
    }

    return user;
  }
}