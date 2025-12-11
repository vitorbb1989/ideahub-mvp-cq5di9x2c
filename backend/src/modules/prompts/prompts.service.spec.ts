import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException } from '@nestjs/common';
import { PromptsService } from './prompts.service';
import { Prompt } from './entities/prompt.entity';
import {
  createMockRepository,
  createMockPrompt,
  MockRepository,
} from '../../test/test-utils';
import { createMockCacheManager, MockCacheManager } from '../../test/mocks';

describe('PromptsService', () => {
  let service: PromptsService;
  let repository: MockRepository<Prompt>;
  let cacheManager: MockCacheManager;

  const userId = 'user-123';
  const promptId = 'prompt-456';

  const mockPrompt = createMockPrompt({
    id: promptId,
    title: 'Test Prompt',
    content: 'Test prompt content',
    category: 'general',
    tags: ['test', 'sample'],
    isFavorite: false,
    usageCount: 0,
    userId,
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    repository = createMockRepository<Prompt>();
    cacheManager = createMockCacheManager();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromptsService,
        {
          provide: getRepositoryToken(Prompt),
          useValue: repository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: cacheManager,
        },
      ],
    }).compile();

    service = module.get<PromptsService>(PromptsService);
  });

  describe('create', () => {
    const createPromptDto = {
      title: 'New Prompt',
      content: 'Prompt content here',
      category: 'coding',
      tags: ['javascript', 'react'],
    };

    it('should create prompt with valid data', async () => {
      const expectedPrompt = createMockPrompt({
        ...createPromptDto,
        userId,
      });

      repository.create.mockReturnValue(expectedPrompt);
      repository.save.mockResolvedValue(expectedPrompt);

      const result = await service.create(userId, createPromptDto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createPromptDto,
          userId,
        }),
      );
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(expectedPrompt);
    });

    it('should initialize usageCount to 0 by default', async () => {
      const prompt = createMockPrompt({ userId, usageCount: 0 });
      repository.create.mockReturnValue(prompt);
      repository.save.mockResolvedValue(prompt);

      const result = await service.create(userId, createPromptDto);

      expect(result.usageCount).toBe(0);
    });

    it('should initialize isFavorite to false by default', async () => {
      const prompt = createMockPrompt({ userId, isFavorite: false });
      repository.create.mockReturnValue(prompt);
      repository.save.mockResolvedValue(prompt);

      const result = await service.create(userId, createPromptDto);

      expect(result.isFavorite).toBe(false);
    });

    it('should set userId on created prompt', async () => {
      repository.create.mockImplementation((data) => data as Prompt);
      repository.save.mockImplementation((prompt) => Promise.resolve(prompt as Prompt));

      const result = await service.create(userId, createPromptDto);

      expect(result.userId).toBe(userId);
    });
  });

  describe('findAll', () => {
    const paginationQuery = { page: 1, limit: 10 };

    it('should return only prompts belonging to the user (ownership)', async () => {
      const userPrompts = [
        createMockPrompt({ id: 'prompt-1', userId }),
        createMockPrompt({ id: 'prompt-2', userId }),
      ];

      repository.findAndCount.mockResolvedValue([userPrompts, 2]);

      const result = await service.findAll(userId, paginationQuery);

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
        }),
      );
      expect(result.data).toEqual(userPrompts);
      expect(result.data.every((prompt) => prompt.userId === userId)).toBe(true);
    });

    it('should paginate results correctly', async () => {
      const prompts = Array.from({ length: 5 }, (_, i) =>
        createMockPrompt({ id: `prompt-${i}`, userId }),
      );

      repository.findAndCount.mockResolvedValue([prompts, 50]);

      const result = await service.findAll(userId, { page: 2, limit: 5 });

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        }),
      );
      expect(result.data).toHaveLength(5);
    });

    it('should not return soft-deleted prompts', async () => {
      const activePrompts = [
        createMockPrompt({ id: 'active-prompt', userId, deletedAt: null }),
      ];

      repository.findAndCount.mockResolvedValue([activePrompts, 1]);

      const result = await service.findAll(userId, paginationQuery);

      expect(result.data.every((prompt) => prompt.deletedAt === null)).toBe(true);
    });

    it('should return correct pagination meta', async () => {
      repository.findAndCount.mockResolvedValue([[], 25]);

      const result = await service.findAll(userId, { page: 1, limit: 10 });

      expect(result.meta).toEqual({
        total: 25,
        page: 1,
        limit: 10,
        totalPages: 3,
        hasNextPage: true,
        hasPrevPage: false,
      });
    });

    it('should order by updatedAt DESC', async () => {
      repository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(userId, paginationQuery);

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { updatedAt: 'DESC' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return prompt belonging to user', async () => {
      repository.findOne.mockResolvedValue(mockPrompt);

      const result = await service.findOne(userId, promptId);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: promptId, userId },
      });
      expect(result).toEqual(mockPrompt);
    });

    it('should throw NotFoundException if prompt not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(userId, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(userId, 'non-existent')).rejects.toThrow(
        'Prompt not found',
      );
    });

    it('should throw NotFoundException if prompt belongs to another user', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('another-user', promptId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updatePromptDto = {
      title: 'Updated Title',
      content: 'Updated content',
    };

    it('should update allowed fields', async () => {
      const promptCopy = { ...mockPrompt };
      repository.findOne.mockResolvedValue(promptCopy);
      repository.save.mockImplementation((prompt) => Promise.resolve(prompt as Prompt));

      const result = await service.update(userId, promptId, updatePromptDto);

      expect(result.title).toBe('Updated Title');
      expect(result.content).toBe('Updated content');
    });

    it('should throw NotFoundException if prompt not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update(userId, 'non-existent', updatePromptDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('toggleFavorite', () => {
    it('should toggle isFavorite from false to true', async () => {
      const promptCopy = { ...mockPrompt, isFavorite: false };
      repository.findOne.mockResolvedValue(promptCopy);
      repository.save.mockImplementation((prompt) => Promise.resolve(prompt as Prompt));

      const result = await service.toggleFavorite(userId, promptId);

      expect(result.isFavorite).toBe(true);
    });

    it('should toggle isFavorite from true to false', async () => {
      const favoritePrompt = { ...mockPrompt, isFavorite: true };
      repository.findOne.mockResolvedValue(favoritePrompt);
      repository.save.mockImplementation((prompt) => Promise.resolve(prompt as Prompt));

      const result = await service.toggleFavorite(userId, promptId);

      expect(result.isFavorite).toBe(false);
    });

    it('should return the updated prompt with new favorite state', async () => {
      const promptCopy = { ...mockPrompt, isFavorite: false };
      repository.findOne.mockResolvedValue(promptCopy);
      repository.save.mockImplementation((prompt) => Promise.resolve(prompt as Prompt));

      const result = await service.toggleFavorite(userId, promptId);

      expect(result).toBeDefined();
      expect(result.id).toBe(promptId);
      expect(result.isFavorite).toBe(true);
    });

    it('should throw NotFoundException if prompt not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.toggleFavorite(userId, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('incrementUsageCount', () => {
    it('should increment usageCount by 1', async () => {
      const promptCopy = { ...mockPrompt, usageCount: 5 };
      repository.findOne.mockResolvedValue(promptCopy);
      repository.save.mockImplementation((prompt) => Promise.resolve(prompt as Prompt));

      const result = await service.incrementUsageCount(userId, promptId);

      expect(result.usageCount).toBe(6);
    });

    it('should increment from 0 to 1', async () => {
      const promptCopy = { ...mockPrompt, usageCount: 0 };
      repository.findOne.mockResolvedValue(promptCopy);
      repository.save.mockImplementation((prompt) => Promise.resolve(prompt as Prompt));

      const result = await service.incrementUsageCount(userId, promptId);

      expect(result.usageCount).toBe(1);
    });

    it('should return the updated prompt with new count', async () => {
      const promptCopy = { ...mockPrompt, usageCount: 10 };
      repository.findOne.mockResolvedValue(promptCopy);
      repository.save.mockImplementation((prompt) => Promise.resolve(prompt as Prompt));

      const result = await service.incrementUsageCount(userId, promptId);

      expect(result).toBeDefined();
      expect(result.id).toBe(promptId);
      expect(result.usageCount).toBe(11);
    });

    it('should throw NotFoundException if prompt not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.incrementUsageCount(userId, 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove (soft delete)', () => {
    it('should soft delete prompt', async () => {
      const promptCopy = { ...mockPrompt };
      repository.findOne.mockResolvedValue(promptCopy);
      repository.softRemove.mockResolvedValue({ ...promptCopy, deletedAt: new Date() });

      await service.remove(userId, promptId);

      expect(repository.softRemove).toHaveBeenCalledWith(promptCopy);
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if prompt not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(userId, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('restore', () => {
    const deletedPrompt = {
      ...mockPrompt,
      deletedAt: new Date(),
    };

    it('should restore soft-deleted prompt', async () => {
      repository.findOne
        .mockResolvedValueOnce(deletedPrompt)
        .mockResolvedValueOnce(mockPrompt);
      repository.restore.mockResolvedValue({ affected: 1 });

      const result = await service.restore(userId, promptId);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: promptId, userId },
        withDeleted: true,
      });
      expect(repository.restore).toHaveBeenCalledWith(promptId);
      expect(result.deletedAt).toBeNull();
    });

    it('should throw NotFoundException if prompt not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.restore(userId, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if prompt is not deleted', async () => {
      repository.findOne.mockResolvedValue(mockPrompt);

      await expect(service.restore(userId, promptId)).rejects.toThrow(
        'Prompt is not deleted',
      );
    });
  });

  describe('findDeleted', () => {
    it('should return only soft-deleted prompts', async () => {
      const deletedPrompts = [
        createMockPrompt({ id: 'deleted-1', userId, deletedAt: new Date() }),
        createMockPrompt({ id: 'deleted-2', userId, deletedAt: new Date() }),
      ];

      const mockQueryBuilder = {
        withDeleted: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([deletedPrompts, 2]),
      };

      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findDeleted(userId, { page: 1, limit: 10 });

      expect(mockQueryBuilder.withDeleted).toHaveBeenCalled();
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'prompt.deletedAt IS NOT NULL',
      );
      expect(result.data).toEqual(deletedPrompts);
      expect(result.meta.total).toBe(2);
    });

    it('should paginate deleted prompts', async () => {
      const mockQueryBuilder = {
        withDeleted: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await service.findDeleted(userId, { page: 2, limit: 5 });

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(5);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
    });
  });
});
