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

describe('Ideas (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let secondUserToken: string;
  let createdIdeaId: string;

  // Test users
  const testUser = {
    name: 'Ideas Test User',
    email: `ideas-test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
  };

  const secondUser = {
    name: 'Second Test User',
    email: `second-test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
  };

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

    // Create test users and get tokens
    const userResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testUser);
    accessToken = userResponse.body.accessToken;

    const secondUserResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(secondUser);
    secondUserToken = secondUserResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/ideas', () => {
    it('should create idea with valid data (authenticated)', async () => {
      const ideaData = {
        title: 'E2E Test Idea',
        summary: 'This is a test idea created during E2E testing',
        description: 'Full description of the test idea',
        status: 'inbox',
        category: 'technology',
        impact: 8,
        effort: 4,
        tags: ['e2e', 'test'],
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/ideas')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(ideaData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(ideaData.title);
      expect(response.body.summary).toBe(ideaData.summary);
      expect(response.body.impact).toBe(ideaData.impact);
      expect(response.body.effort).toBe(ideaData.effort);
      expect(response.body).toHaveProperty('priorityScore');
      expect(response.body.priorityScore).toBe(20); // (8/4) * 10

      createdIdeaId = response.body.id;
    });

    it('should return 401 when creating idea without token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/ideas')
        .send({
          title: 'Unauthorized Idea',
          summary: 'This should fail',
        })
        .expect(401);
    });

    it('should return 400 for missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/ideas')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          // title is required but missing
          summary: 'Missing title',
        })
        .expect(400);
    });

    it('should sanitize HTML from input fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/ideas')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: '<script>alert("xss")</script>Safe Title',
          summary: 'Clean summary',
        })
        .expect(201);

      // XSS should be sanitized
      expect(response.body.title).not.toContain('<script>');
      expect(response.body.title).toContain('Safe Title');
    });
  });

  describe('GET /api/v1/ideas', () => {
    it('should return paginated list of ideas', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/ideas')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('limit');
      expect(response.body.meta).toHaveProperty('totalPages');
      expect(response.body.meta).toHaveProperty('hasNextPage');
      expect(response.body.meta).toHaveProperty('hasPrevPage');
    });

    it('should support pagination query params', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/ideas?page=1&limit=5')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(5);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/ideas')
        .expect(401);
    });

    it('should only return ideas owned by the user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/ideas')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // All returned ideas should belong to the authenticated user
      for (const idea of response.body.data) {
        expect(idea).toHaveProperty('userId');
      }
    });
  });

  describe('GET /api/v1/ideas/:id', () => {
    it('should return specific idea by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/ideas/${createdIdeaId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.id).toBe(createdIdeaId);
      expect(response.body.title).toBe('E2E Test Idea');
    });

    it('should return 404 for non-existent idea', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/ideas/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 404 when accessing another users idea', async () => {
      // Second user tries to access first user's idea
      await request(app.getHttpServer())
        .get(`/api/v1/ideas/${createdIdeaId}`)
        .set('Authorization', `Bearer ${secondUserToken}`)
        .expect(404);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/ideas/${createdIdeaId}`)
        .expect(401);
    });
  });

  describe('PATCH /api/v1/ideas/:id', () => {
    it('should update idea with valid data', async () => {
      const updateData = {
        title: 'Updated E2E Test Idea',
        impact: 10,
        effort: 2,
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/ideas/${createdIdeaId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.impact).toBe(updateData.impact);
      expect(response.body.effort).toBe(updateData.effort);
      expect(response.body.priorityScore).toBe(50); // (10/2) * 10
    });

    it('should return 404 when updating another users idea', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/ideas/${createdIdeaId}`)
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send({ title: 'Hacked Title' })
        .expect(404);
    });

    it('should return 404 for non-existent idea', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/ideas/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Updated Title' })
        .expect(404);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/ideas/${createdIdeaId}`)
        .send({ title: 'Unauthorized Update' })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/ideas/:id (Soft Delete)', () => {
    let ideaToDeleteId: string;

    beforeAll(async () => {
      // Create an idea to delete
      const response = await request(app.getHttpServer())
        .post('/api/v1/ideas')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Idea to Delete',
          summary: 'This idea will be soft deleted',
        });

      ideaToDeleteId = response.body.id;
    });

    it('should soft delete idea', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/ideas/${ideaToDeleteId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should not return deleted idea in list', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/ideas')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const deletedIdea = response.body.data.find(
        (idea: any) => idea.id === ideaToDeleteId,
      );
      expect(deletedIdea).toBeUndefined();
    });

    it('should return 404 when accessing deleted idea', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/ideas/${ideaToDeleteId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 404 when deleting another users idea', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/ideas/${createdIdeaId}`)
        .set('Authorization', `Bearer ${secondUserToken}`)
        .expect(404);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/ideas/${createdIdeaId}`)
        .expect(401);
    });
  });

  describe('Validation Tests', () => {
    it('should return 400 for invalid impact value (> 10)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/ideas')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Invalid Impact',
          impact: 15, // max is 10
        })
        .expect(400);
    });

    it('should return 400 for invalid effort value (< 1)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/ideas')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Invalid Effort',
          effort: 0, // min is 1
        })
        .expect(400);
    });

    it('should return 400 for invalid status enum', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/ideas')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Invalid Status',
          status: 'not-a-valid-status',
        })
        .expect(400);
    });

    it('should return 400 for invalid category enum', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/ideas')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Invalid Category',
          category: 'not-a-valid-category',
        })
        .expect(400);
    });
  });
});
