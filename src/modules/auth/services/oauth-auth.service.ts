import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { OAuthAccount } from '../entities/oauth-account.entity';
import { User } from '../../users/entities/user.entity';
import { AuthProvider } from '../enums/auth-provider';
import { UserRole } from '../entities/user-role.entity';
import { Role } from '../entities/role.entity';

@Injectable()
export class OAuthAuthService {
  private readonly logger = new Logger(OAuthAuthService.name);
  constructor(
    @InjectRepository(OAuthAccount)
    private readonly oauthRepo: Repository<OAuthAccount>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,

    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}
  
  async loginOrRegister(oauthUser: {
    provider: AuthProvider;
    providerId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    accessToken?: string;
    refreshToken?: string;
  }): Promise<User> {
    const { provider, providerId, email, firstName, lastName, accessToken, refreshToken } =
      oauthUser;

    let oauthAccount = await this.oauthRepo.findOne({
      where: { provider, providerId },
      relations: ['user', 'user.userRoles', 'user.userRoles.role'],
    });

    if (oauthAccount) {
      oauthAccount.accessToken = accessToken;
      oauthAccount.refreshToken = refreshToken;
      await this.oauthRepo.save(oauthAccount);

      this.logger.log(
        `OAuth login for existing account: ${provider}:${providerId} -> User ${oauthAccount.user.id}`,
      );

      return oauthAccount.user;
    }

    let user = await this.userRepo.findOne({
      where: { email },
      relations: ['userRoles', 'userRoles.role'],
    });

    if (!user) {
      user = this.userRepo.create({
        email,
        firstName,
        lastName,
        isActive: true,
        emailVerified: true, 
      });

      await this.userRepo.save(user);

      const memberRole = await this.roleRepo.findOne({ where: { name: 'MEMBER' } });
      if (memberRole) {
        await this.userRoleRepo.save(
          this.userRoleRepo.create({
            user,
            role: memberRole,
          }),
        );

        user = await this.userRepo.findOne({
          where: { id: user.id },
          relations: ['userRoles', 'userRoles.role'],
        });
      } else {
        this.logger.warn('Default role MEMBER not found');
      }

      if (!user) {
        throw new Error('Invariant violation: user must exist before OAuth linking');
      }
      this.logger.log(`New user created via OAuth: ${user.id} (${email})`);
    }

    oauthAccount = this.oauthRepo.create({
      user,
      provider,
      providerId,
      accessToken,
      refreshToken,
    });

    await this.oauthRepo.save(oauthAccount);

    this.logger.log(
      `OAuth account linked: ${provider}:${providerId} -> User ${user.id}`,
    );

    return user;
  }
  async linkAccount(
    user: User,
    provider: AuthProvider,
    oauthData: {
      providerId: string;
      email?: string;
      accessToken?: string;
      refreshToken?: string;
    },
  ): Promise<{ success: boolean; message: string }> {
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const existing = await this.oauthRepo.findOne({
      where: { provider, providerId: oauthData.providerId },
      relations: ['user'],
    });

    if (existing) {
      if (existing.user.id === user.id) {
        throw new BadRequestException(
          `${provider} account is already linked to your account`,
        );
      }
      throw new BadRequestException(
        `${provider} account is already linked to another user`,
      );
    }

    const oauthAccount = this.oauthRepo.create({
      user,
      provider,
      providerId: oauthData.providerId,
      accessToken: oauthData.accessToken,
      refreshToken: oauthData.refreshToken,
    });

    await this.oauthRepo.save(oauthAccount);

    this.logger.log(
      `OAuth account linked: ${provider}:${oauthData.providerId} -> User ${user.id}`,
    );

    return { success: true, message: `${provider} account linked successfully` };
  }

  async unlinkAccount(
    user: User,
    provider: AuthProvider,
  ): Promise<{ success: boolean; message: string }> {
    const account = await this.oauthRepo.findOne({
      where: { user: { id: user.id }, provider },
    });

    if (!account) {
      throw new NotFoundException(`${provider} account not linked`);
    }

    const otherOAuthAccounts = await this.oauthRepo.count({
      where: {
        user: { id: user.id },
        provider: Not(provider),
      },
    });

    if (!user.passwordHash && otherOAuthAccounts === 0) {
      throw new BadRequestException(
        'Cannot unlink the only authentication method. Please set a password first.',
      );
    }

    await this.oauthRepo.remove(account);

    this.logger.log(
      `OAuth account unlinked: ${provider} from User ${user.id}`,
    );

    return { success: true, message: `${provider} account unlinked successfully` };
  }

  async getLinkedAccounts(userId: string): Promise<OAuthAccount[]> {
    return this.oauthRepo.find({
      where: { user: { id: userId } },
      select: ['id', 'provider', 'providerId', 'createdAt'],
    });
  }

  async hasProvider(userId: string, provider: AuthProvider): Promise<boolean> {
    const count = await this.oauthRepo.count({
      where: { user: { id: userId }, provider },
    });

    return count > 0;
  }
}
