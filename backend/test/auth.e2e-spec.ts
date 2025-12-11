import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { useContainer } from 'class-validator';
import request from 'supertest';
import { TestAppModule } from './test-app.module';
import { LoggerService } from '../src/common/logger';
import {
  AllExceptionsFilter,
  HttpExceptionFilter,
  ThrottlerExceptionFilter,
} from '../src/common/filters';
import { SanitizePipe } from '../src/common/pipes';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let refreshToken: string;

  // Test user data
  const testUser = {
    name: 'E2E Test User',
    email: `e2e-test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Enable class-validator container
    useContainer(app.select(TestAppModule), { fallbackOnErrors: true });

    // Get logger instance
    const logger = app.get(LoggerService);

    // Apply same configuration as main.ts
    app.useGlobalPipes(
      new SanitizePipe(),
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    app.useGlobalFilters(
      new AllExceptionsFilter(logger),
      new HttpExceptionFilter(logger),
      new ThrottlerExceptionFilter(logger),
    );

    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });

    app.setGlobalPrefix('api');

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should create user and return tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('expiresIn');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.name).toBe(testUser.name);
      expect(response.body.user).not.toHaveProperty('password');

      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('should return 400 for duplicate email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'Another User',
          email: testUser.email, // same email
          password: 'AnotherPassword123!',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: 'not-an-email',
          password: 'TestPassword123!',
        })
        .expect(400);
    });

    it('should return 400 for missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'missing-name@example.com',
          // name and password missing
        })
        .expect(400);
    });

    it('should return 400 for password too short', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: 'short-pass@example.com',
          password: '123', // too short
        })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should return tokens for valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('expiresIn');
      expect(response.body).toHaveProperty('user');

      // Update tokens for subsequent tests
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('should return 401 for invalid password', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401);
    });

    it('should return 401 for non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPassword123!',
        })
        .expect(401);
    });

    it('should return 400 for missing email', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          password: 'TestPassword123!',
        })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should return new tokens with valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('expiresIn');

      // Update tokens (rotation)
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('should return 401 without access token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });

    it('should return 403 with invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(403);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should invalidate refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('logged out');
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .expect(401);
    });
  });

  describe('Security Tests', () => {
    let newAccessToken: string;

    beforeAll(async () => {
      // Create new user for security tests
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'Security Test User',
          email: `security-test-${Date.now()}@example.com`,
          password: 'SecurePassword123!',
        });

      newAccessToken = loginResponse.body.accessToken;
    });

    it('should return 401 for protected endpoints without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/ideas')
        .expect(401);
    });

    it('should return 401 for invalid token format', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/ideas')
        .set('Authorization', 'InvalidToken')
        .expect(401);
    });

    it('should return 401 for malformed JWT', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/ideas')
        .set('Authorization', 'Bearer not-a-valid-jwt')
        .expect(401);
    });

    it('should allow access with valid token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/ideas')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);
    });
  });
});
