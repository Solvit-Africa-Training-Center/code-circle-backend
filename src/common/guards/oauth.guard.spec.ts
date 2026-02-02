import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { OAuthGuard } from './oauth.guard';
import { AuthProvider } from '@circle-backend/modules/auth/enums/auth-provider';

jest.mock('@nestjs/passport', () => {
  const actual = jest.requireActual('@nestjs/passport');
  return {
    ...actual,
    AuthGuard: (strategy: string) => {
      return class {
        canActivate(context: ExecutionContext) {
          const request = context.switchToHttp().getRequest();
          const rawProvider = request?.params?.provider;
          if (!rawProvider) throw new Error('OAuth provider not specified');

          const provider = String(rawProvider).toLowerCase();
          if (!['google', 'github', 'linkedin'].includes(provider))
            throw new Error(`Unsupported OAuth provider: ${rawProvider}`);

          return true;
        }

        handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
          const provider = context.switchToHttp().getRequest()?.params?.provider;
          if (err || !user) {
            throw err || new UnauthorizedException(`${provider} OAuth login failed`);
          }
          return user;
        }

        getAuthenticateOptions(context: ExecutionContext) {
          return { session: false };
        }
      };
    },
  };
});

describe('OAuthGuard', () => {
  let googleGuard: InstanceType<ReturnType<typeof OAuthGuard>>;
  let githubGuard: InstanceType<ReturnType<typeof OAuthGuard>>;
  let linkedinGuard: InstanceType<ReturnType<typeof OAuthGuard>>;

  const createMockContext = (provider?: AuthProvider): ExecutionContext => ({
    switchToHttp: () => ({
      getRequest: () => ({
        params: { provider },
        query: {},
        body: {},
      }),
      getResponse: () => ({
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      }),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
    getArgs: jest.fn(),
    getArgByIndex: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
    getType: jest.fn(),
  } as any);

  beforeAll(async () => {
    const GoogleGuardClass = OAuthGuard('google');
    const GithubGuardClass = OAuthGuard('github');
    const LinkedinGuardClass = OAuthGuard('linkedin');

    const module: TestingModule = await Test.createTestingModule({
      providers: [GoogleGuardClass, GithubGuardClass, LinkedinGuardClass],
    }).compile();

    googleGuard = module.get(GoogleGuardClass);
    githubGuard = module.get(GithubGuardClass);
    linkedinGuard = module.get(LinkedinGuardClass);
  });

  describe('canActivate', () => {
    it('should allow access for GOOGLE provider', () => {
      const context = createMockContext(AuthProvider.GOOGLE);
      expect(googleGuard.canActivate(context)).toBe(true);
    });

    it('should allow access for GITHUB provider', () => {
      const context = createMockContext(AuthProvider.GITHUB);
      expect(githubGuard.canActivate(context)).toBe(true);
    });

    it('should allow access for LINKEDIN provider', () => {
      const context = createMockContext(AuthProvider.LINKEDIN);
      expect(linkedinGuard.canActivate(context)).toBe(true);
    });

    it('should throw if provider is invalid', () => {
      const context = createMockContext('FACEBOOK' as any);
      expect(() => googleGuard.canActivate(context)).toThrow(
        'Unsupported OAuth provider: FACEBOOK',
      );
    });

    it('should throw if provider is missing', () => {
      const context = createMockContext(undefined);
      expect(() => googleGuard.canActivate(context)).toThrow(
        'OAuth provider not specified',
      );
    });

    it('should throw UnauthorizedException if user is missing', () => {
      const context = createMockContext(AuthProvider.GOOGLE);
      expect(() =>
        (googleGuard as any).handleRequest(null, null, null, context),
      ).toThrow(UnauthorizedException);
    });

    it('should return user if present', () => {
      const context = createMockContext(AuthProvider.GOOGLE);
      const user = { id: '123' };
      const result = (googleGuard as any).handleRequest(null, user, null, context);
      expect(result).toBe(user);
    });
  });

  describe('getAuthenticateOptions', () => {
    it('should return options with session=false', () => {
      const context = createMockContext(AuthProvider.GOOGLE);
      const options = (googleGuard as any).getAuthenticateOptions(context);
      expect(options).toHaveProperty('session');
      expect(options.session).toBe(false);
    });
  });
});
