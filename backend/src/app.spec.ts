import { Test, TestingModule } from '@nestjs/testing';
import {
  createMockRepository,
  createMockUser,
  createMockIdea,
  createMockDocument,
  createMockPrompt,
  resetIdCounters,
} from './test/test-utils';
import { createMockJwtService, createMockLogger } from './test/mocks';

describe('Test Infrastructure', () => {
  beforeEach(() => {
    resetIdCounters();
  });

  describe('Sanity Check', () => {
    it('should pass basic assertion', () => {
      expect(true).toBe(true);
    });

    it('should have working Jest matchers', () => {
      expect(1 + 1).toBe(2);
      expect('hello').toContain('ell');
      expect([1, 2, 3]).toHaveLength(3);
      expect({ a: 1 }).toHaveProperty('a');
    });

    it('should support async/await', async () => {
      const result = await Promise.resolve('async works');
      expect(result).toBe('async works');
    });
  });

  describe('Mock Repository Factory', () => {
    it('should create a mock repository with all methods', () => {
      const mockRepo = createMockRepository();

      expect(mockRepo.find).toBeDefined();
      expect(mockRepo.findOne).toBeDefined();
      expect(mockRepo.findOneBy).toBeDefined();
      expect(mockRepo.findAndCount).toBeDefined();
      expect(mockRepo.save).toBeDefined();
      expect(mockRepo.create).toBeDefined();
      expect(mockRepo.update).toBeDefined();
      expect(mockRepo.delete).toBeDefined();
      expect(mockRepo.softDelete).toBeDefined();
      expect(mockRepo.restore).toBeDefined();
      expect(mockRepo.count).toBeDefined();
      expect(mockRepo.createQueryBuilder).toBeDefined();
      expect(mockRepo.manager.transaction).toBeDefined();
    });

    it('should allow mocking repository methods', async () => {
      const mockRepo = createMockRepository();
      const mockData = [{ id: '1' }, { id: '2' }];

      mockRepo.find.mockResolvedValue(mockData);

      const result = await mockRepo.find();
      expect(result).toEqual(mockData);
      expect(mockRepo.find).toHaveBeenCalled();
    });

    it('should provide chainable query builder', () => {
      const mockRepo = createMockRepository();
      const qb = mockRepo.createQueryBuilder();

      expect(qb.where('id = :id', { id: '1' })).toBe(qb);
      expect(qb.andWhere('active = :active', { active: true })).toBe(qb);
      expect(qb.orderBy('createdAt', 'DESC')).toBe(qb);
      expect(qb.skip(0).take(10)).toBe(qb);
    });
  });

  describe('Entity Factories', () => {
    it('should create mock user with defaults', () => {
      const user = createMockUser();

      expect(user.id).toBeDefined();
      expect(user.email).toBeDefined();
      expect(user.name).toBeDefined();
      expect(user.password).toBeDefined();
      expect(user.isActive).toBe(true);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should create mock user with custom options', () => {
      const user = createMockUser({
        id: 'custom-id',
        email: 'custom@test.com',
        name: 'Custom Name',
        isActive: false,
      });

      expect(user.id).toBe('custom-id');
      expect(user.email).toBe('custom@test.com');
      expect(user.name).toBe('Custom Name');
      expect(user.isActive).toBe(false);
    });

    it('should create mock idea with defaults', () => {
      const idea = createMockIdea();

      expect(idea.id).toBeDefined();
      expect(idea.title).toBeDefined();
      expect(idea.status).toBe('inbox');
      expect(idea.category).toBe('other');
      expect(idea.impact).toBe(5);
      expect(idea.effort).toBe(5);
      expect(idea.userId).toBeDefined();
      expect(idea.deletedAt).toBeNull();
    });

    it('should create mock idea with custom options', () => {
      const idea = createMockIdea({
        title: 'Custom Idea',
        status: 'approved' as any,
        impact: 10,
        effort: 3,
      });

      expect(idea.title).toBe('Custom Idea');
      expect(idea.status).toBe('approved');
      expect(idea.impact).toBe(10);
      expect(idea.effort).toBe(3);
    });

    it('should create mock document with defaults', () => {
      const doc = createMockDocument();

      expect(doc.id).toBeDefined();
      expect(doc.name).toBeDefined();
      expect(doc.type).toBe('file');
      expect(doc.content).toBeDefined();
      expect(doc.userId).toBeDefined();
      expect(doc.deletedAt).toBeNull();
    });

    it('should create mock document with custom options', () => {
      const doc = createMockDocument({
        name: 'Custom Doc',
        type: 'folder' as any,
        parentId: 'parent-1',
      });

      expect(doc.name).toBe('Custom Doc');
      expect(doc.type).toBe('folder');
      expect(doc.parentId).toBe('parent-1');
    });

    it('should create mock prompt with defaults', () => {
      const prompt = createMockPrompt();

      expect(prompt.id).toBeDefined();
      expect(prompt.title).toBeDefined();
      expect(prompt.content).toBeDefined();
      expect(prompt.isFavorite).toBe(false);
      expect(prompt.usageCount).toBe(0);
      expect(prompt.userId).toBeDefined();
      expect(prompt.deletedAt).toBeNull();
    });

    it('should create mock prompt with custom options', () => {
      const prompt = createMockPrompt({
        title: 'Custom Prompt',
        isFavorite: true,
        usageCount: 10,
      });

      expect(prompt.title).toBe('Custom Prompt');
      expect(prompt.isFavorite).toBe(true);
      expect(prompt.usageCount).toBe(10);
    });
  });

  describe('JWT Mock', () => {
    it('should create mock JWT service', () => {
      const jwtService = createMockJwtService();

      expect(jwtService.sign).toBeDefined();
      expect(jwtService.signAsync).toBeDefined();
      expect(jwtService.verify).toBeDefined();
      expect(jwtService.verifyAsync).toBeDefined();
      expect(jwtService.decode).toBeDefined();
    });

    it('should return mock token from sign', () => {
      const jwtService = createMockJwtService();
      const token = jwtService.sign({ sub: 'user-1' });

      expect(token).toBe('mock-jwt-token');
    });

    it('should return mock payload from verify', () => {
      const jwtService = createMockJwtService({ sub: 'user-1', email: 'test@test.com' });
      const payload = jwtService.verify('any-token');

      expect(payload.sub).toBe('user-1');
      expect(payload.email).toBe('test@test.com');
    });
  });

  describe('Logger Mock', () => {
    it('should create mock logger with all methods', () => {
      const logger = createMockLogger();

      expect(logger.log).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.debug).toBeDefined();
      expect(logger.verbose).toBeDefined();
    });

    it('should allow tracking logger calls', () => {
      const logger = createMockLogger();

      logger.log('test message');
      logger.error('error message');

      expect(logger.log).toHaveBeenCalledWith('test message');
      expect(logger.error).toHaveBeenCalledWith('error message');
    });
  });
});
