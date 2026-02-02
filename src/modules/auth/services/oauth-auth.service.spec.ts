import { Test, TestingModule } from '@nestjs/testing';
import { OAuthAuthService } from './oauth-auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '@circle-backend/modules/users/entities/user.entity';
import { OAuthAccount } from '../entities/oauth-account.entity';
import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';
import { TokenService } from './token.service';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AuthProvider } from '../enums/auth-provider';

describe('OAuthAuthService', () => {
  let service: OAuthAuthService;
  let userRepo: jest.Mocked<Repository<User>>;
  let oauthAccountRepo: jest.Mocked<Repository<OAuthAccount>>;
  let roleRepo: jest.Mocked<Repository<Role>>;
  let userRoleRepo: jest.Mocked<Repository<UserRole>>;
  let tokenService: jest.Mocked<TokenService>;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    emailVerified: true,
    passwordHash: null,
    oauthAccounts: [],
    userRoles: [],
  } as any;

  const mockRole: Role = {
    id: 'role-1',
    name: 'MEMBER',
    scope: 'GLOBAL' as any,
  } as any;

  const mockOAuthAccount: OAuthAccount = {
    id: 'oauth-1',
    userId: 'user-1',
    provider: AuthProvider.GOOGLE,
    providerId: 'google-123',
    user: mockUser,
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OAuthAuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(OAuthAccount),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            find: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Role),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserRole),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: TokenService,
          useValue: {
            issueRefreshToken: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OAuthAuthService>(OAuthAuthService);
    userRepo = module.get(getRepositoryToken(User));
    oauthAccountRepo = module.get(getRepositoryToken(OAuthAccount));
    roleRepo = module.get(getRepositoryToken(Role));
    userRoleRepo = module.get(getRepositoryToken(UserRole));
    tokenService = module.get(TokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('loginOrRegister', () => {
    const oauthDto = {
      provider: AuthProvider.GOOGLE,
      providerId: 'google-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    };

    it('should login existing OAuth user', async () => {
      const userWithOAuth = {
        ...mockUser,
        oauthAccounts: [mockOAuthAccount],
        userRoles: [{ role: mockRole }],
      };

      oauthAccountRepo.findOne.mockResolvedValue({
        ...mockOAuthAccount,
        user: userWithOAuth,
      } as any);

      oauthAccountRepo.save.mockResolvedValue(mockOAuthAccount);

      const result = await service.loginOrRegister(oauthDto);

      expect(oauthAccountRepo.findOne).toHaveBeenCalledWith({
        where: {
          provider: AuthProvider.GOOGLE,
          providerId: 'google-123',
        },
        relations: ['user', 'user.userRoles', 'user.userRoles.role'],
      });
      expect(result).toEqual(userWithOAuth);
    });

    it('should link OAuth to existing email user', async () => {
      const userWithRoles = {
        ...mockUser,
        userRoles: [{ role: mockRole }],
      };

      oauthAccountRepo.findOne.mockResolvedValue(null);
      userRepo.findOne
        .mockResolvedValueOnce(userWithRoles as any)
        .mockResolvedValueOnce(userWithRoles as any);
      
      oauthAccountRepo.create.mockReturnValue(mockOAuthAccount as any);
      oauthAccountRepo.save.mockResolvedValue(mockOAuthAccount);

      const result = await service.loginOrRegister(oauthDto);

      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        relations: ['userRoles', 'userRoles.role'],
      });
      expect(oauthAccountRepo.create).toHaveBeenCalled();
      expect(oauthAccountRepo.save).toHaveBeenCalled();
      expect(result).toEqual(userWithRoles);
    });

    it('should register new user via OAuth', async () => {
      const userWithRoles = {
        ...mockUser,
        userRoles: [{ role: mockRole }],
      };

      oauthAccountRepo.findOne.mockResolvedValue(null);
      userRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(userWithRoles as any);
      
      userRepo.create.mockReturnValue(mockUser);
      userRepo.save.mockResolvedValue(mockUser);
      roleRepo.findOne.mockResolvedValue(mockRole);
      userRoleRepo.create.mockReturnValue({} as any);
      userRoleRepo.save.mockResolvedValue({} as any);
      oauthAccountRepo.create.mockReturnValue(mockOAuthAccount as any);
      oauthAccountRepo.save.mockResolvedValue(mockOAuthAccount);

      const result = await service.loginOrRegister(oauthDto);

      expect(userRepo.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        emailVerified: true,
      });
      expect(roleRepo.findOne).toHaveBeenCalledWith({ where: { name: 'MEMBER' } });
      expect(result).toEqual(userWithRoles);
    });

    it('should throw error if MEMBER role not found', async () => {
      oauthAccountRepo.findOne.mockResolvedValue(null);
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockReturnValue(mockUser);
      userRepo.save.mockResolvedValue(mockUser);
      roleRepo.findOne.mockResolvedValue(null);

      const result = await service.loginOrRegister(oauthDto);
      
      expect(result).toBeDefined();
      expect(roleRepo.findOne).toHaveBeenCalledWith({ where: { name: 'MEMBER' } });
    });
  });

  describe('linkAccount', () => {
    const linkData = {
      provider: AuthProvider.GITHUB,
      providerId: 'github-456',
    };

    it('should link OAuth account to user', async () => {
      oauthAccountRepo.findOne.mockResolvedValue(null);
      oauthAccountRepo.create.mockReturnValue({} as any);
      oauthAccountRepo.save.mockResolvedValue({} as any);

      const result = await service.linkAccount(mockUser, AuthProvider.GITHUB, linkData);

      expect(oauthAccountRepo.findOne).toHaveBeenCalledWith({
        where: {
          provider: AuthProvider.GITHUB,
          providerId: 'github-456',
        },
        relations: ['user'],
      });
      expect(oauthAccountRepo.create).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: expect.stringContaining('linked'),
      });
    });

    it('should throw BadRequestException if account already linked', async () => {
      oauthAccountRepo.findOne.mockResolvedValue(mockOAuthAccount);

      await expect(
        service.linkAccount(mockUser, AuthProvider.GITHUB, linkData)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('unlinkAccount', () => {
    it('should unlink OAuth account', async () => {
      const userWithMultipleAuth = {
        ...mockUser,
        passwordHash: 'hashed-password',
        oauthAccounts: [mockOAuthAccount],
      };

      oauthAccountRepo.findOne.mockResolvedValue(mockOAuthAccount);
      oauthAccountRepo.count.mockResolvedValue(1); 
      oauthAccountRepo.remove.mockResolvedValue(mockOAuthAccount);

      const result = await service.unlinkAccount(
        userWithMultipleAuth as any,
        AuthProvider.GOOGLE,
      );

      expect(oauthAccountRepo.remove).toHaveBeenCalledWith(mockOAuthAccount);
      expect(result).toEqual({
        success: true,
        message: expect.stringContaining('unlinked'),
      });
    });

    it('should throw NotFoundException if OAuth account not found', async () => {
      oauthAccountRepo.findOne.mockResolvedValue(null);

      await expect(
        service.unlinkAccount(mockUser, AuthProvider.GOOGLE),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if trying to unlink only auth method', async () => {
      const userWithOnlyOAuth = {
        ...mockUser,
        passwordHash: null,
        oauthAccounts: [],
      };

      oauthAccountRepo.findOne.mockResolvedValue(mockOAuthAccount);
      oauthAccountRepo.count.mockResolvedValue(0);

      await expect(
        service.unlinkAccount(userWithOnlyOAuth as any, AuthProvider.GOOGLE),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getLinkedAccounts', () => {
    it('should return linked OAuth accounts', async () => {
      const accounts = [mockOAuthAccount];
      oauthAccountRepo.find.mockResolvedValue(accounts);

      const result = await service.getLinkedAccounts('user-1');

      expect(oauthAccountRepo.find).toHaveBeenCalledWith({
        where: { user: { id: 'user-1' } },
        select: ['id', 'provider', 'providerId', 'createdAt'],
      });
      expect(result).toEqual(accounts);
    });
  });

  describe('hasProvider', () => {
    it('should return true if provider is linked', async () => {
      oauthAccountRepo.count.mockResolvedValue(1);

      const result = await service.hasProvider('user-1', AuthProvider.GOOGLE);

      expect(oauthAccountRepo.count).toHaveBeenCalledWith({
        where: { user: { id: 'user-1' }, provider: AuthProvider.GOOGLE },
      });
      expect(result).toBe(true);
    });

    it('should return false if provider is not linked', async () => {
      oauthAccountRepo.count.mockResolvedValue(0);

      const result = await service.hasProvider('user-1', AuthProvider.GOOGLE);

      expect(oauthAccountRepo.count).toHaveBeenCalledWith({
        where: { user: { id: 'user-1' }, provider: AuthProvider.GOOGLE },
      });
      expect(result).toBe(false);
    });
  });
});