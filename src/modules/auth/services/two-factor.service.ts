import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import * as qrcode from 'qrcode';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TwoFactorSecret } from '../entities/two-factor-secret';
import { User } from '@circle-backend/modules/users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { authenticator } from '@otplib/preset-default';

export interface TwoFactorSetup {
  secret: string;
  qrCodeDataUrl: string;
}
@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);
  private readonly appName: string;
  private readonly backupCodeCount: number;

  constructor(
    @InjectRepository(TwoFactorSecret)
    private readonly twoFactorRepo: Repository<TwoFactorSecret>,
    private readonly configService: ConfigService,
  ) {
    this.appName = this.configService.get<string>('APP_NAME') || 'MyApp';
    this.backupCodeCount =
      this.configService.get<number>('BACKUP_CODE_COUNT') || 8;
  }

  async setup(user: User): Promise<TwoFactorSetup> {
    try {
      await this.twoFactorRepo.delete({
        user: { id: user.id },
        enabled: false,
      });

      const secret = authenticator.generateSecret();
      const otpauth = authenticator.keyuri(user.email, this.appName, secret);
      const qrCodeDataUrl = await qrcode.toDataURL(otpauth);

      const secretEntry = this.twoFactorRepo.create({
        user,
        secret,
        enabled: false,
      });
      await this.twoFactorRepo.save(secretEntry);

      this.logger.log(`2FA secret generated for user ${user.id}`);
      return { secret, qrCodeDataUrl };
    } catch (err) {
      this.logger.error(`Failed to setup 2FA for user ${user.id}`, err.stack);
      throw new InternalServerErrorException('Failed to setup 2FA');
    }
  }

  async enable(
    user: User,
    code: string,
  ): Promise<{ message: string; backupCodes?: string[] }> {
    const secretEntry = await this.twoFactorRepo.findOne({
      where: { user: { id: user.id }, enabled: false },
    });

    if (!secretEntry) {
      throw new BadRequestException(
        'No 2FA setup found. Please generate a secret first.',
      );
    }

    const isValid = authenticator.check(code, secretEntry.secret);

    if (!isValid) {
      throw new BadRequestException('Invalid 2FA code. Please try again.');
    }

    await this.twoFactorRepo.update(
      { user: { id: user.id }, enabled: true },
      { enabled: false },
    );

    secretEntry.enabled = true;
    await this.twoFactorRepo.save(secretEntry);

    const backupCodes = await this.generateBackupCodes(user);

    this.logger.log(`2FA enabled for user ${user.id}`);

    return {
      message: '2FA enabled successfully. Please save your backup codes.',
      backupCodes,
    };
  }

  private async generateBackupCodes(
    user: User,
    manager?: Repository<TwoFactorSecret>,
  ): Promise<string[]> {
    const repo = manager || this.twoFactorRepo;
    const crypto = require('crypto');
    const codes: string[] = [];

    for (let i = 0; i < this.backupCodeCount; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }

    const secretEntry = await repo.findOne({
      where: { user: { id: user.id }, enabled: true },
    });
    if (!secretEntry) throw new BadRequestException('No active 2FA found');

    secretEntry.backupCodes = codes.map((c) =>
      crypto.createHash('sha256').update(c).digest('hex'),
    );
    await repo.save(secretEntry);

    this.logger.log(
      `Generated ${codes.length} backup codes for user ${user.id}`,
    );
    return codes;
  }

  async validateToken(user: User, token: string): Promise<boolean> {
    const activeSecret = await this.twoFactorRepo.findOne({
      where: { user: { id: user.id }, enabled: true },
    });

    if (!activeSecret) {
      return true;
    }

    const isTOTPValid = authenticator.check(token, activeSecret.secret);

    if (isTOTPValid) {
      return true;
    }

    const isBackupValid = await this.validateBackupCode(activeSecret, token);

    return isBackupValid;
  }

  async disable(user: User, code: string): Promise<{ message: string }> {
    const secretEntry = await this.twoFactorRepo.findOne({
      where: { user: { id: user.id }, enabled: true },
    });

    if (!secretEntry) {
      throw new BadRequestException('No active 2FA found');
    }

    const isValid =
      authenticator.check(code, secretEntry.secret) ||
      (await this.validateBackupCode(secretEntry, code));

    if (!isValid) {
      throw new BadRequestException('Invalid 2FA code');
    }

    await this.twoFactorRepo.remove(secretEntry);

    this.logger.log(`2FA disabled for user ${user.id}`);

    return { message: '2FA disabled successfully' };
  }

  private async validateBackupCode(
    secretEntry: TwoFactorSecret,
    code: string,
  ): Promise<boolean> {
    if (!secretEntry.backupCodes || secretEntry.backupCodes.length === 0) {
      return false;
    }

    const crypto = require('crypto');
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    const index = secretEntry.backupCodes.indexOf(hashedCode);

    if (index === -1) {
      return false;
    }

    secretEntry.backupCodes.splice(index, 1);
    await this.twoFactorRepo.save(secretEntry);

    this.logger.log(`Backup code used for user ${secretEntry.user.id}`);

    if (secretEntry.backupCodes.length <= 2) {
      this.logger.warn(
        `User ${secretEntry.user.id} has only ${secretEntry.backupCodes.length} backup codes remaining`,
      );
    }

    return true;
  }

  async getActiveSecret(user: User): Promise<TwoFactorSecret | null> {
    return this.twoFactorRepo.findOne({
      where: { user: { id: user.id }, enabled: true },
    });
  }

  async isEnabled(user: User): Promise<boolean> {
    const count = await this.twoFactorRepo.count({
      where: { user: { id: user.id }, enabled: true },
    });

    return count > 0;
  }

  async getRemainingBackupCodesCount(user: User): Promise<number> {
    const secret = await this.getActiveSecret(user);

    if (!secret || !secret.backupCodes) {
      return 0;
    }

    return secret.backupCodes.length;
  }
}
