import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@circle-backend/app.module';
import { Repository } from 'typeorm';
import { User } from '@circle-backend/modules/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EmailService } from '@circle-backend/modules/auth/services/email.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let userRepo: Repository<User>;
  let emailService: Partial<EmailService>;

  beforeAll(async () => {
    emailService = {
      generateEmailVerificationToken: jest.fn().mockResolvedValue('test-verification-token'),
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      generatePasswordResetToken: jest.fn().mockResolvedValue('test-reset-token'),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
      validateEmailVerificationToken: jest.fn().mockImplementation(async (token: string) => {
        return userRepo.create({ email: 'verified@example.com', isActive: true, emailVerified: false } as any);
      }),
      validatePasswordResetToken: jest.fn().mockResolvedValue({ id: 'user-id', email: 'reset@example.com' } as any),
      markPasswordResetTokenUsed: jest.fn().mockResolvedValue(undefined),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(EmailService)
    .useValue(emailService)
    .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    userRepo = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Local Auth', () => {
    it('/auth/register (POST)', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'test@example.com', password: 'Password123!' })
        .expect(201);

      expect(res.body.user.email).toBe('test@example.com');
      expect(res.body.verificationToken).toBe('test-verification-token');
    });

    it('/auth/login (POST)', async () => {
      // Save a user manually to DB for login test
      const user = userRepo.create({
        email: 'login@example.com',
        passwordHash: await require('bcrypt').hash('Password123!', 12),
        isActive: true,
        emailVerified: true,
      });
      await userRepo.save(user);

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'login@example.com', password: 'Password123!' })
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
    });
  });

  describe('OAuth', () => {
    it('/auth/oauth/login (POST)', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/oauth/login')
        .send({
          provider: 'GOOGLE',
          providerId: '123',
          email: 'oauth@example.com',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
    });
  });

  describe('Password Reset', () => {
    it('/auth/request-password-reset (POST)', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/request-password-reset')
        .send({ email: 'reset@example.com' })
        .expect(201);

      expect(res.body.message).toBe('Password reset email sent');
    });

    it('/auth/reset-password (POST)', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: 'test-reset-token', newPassword: 'NewPassword123!' })
        .expect(201);

      expect(res.body.message).toBe('Password reset successfully');
    });
  });

  describe('Email Verification', () => {
    it('/auth/verify-email (GET)', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/verify-email')
        .query({ token: 'test-verification-token' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBeDefined();
      expect(res.body.message).toBe('Email verified');
    });
  });

  describe('Refresh Token & Logout', () => {
    it('/auth/refresh-token (POST)', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh-token')
        .send({ refreshToken: 'any-token' })
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
    });
  });
});