import {
  Controller,
  Get,
  UseGuards,
  Req,
  Res,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { OAuthAuthService } from './services/oauth-auth.service';
import { AuditService } from './services/audit.service';
import { AuthProvider } from './enums/auth-provider';
import { ConfigService } from '@nestjs/config';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';

@ApiTags('OAuth Callbacks')
@Controller('auth/oauth')
export class OAuthCallbackController {
  private readonly logger = new Logger(OAuthCallbackController.name);

  constructor(
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
    private readonly oauthService: OAuthAuthService,
  ) {}


   private getFrontendRedirectUrl(params: Record<string, any>): string {
      const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3001';
      const query = new URLSearchParams(params).toString();
      return `${frontendUrl}/auth/callback?${query}`;
    }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Initiate Google OAuth flow',
    description: 'Redirects user to Google login page',
  })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: 'Redirects to Google OAuth consent screen',
  })
  initiateGoogle() {}

  @Get('callback/google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Google OAuth callback',
    description: 'Handles redirect from Google after user authentication',
  })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: 'Redirects to frontend with tokens',
  })
  @ApiExcludeEndpoint() 
  async googleCallback(@Req() req: any, @Res() res: Response) {
    try {
      const tokens = await this.oauthService.handleOAuthCallback(AuthProvider.GOOGLE, req.user.profile);
      await this.auditService.log( 'oauth_login', req.user.profile.id, undefined, {provider: AuthProvider.GOOGLE, success: true } );
      return res.redirect(this.getFrontendRedirectUrl({ ...tokens, success: true }));
    } catch (error) {
      await this.auditService.log( 'oauth_login', req.user.profile.id, undefined, {provider: AuthProvider.GOOGLE, success: false} );
      return res.redirect(this.getFrontendRedirectUrl({ success: false, error: 'google_oauth_failed' }));
    }
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({
    summary: 'Initiate GitHub OAuth flow',
    description: 'Redirects user to GitHub login page',
  })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: 'Redirects to GitHub OAuth consent screen',
  })
  initiateGithub() {}

  @Get('callback/github')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({
    summary: 'GitHub OAuth callback',
    description: 'Handles redirect from GitHub after user authentication',
  })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: 'Redirects to frontend with tokens',
  })
  @ApiExcludeEndpoint()
  async githubCallback(@Req() req: any, @Res() res: Response) {
    try {
      const tokens = await this.oauthService.handleOAuthCallback(AuthProvider.GITHUB, req.user.profile);
      await this.auditService.log( 'oauth_login', req.user.profile.id, undefined, {provider: AuthProvider.GITHUB, success: true} );
      return res.redirect(this.getFrontendRedirectUrl({ ...tokens, success: true }));
    } catch (error) {
      await this.auditService.log( 'oauth_login', req.user.profile.id, undefined, {provider: AuthProvider.GITHUB, success: false} );
      return res.redirect(this.getFrontendRedirectUrl({ success: false, error: 'github_oauth_failed' }));
    }
  }
}