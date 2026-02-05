import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { LessThan, Repository } from 'typeorm';
import { User } from '@circle-backend/modules/users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { RevokedToken } from '../entities/revoke-token';

type JwtExpiry = string | number;
@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private readonly accessTokenExpiry: JwtExpiry;
  private readonly refreshTokenExpiry: number;
  @InjectRepository(RevokedToken)
  private readonly revokedTokenRepo: Repository<RevokedToken>;
  protected hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,

    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    this.accessTokenExpiry =
      this.configService.get<string>('JWT_ACCESS_EXPIRY') ?? '15m';
    this.refreshTokenExpiry =
      parseInt(
        this.configService.get<string>('JWT_REFRESH_EXPIRY') || '604800000',
      ) || 7 * 24 * 60 * 60 * 1000;
  }
  issueAccessToken(user: User): string {
    const roles = user.userRoles?.map((ur) => ur.role.name) ?? [];

    const payload = {
      sub: user.id,
      email: user.email,
      roles,
    };

    return this.jwtService.sign(payload, {
      expiresIn: this.accessTokenExpiry as unknown as any,
    });
  }

  async issueRefreshToken(
    user: User,
    options?: {
      singleDevice?: boolean;
      deviceInfo?: string;
      ipAddress?: string;
    },
  ): Promise<{ accessToken: string; refreshToken: string }> {
    if (options?.singleDevice) {
      await this.refreshTokenRepo.update(
        { user: { id: user.id }, isRevoked: false },
        { isRevoked: true, revokedAt: new Date() },
      );

      this.logger.log(
        `Revoked all existing tokens for user ${user.id} (single device mode)`,
      );
    }

    const accessToken = this.issueAccessToken(user);

    const rawRefreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);

    const refreshToken = this.refreshTokenRepo.create({
      user,
      tokenHash,
      expiresAt: new Date(Date.now() + this.refreshTokenExpiry),
      isRevoked: false,
      deviceInfo: options?.deviceInfo,
      ipAddress: options?.ipAddress,
    });

    await this.refreshTokenRepo.save(refreshToken);

    // user.lastLoginAt = new Date(); // Field does not exist, remove or implement if needed
    await this.userRepo.save(user);

    this.logger.log(`Issued new token pair for user ${user.id}`);

    return { accessToken, refreshToken: rawRefreshToken };
  }

  async refresh(
    rawToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenHash = this.hashToken(rawToken);

    const stored = await this.refreshTokenRepo.findOne({
      where: { tokenHash },
      relations: ['user', 'user.userRoles', 'user.userRoles.role'],
    });

    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (stored.isRevoked) {
      this.logger.warn(
        `Attempt to use revoked refresh token for user ${stored.user?.id}`,
      );
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (stored.expiresAt < new Date()) {
      stored.isRevoked = true;
      stored.revokedAt = new Date();
      await this.refreshTokenRepo.save(stored);

      this.logger.warn(
        `Attempt to use expired refresh token for user ${stored.user?.id}`,
      );
      throw new UnauthorizedException('Refresh token has expired');
    }

    stored.isRevoked = true;
    stored.revokedAt = new Date();
    await this.refreshTokenRepo.save(stored);

    const tokens = await this.issueRefreshToken(stored.user, {
      deviceInfo: stored.deviceInfo,
      ipAddress: stored.ipAddress,
    });

    this.logger.log(`Refreshed token pair for user ${stored.user.id}`);

    return tokens;
  }

  async verifyRefreshToken(rawToken: string): Promise<User> {
    const tokenHash = this.hashToken(rawToken);

    const storedToken = await this.refreshTokenRepo.findOne({
      where: { tokenHash, isRevoked: false },
      relations: ['user', 'user.userRoles', 'user.userRoles.role'],
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid or revoked refresh token');
    }

    if (storedToken.expiresAt < new Date()) {
      storedToken.isRevoked = true;
      storedToken.revokedAt = new Date();
      await this.refreshTokenRepo.save(storedToken);

      throw new UnauthorizedException('Refresh token has expired');
    }

    return storedToken.user;
  }

  async revokeAllForUser(userId: string): Promise<void> {
    const result = await this.refreshTokenRepo.update(
      { user: { id: userId }, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() },
    );

    this.logger.log(
      `Revoked ${result.affected || 0} tokens for user ${userId}`,
    );
  }

  async revokeToken(rawToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawToken);

    const result = await this.refreshTokenRepo.update(
      { tokenHash, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() },
    );

    if (result.affected === 0) {
      this.logger.warn(`Attempted to revoke non-existent token`);
    } else {
      this.logger.log(`Revoked refresh token`);
    }
  }

  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.refreshTokenRepo.delete({
      expiresAt: LessThan(new Date()),
    });

    const count = result.affected || 0;

    this.logger.log(`Cleaned up ${count} expired refresh tokens`);

    return count;
  }

  async getActiveTokens(userId: string): Promise<RefreshToken[]> {
    return this.refreshTokenRepo.find({
      where: {
        user: { id: userId },
        isRevoked: false,
      },
      order: { createdAt: 'DESC' },
      select: ['id', 'deviceInfo', 'ipAddress', 'createdAt', 'expiresAt'],
    });
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const entry = await this.revokedTokenRepo.findOne({ where: { token } });
    return !!entry;
  }

  async blacklistAccessToken(token: string) {
    const decoded = this.jwtService.decode(token) as any;
    const expiresAt = new Date(decoded.exp * 1000);
    const entry = this.revokedTokenRepo.create({ token, expiresAt });
    await this.revokedTokenRepo.save(entry);
  }
}
