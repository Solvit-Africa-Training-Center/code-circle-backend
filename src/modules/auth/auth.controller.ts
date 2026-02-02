import {
  Body,
  Controller,
  Post,
  Get,
  Query,
  Req,
  UseGuards,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthProvider } from './enums/auth-provider';
import { JwtAuthGuard } from '@circle-backend/common/guards/jwt-auth.guard';
import { TwoFactorGuard } from '@circle-backend/common/guards/two-factor.guard';
import { Request } from 'express';
import { User } from '../users/entities/user.entity';
import { CurrentUser } from '@circle-backend/common/decorators/current-user.decorator';
import { RegisterResponseDto } from './dto/register-response.dto';
import { LoginResponseDto } from './dto/login-respons.dto';
import { Enable2FADto } from './dto/enable-2fa.dto';
import { Disable2FADto } from './dto/disable-2fa.dto';
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
  constructor(private readonly authService: AuthService) {}

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
    const { user, verificationToken } = await this.authService.register(
      dto.email,
      dto.password,
      dto.firstName,
      dto.lastName,
    );

    return {
      message: 'Registration successful. Please check your email to verify your account.',
      userId: user.id,
      email: user.email,
      verificationToken,
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
    description: 'Invalid credentials or 2FA code required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Account disabled or email not verified',
  })
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    const { accessToken, refreshToken } = await this.authService.login(
      dto.email,
      dto.password,
      dto.twoFactorCode,
    );

    return {
      accessToken,
      refreshToken,
      message: 'Login successful. Previous sessions have been logged out.',
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, TwoFactorGuard)
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
  async logout(@CurrentUser() user: User): Promise<{ success: boolean; message: string }> {
    await this.authService.logout(user.id);
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
  @ApiQuery({ name: 'token', type: String, description: 'Email verification token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email verified successfully',
    type: VerifyEmailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired token',
  })
  async verifyEmail(@Query('token') token: string): Promise<VerifyEmailResponseDto> {
    const user = await this.authService.verifyEmail(token);

    return {
      success: true,
      message: 'Email verified successfully',
      userId: user.id,
      email: user.email,
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
  async resendVerification(@Body('email') email: string): Promise<{ message: string }> {
    return this.authService.resendVerificationEmail(email);
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
  ): Promise<{ message: string }> {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password',
    description: 'Resets user password using token from email. All sessions will be logged out.',
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
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, TwoFactorGuard)
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
  ): Promise<{ message: string }> {
    return this.authService.changePassword(user, dto.oldPassword, dto.newPassword);
  }

  @Post('2fa/setup')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, TwoFactorGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Setup 2FA',
    description: 'Generates 2FA secret and QR code for user to scan',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '2FA setup data generated',
    schema: {
      type: 'object',
      properties: {
        secret: { type: 'string' },
        qrCodeDataUrl: { type: 'string' },
      },
    },
  })
  async setup2FA(@CurrentUser() user: User): Promise<{
    secret: string;
    qrCodeDataUrl: string;
  }> {
    return this.authService.setup2FA(user);
  }

  @Post('2fa/enable')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, TwoFactorGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Enable 2FA',
    description: 'Enables 2FA after verifying the setup code. Returns backup codes.',
  })
  @ApiBody({ type: Enable2FADto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '2FA enabled successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        backupCodes: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid 2FA code or no setup found',
  })
  async enableTwoFactor(
    @CurrentUser() user: User,
    @Body() dto: Enable2FADto,
  ): Promise<{ message: string; backupCodes?: string[] }> {
    return this.authService.enableTwoFactor(user, dto.code);
  }

  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, TwoFactorGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Disable 2FA',
    description: 'Disables 2FA after verifying code',
  })
  @ApiBody({ type: Disable2FADto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '2FA disabled successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid 2FA code',
  })
  async disableTwoFactor(
    @CurrentUser() user: User,
    @Body() dto: Disable2FADto,
  ): Promise<{ message: string }> {
    return this.authService.disableTwoFactor(user, dto.code);
  }

  @Post('oauth/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'OAuth login/register',
    description:
      'Login or register user via OAuth provider. Previous sessions are logged out (single device policy).',
  })
  @ApiBody({ type: OAuthLoginDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OAuth login successful',
    type: LoginResponseDto,
  })
  async oauthLogin(@Body() dto: OAuthLoginDto): Promise<LoginResponseDto> {
    const { accessToken, refreshToken } = await this.authService.oauthLogin(dto);

    return {
      accessToken,
      refreshToken,
      message: 'OAuth login successful. Previous sessions have been logged out.',
    };
  }

  @Post('oauth/link/:provider')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, TwoFactorGuard)
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
    return this.authService.linkOAuth(user, { ...dto, provider });
  }

  @Post('oauth/unlink/:provider')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, TwoFactorGuard)
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
    return this.authService.unlinkOAuth(user, provider);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Issues new access and refresh tokens using a valid refresh token',
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
  async refreshTokens(@Body()
  dto: RefreshTokenDto, p0?: any): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    return this.authService.refreshTokens(dto.refreshToken);
  }
}
