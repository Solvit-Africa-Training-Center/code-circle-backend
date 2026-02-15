/* eslint-disable @typescript-eslint/no-unsafe-assignment */
export class CreateAuthDto {}
import {
  Body,
  Controller,
  Post,
  Get,
  Query,
  Req,
  Res,
  UseGuards,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthProvider } from './enums/auth-provider';
import { JwtAuthGuard } from '@circle-backend/modules/auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CurrentUser } from '@circle-backend/common/decorators/current-user.decorator';
import { ConfigService } from '@nestjs/config';

import { RegisterResponseDto } from './dto/register-response.dto';
import { LoginResponseDto } from './dto/login-respons.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailResponseDto } from './dto/verify-email.dto-response';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { OAuthLoginDto } from './dto/oauth-login.dto';
import { LinkOAuthDto } from './dto/link-oauth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register new user',
    description: 'Creates a new user account and sends email verification link',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User successfully registered',
    type: RegisterResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Email already in use or validation failed',
  })
  async register(@Body() dto: RegisterDto): Promise<RegisterResponseDto> {
    const result = await this.authService.register(
      dto.email,
      dto.password,
      dto.firstName,
      dto.lastName,
      dto.role,
    );

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
      ...result,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login with email and password',
    description:
      'Authenticates user and returns access/refresh tokens. Previous sessions are automatically logged out (single device policy).',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Account disabled or email not verified',
  })
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    const result = await this.authService.login(
      dto.email,
      dto.password,
    );

    return {
      message: 'Login successful. Previous sessions have been logged out.',
      ...result,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout current user',
    description: 'Revokes all refresh tokens for the authenticated user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logout successful',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
  })
  async logout(
    @Req() req,
    @CurrentUser() user: User,
  ): Promise<{ success: boolean; message: string }> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const token = req.headers.authorization?.split(' ')[1];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await this.authService.logout(user.id, token);
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email address',
    description: 'Verifies user email using the token sent via email',
  })
  @ApiQuery({
    name: 'token',
    type: String,
    description: 'Email verification token',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email verified successfully',
    type: VerifyEmailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired token',
  })
  async verifyEmail(
    @Query('token') token: string,
  ): Promise<VerifyEmailResponseDto> {
    const result = await this.authService.verifyEmail(token);

    return {
      success: true,
      message: 'Email verified successfully',
      ...result,
    };
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend verification email',
    description: 'Sends a new verification email to the user',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification email sent',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Email already verified or user not found',
  })
  async resendVerification(@Body('email') email: string): Promise<void> {
    await this.authService.resendVerificationEmail(email);
  }

  @Post('request-password-reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Sends password reset link to user email',
  })
  @ApiBody({ type: RequestPasswordResetDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset email sent (if email exists)',
  })
  async requestPasswordReset(
    @Body() dto: RequestPasswordResetDto,
  ): Promise<void> {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password',
    description:
      'Resets user password using token from email. All sessions will be logged out.',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset successful',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired token',
  })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Change password',
    description:
      'Changes password for authenticated user. Requires current password. All sessions will be logged out.',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password changed successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Current password is incorrect',
  })
  async changePassword(
    @CurrentUser() user: User,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    await this.authService.changePassword(
      user,
      dto.oldPassword,
      dto.newPassword,
    );
  }

  @Post('oauth/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'OAuth login/register (Direct API)',
    description:
      'For mobile/SPA apps that handle OAuth client-side. Accepts OAuth provider data and returns tokens.',
  })
  @ApiBody({ type: OAuthLoginDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OAuth login successful',
    type: LoginResponseDto,
  })
  async oauthLogin(@Body() dto: OAuthLoginDto): Promise<LoginResponseDto> {
    const result = await this.authService.oauthLogin(dto);

    return {
      ...result,
      message:
        'OAuth login successful. Previous sessions have been logged out.',
    };
  }

  @Post('oauth/link/:provider')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Link OAuth account',
    description: 'Links an OAuth provider account to the current user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OAuth account linked successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'OAuth account already linked',
  })
  async linkOAuth(
    @CurrentUser() user: User,
    @Param('provider') provider: AuthProvider,
    @Body() dto: LinkOAuthDto,
  ): Promise<{ success: boolean; message: string }> {
    const result = await this.authService.linkOAuth(user, {
      ...dto,
      provider,
    });
    return {
      success: result.success,
      message: 'OAuth account linked successfully',
    };
  }

  @Post('oauth/unlink/:provider')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Unlink OAuth account',
    description: 'Unlinks an OAuth provider account from the current user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OAuth account unlinked successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'OAuth account not linked',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot unlink only authentication method',
  })
  async unlinkOAuth(
    @CurrentUser() user: User,
    @Param('provider') provider: AuthProvider,
  ): Promise<{ success: boolean; message: string }> {
    const result = await this.authService.unlinkOAuth(user, provider);

    return {
      success: result.success,
      message: 'OAuth account unlinked successfully',
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Issues new access and refresh tokens using a valid refresh token',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tokens refreshed successfully',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired refresh token',
  })
  async refreshTokens(@Body() dto: RefreshTokenDto): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    return this.authService.refreshTokens(dto.refreshToken);
  }
}

// function resendVerification(arg0: any, email: any, string: any) {
//   throw new Error('Function not implemented.');
// }

// function changePassword(arg0: any, user: any, User: typeof User, arg3: any, dto: any, ChangePasswordDto: typeof ChangePasswordDto) {
//   throw new Error('Function not implemented.');
// }


// function oauthLogin(arg0: any, dto: any, OAuthLoginDto: typeof OAuthLoginDto) {
//   throw new Error('Function not implemented.');
// }

// function linkOAuth(arg0: any, user: any, User: typeof User, arg3: any, provider: any, AuthProvider: typeof AuthProvider, arg6: any, dto: any, LinkOAuthDto: typeof LinkOAuthDto) {
//   throw new Error('Function not implemented.');
// }

// function unlinkOAuth(arg0: any, user: any, User: typeof User, arg3: any, provider: any, AuthProvider: typeof AuthProvider) {
//   throw new Error('Function not implemented.');
// }

// function refreshTokens(arg0: any, dto: any, RefreshTokenDto: typeof RefreshTokenDto) {
//   throw new Error('Function not implemented.');
// }
