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

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    useContainer(app.select(TestAppModule), { fallbackOnErrors: true });

    const logger = app.get(LoggerService);

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

  describe('Health Checks', () => {
    it('GET /api/v1/health should return health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');
    });

    it('GET /api/v1/health/live should return liveness status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health/live')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');
    });

    it('GET /api/v1/health/ready should return readiness status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health/ready')
        .expect(200);

      expect(response.body).toHaveProperty('status');
    });
  });

  describe('API Versioning', () => {
    it('should respond to versioned endpoints', async () => {
      // Health endpoint should work with v1 prefix
      await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);
    });

    it('should return 404 for non-versioned API calls', async () => {
      // Without version prefix, should not match
      await request(app.getHttpServer())
        .get('/api/health')
        .expect(404);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in response', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      // Helmet adds various security headers
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/non-existent-route')
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body).toHaveProperty('message');
    });

    it('should return proper error format for exceptions', async () => {
      // Try to access protected route without token
      const response = await request(app.getHttpServer())
        .get('/api/v1/ideas')
        .expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path');
    });
  });
});
