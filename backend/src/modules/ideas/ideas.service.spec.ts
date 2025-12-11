import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { IdeasService } from './ideas.service';
import { Idea, IdeaStatus, IdeaCategory } from './entities/idea.entity';
import { Document } from '../documents/entities/document.entity';
import {
  createMockRepository,
  createMockIdea,
  MockRepository,
} from '../../test/test-utils';
import {
  createMockQueryRunner,
  createMockDataSource,
  createMockCacheManager,
  MockCacheManager,
} from '../../test/mocks/repository.mock';

describe('IdeasService', () => {
  let service: IdeasService;
  let repository: MockRepository<Idea>;
  let dataSource: ReturnType<typeof createMockDataSource>;
  let queryRunner: ReturnType<typeof createMockQueryRunner>;
  let cacheManager: MockCacheManager;

  const userId = 'user-123';
  const ideaId = 'idea-456';

  const mockIdea = createMockIdea({
    id: ideaId,
    title: 'Test Idea',
    summary: 'Test summary',
    description: 'Test description',
    status: IdeaStatus.INBOX,
    category: IdeaCategory.PRODUCT,
    impact: 8,
    effort: 4,
    priorityScore: 20, // (8/4) * 10
    userId,
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    repository = createMockRepository<Idea>();
    queryRunner = createMockQueryRunner();
    dataSource = createMockDataSource(queryRunner);
    cacheManager = createMockCacheManager();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdeasService,
        {
          provide: getRepositoryToken(Idea),
          useValue: repository,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: CACHE_MANAGER,
          useValue: cacheManager,
        },
      ],
    }).compile();

    service = module.get<IdeasService>(IdeasService);
  });

  describe('create', () => {
    const createIdeaDto = {
      title: 'New Idea',
      summary: 'Summary',
      description: 'Description',
      status: IdeaStatus.INBOX,
      category: IdeaCategory.TECHNOLOGY,
      impact: 7,
      effort: 3,
    };

    it('should create idea with valid data', async () => {
      const expectedIdea = createMockIdea({
        ...createIdeaDto,
        userId,
        priorityScore: 23.33, // (7/3) * 10
      });

      repository.create.mockReturnValue(expectedIdea);
      repository.save.mockResolvedValue(expectedIdea);

      const result = await service.create(userId, createIdeaDto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createIdeaDto,
          userId,
          priorityScore: expect.any(Number),
        }),
      );
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(expectedIdea);
    });

    it('should calculate priorityScore automatically', async () => {
      const dtoWithImpactEffort = {
        title: 'Idea',
        impact: 10,
        effort: 2,
      };

      const expectedScore = 50; // (10/2) * 10

      repository.create.mockImplementation((data) => data as Idea);
      repository.save.mockImplementation((idea) => Promise.resolve(idea as Idea));

      const result = await service.create(userId, dtoWithImpactEffort);

      expect(result.priorityScore).toBe(expectedScore);
    });

    it('should use default impact/effort (5) when not provided', async () => {
      const minimalDto = { title: 'Minimal Idea' };

      repository.create.mockImplementation((data) => data as Idea);
      repository.save.mockImplementation((idea) => Promise.resolve(idea as Idea));

      const result = await service.create(userId, minimalDto);

      expect(result.priorityScore).toBe(10); // (5/5) * 10 = 10
    });

    it('should set userId on created idea', async () => {
      const dto = { title: 'Idea' };

      repository.create.mockImplementation((data) => data as Idea);
      repository.save.mockImplementation((idea) => Promise.resolve(idea as Idea));

      const result = await service.create(userId, dto);

      expect(result.userId).toBe(userId);
    });
  });

  describe('findAll', () => {
    const paginationQuery = { page: 1, limit: 10 };

    it('should return only ideas belonging to the user (ownership)', async () => {
      const userIdeas = [
        createMockIdea({ id: 'idea-1', userId }),
        createMockIdea({ id: 'idea-2', userId }),
      ];

      repository.findAndCount.mockResolvedValue([userIdeas, 2]);

      const result = await service.findAll(userId, paginationQuery);

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
        }),
      );
      expect(result.data).toEqual(userIdeas);
      expect(result.data.every((idea) => idea.userId === userId)).toBe(true);
    });

    it('should paginate results correctly', async () => {
      const ideas = Array.from({ length: 5 }, (_, i) =>
        createMockIdea({ id: `idea-${i}`, userId }),
      );

      repository.findAndCount.mockResolvedValue([ideas, 50]); // 50 total items

      const result = await service.findAll(userId, { page: 2, limit: 5 });

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5, // (page 2 - 1) * limit 5 = 5
          take: 5,
        }),
      );
      expect(result.data).toHaveLength(5);
    });

    it('should not return soft-deleted ideas (TypeORM default behavior)', async () => {
      const activeIdeas = [createMockIdea({ id: 'active-idea', userId, deletedAt: null })];

      repository.findAndCount.mockResolvedValue([activeIdeas, 1]);

      const result = await service.findAll(userId, paginationQuery);

      // TypeORM automatically excludes soft-deleted records
      expect(result.data.every((idea) => idea.deletedAt === null)).toBe(true);
    });

    it('should return correct meta with total, totalPages, hasNextPage', async () => {
      const ideas = Array.from({ length: 10 }, (_, i) =>
        createMockIdea({ id: `idea-${i}`, userId }),
      );

      repository.findAndCount.mockResolvedValue([ideas, 25]); // 25 total, 10 per page

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

    it('should return hasNextPage false on last page', async () => {
      repository.findAndCount.mockResolvedValue([[], 20]);

      const result = await service.findAll(userId, { page: 2, limit: 10 });

      expect(result.meta.hasNextPage).toBe(false);
      expect(result.meta.hasPrevPage).toBe(true);
    });

    it('should use default pagination values when not provided', async () => {
      repository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(userId, {});

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0, // (1-1) * 20
          take: 20, // default limit
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return idea belonging to the user', async () => {
      repository.findOne.mockResolvedValue(mockIdea);

      const result = await service.findOne(userId, ideaId);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: ideaId, userId },
      });
      expect(result).toEqual(mockIdea);
    });

    it('should throw NotFoundException if idea not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(userId, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(userId, 'non-existent')).rejects.toThrow(
        'Idea not found',
      );
    });

    it('should throw NotFoundException if idea belongs to another user', async () => {
      // TypeORM returns null when userId doesn't match because we filter by both id AND userId
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('another-user', ideaId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateIdeaDto = {
      title: 'Updated Title',
      summary: 'Updated summary',
    };

    it('should update allowed fields', async () => {
      const updatedIdea = { ...mockIdea, ...updateIdeaDto };

      repository.findOne.mockResolvedValue({ ...mockIdea });
      repository.save.mockResolvedValue(updatedIdea);

      const result = await service.update(userId, ideaId, updateIdeaDto);

      expect(result.title).toBe('Updated Title');
      expect(result.summary).toBe('Updated summary');
    });

    it('should recalculate priorityScore when impact changes', async () => {
      const updateDto = { impact: 10 }; // effort stays 4, so score = (10/4) * 10 = 25
      const ideaCopy = { ...mockIdea, impact: 8, effort: 4 };

      repository.findOne.mockResolvedValue(ideaCopy);
      repository.save.mockImplementation((idea) => Promise.resolve(idea as Idea));

      const result = await service.update(userId, ideaId, updateDto);

      expect(result.priorityScore).toBe(25);
    });

    it('should recalculate priorityScore when effort changes', async () => {
      const updateDto = { effort: 2 }; // impact stays 8, so score = (8/2) * 10 = 40
      const ideaCopy = { ...mockIdea, impact: 8, effort: 4 };

      repository.findOne.mockResolvedValue(ideaCopy);
      repository.save.mockImplementation((idea) => Promise.resolve(idea as Idea));

      const result = await service.update(userId, ideaId, updateDto);

      expect(result.priorityScore).toBe(40);
    });

    it('should recalculate priorityScore when both impact and effort change', async () => {
      const updateDto = { impact: 6, effort: 3 }; // score = (6/3) * 10 = 20

      repository.findOne.mockResolvedValue({ ...mockIdea });
      repository.save.mockImplementation((idea) => Promise.resolve(idea as Idea));

      const result = await service.update(userId, ideaId, updateDto);

      expect(result.priorityScore).toBe(20);
    });

    it('should not recalculate priorityScore when impact/effort unchanged', async () => {
      const updateDto = { title: 'New Title' };
      const ideaCopy = { ...mockIdea };

      repository.findOne.mockResolvedValue(ideaCopy);
      repository.save.mockImplementation((idea) => Promise.resolve(idea as Idea));

      const result = await service.update(userId, ideaId, updateDto);

      // priorityScore should remain unchanged from mockIdea
      expect(result.priorityScore).toBe(mockIdea.priorityScore);
    });

    it('should throw NotFoundException if idea does not belong to user', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update('another-user', ideaId, updateIdeaDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove (soft delete)', () => {
    it('should soft delete idea (set deletedAt) instead of hard delete', async () => {
      const ideaCopy = { ...mockIdea };
      repository.findOne.mockResolvedValue(ideaCopy);
      repository.softRemove.mockResolvedValue({ ...ideaCopy, deletedAt: new Date() });

      await service.remove(userId, ideaId);

      expect(repository.softRemove).toHaveBeenCalledWith(ideaCopy);
      expect(repository.delete).not.toHaveBeenCalled();
      expect(repository.remove).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if idea does not belong to user', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('another-user', ideaId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('restore', () => {
    const deletedIdea = {
      ...mockIdea,
      deletedAt: new Date(),
    };

    it('should restore soft-deleted idea by clearing deletedAt', async () => {
      repository.findOne
        .mockResolvedValueOnce(deletedIdea) // First call with withDeleted
        .mockResolvedValueOnce(mockIdea); // Second call after restore
      repository.restore.mockResolvedValue({ affected: 1 });

      const result = await service.restore(userId, ideaId);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: ideaId, userId },
        withDeleted: true,
      });
      expect(repository.restore).toHaveBeenCalledWith(ideaId);
      expect(result.deletedAt).toBeNull();
    });

    it('should make restored idea visible in findAll again', async () => {
      repository.findOne
        .mockResolvedValueOnce(deletedIdea)
        .mockResolvedValueOnce(mockIdea);
      repository.restore.mockResolvedValue({ affected: 1 });

      const restoredIdea = await service.restore(userId, ideaId);

      expect(restoredIdea.deletedAt).toBeNull();
    });

    it('should throw NotFoundException if idea not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.restore(userId, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if idea is not deleted', async () => {
      repository.findOne.mockResolvedValue(mockIdea); // not deleted (deletedAt is null)

      await expect(service.restore(userId, ideaId)).rejects.toThrow(
        'Idea is not deleted',
      );
    });
  });

  describe('findDeleted', () => {
    it('should return only soft-deleted ideas', async () => {
      const deletedIdeas = [
        createMockIdea({ id: 'deleted-1', userId, deletedAt: new Date() }),
        createMockIdea({ id: 'deleted-2', userId, deletedAt: new Date() }),
      ];

      const mockQueryBuilder = {
        withDeleted: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([deletedIdeas, 2]),
      };

      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findDeleted(userId, { page: 1, limit: 10 });

      expect(mockQueryBuilder.withDeleted).toHaveBeenCalled();
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'idea.deletedAt IS NOT NULL',
      );
      expect(result.data).toEqual(deletedIdeas);
      expect(result.meta.total).toBe(2);
    });
  });

  describe('createIdeaWithDocument (transaction)', () => {
    const createIdeaDto = {
      title: 'Idea with Doc',
      impact: 7,
      effort: 3,
    };

    const documentData = {
      name: 'Related Document',
      content: 'Document content',
    };

    it('should create idea and document atomically', async () => {
      const savedIdea = createMockIdea({ id: 'new-idea', userId, ...createIdeaDto });
      const savedDocument = { id: 'new-doc', name: documentData.name, userId } as Document;

      queryRunner.manager.create
        .mockReturnValueOnce(savedIdea)
        .mockReturnValueOnce(savedDocument);
      queryRunner.manager.save
        .mockResolvedValueOnce(savedIdea)
        .mockResolvedValueOnce(savedDocument)
        .mockResolvedValueOnce({ ...savedIdea, linkedDocIds: [savedDocument.id] });

      const result = await service.createIdeaWithDocument(userId, createIdeaDto, documentData);

      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
      expect(result.idea).toBeDefined();
      expect(result.document).toBeDefined();
    });

    it('should rollback transaction if document creation fails', async () => {
      const savedIdea = createMockIdea({ id: 'new-idea', userId });

      queryRunner.manager.create.mockReturnValueOnce(savedIdea);
      queryRunner.manager.save
        .mockResolvedValueOnce(savedIdea)
        .mockRejectedValueOnce(new Error('Document creation failed'));

      await expect(
        service.createIdeaWithDocument(userId, createIdeaDto, documentData),
      ).rejects.toThrow('Document creation failed');

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should link document to idea after creation', async () => {
      const savedIdea = createMockIdea({ id: 'new-idea', userId });
      const savedDocument = { id: 'doc-123' } as Document;

      queryRunner.manager.create
        .mockReturnValueOnce(savedIdea)
        .mockReturnValueOnce(savedDocument);
      queryRunner.manager.save
        .mockResolvedValueOnce(savedIdea)
        .mockResolvedValueOnce(savedDocument)
        .mockImplementationOnce((Entity, idea) => {
          expect(idea.linkedDocIds).toContain('doc-123');
          return Promise.resolve(idea);
        });

      await service.createIdeaWithDocument(userId, createIdeaDto, documentData);
    });
  });

  describe('removeWithLinkedDocuments (transaction)', () => {
    const ideaWithDocs = createMockIdea({
      id: ideaId,
      userId,
      linkedDocIds: ['doc-1', 'doc-2'],
    });

    it('should soft delete idea and all linked documents atomically', async () => {
      const doc1 = { id: 'doc-1', userId } as Document;
      const doc2 = { id: 'doc-2', userId } as Document;

      queryRunner.manager.findOne
        .mockResolvedValueOnce(ideaWithDocs) // Find idea
        .mockResolvedValueOnce(doc1) // Find doc-1
        .mockResolvedValueOnce(doc2); // Find doc-2

      queryRunner.manager.softRemove.mockResolvedValue({});

      await service.removeWithLinkedDocuments(userId, ideaId);

      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.softRemove).toHaveBeenCalledTimes(3); // 2 docs + 1 idea
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should rollback if deletion fails midway', async () => {
      queryRunner.manager.findOne.mockResolvedValueOnce(ideaWithDocs);
      queryRunner.manager.softRemove.mockRejectedValueOnce(new Error('DB Error'));

      await expect(
        service.removeWithLinkedDocuments(userId, ideaId),
      ).rejects.toThrow('DB Error');

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if idea not found', async () => {
      queryRunner.manager.findOne.mockResolvedValue(null);

      await expect(
        service.removeWithLinkedDocuments(userId, 'non-existent'),
      ).rejects.toThrow(NotFoundException);

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should handle idea with no linked documents', async () => {
      const ideaWithoutDocs = createMockIdea({ id: ideaId, userId, linkedDocIds: null });

      queryRunner.manager.findOne.mockResolvedValueOnce(ideaWithoutDocs);
      queryRunner.manager.softRemove.mockResolvedValue({});

      await service.removeWithLinkedDocuments(userId, ideaId);

      // Should only soft delete the idea, not loop through documents
      expect(queryRunner.manager.softRemove).toHaveBeenCalledTimes(1);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });
  });

  describe('restoreWithLinkedDocuments (transaction)', () => {
    const deletedIdeaWithDocs = {
      ...createMockIdea({
        id: ideaId,
        userId,
        linkedDocIds: ['doc-1', 'doc-2'],
      }),
      deletedAt: new Date(),
    };

    it('should restore idea and all linked documents atomically', async () => {
      queryRunner.manager.findOne.mockResolvedValue(deletedIdeaWithDocs);
      queryRunner.manager.restore.mockResolvedValue({ affected: 1 });
      repository.findOne.mockResolvedValue(mockIdea);

      const result = await service.restoreWithLinkedDocuments(userId, ideaId);

      expect(queryRunner.manager.restore).toHaveBeenCalledWith(Document, 'doc-1');
      expect(queryRunner.manager.restore).toHaveBeenCalledWith(Document, 'doc-2');
      expect(queryRunner.manager.restore).toHaveBeenCalledWith(Idea, ideaId);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(result).toEqual(mockIdea);
    });

    it('should rollback if restore fails', async () => {
      queryRunner.manager.findOne.mockResolvedValue(deletedIdeaWithDocs);
      queryRunner.manager.restore.mockRejectedValue(new Error('Restore failed'));

      await expect(
        service.restoreWithLinkedDocuments(userId, ideaId),
      ).rejects.toThrow('Restore failed');

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if idea not found', async () => {
      queryRunner.manager.findOne.mockResolvedValue(null);

      await expect(
        service.restoreWithLinkedDocuments(userId, 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if idea is not deleted', async () => {
      queryRunner.manager.findOne.mockResolvedValue(mockIdea); // not deleted

      await expect(
        service.restoreWithLinkedDocuments(userId, ideaId),
      ).rejects.toThrow('Idea is not deleted');
    });
  });

  describe('calculatePriorityScore (private, tested indirectly)', () => {
    it('should calculate score as (impact / effort) * 10', async () => {
      const testCases = [
        { impact: 10, effort: 2, expected: 50 },
        { impact: 8, effort: 4, expected: 20 },
        { impact: 5, effort: 5, expected: 10 },
        { impact: 3, effort: 10, expected: 3 },
        { impact: 7, effort: 3, expected: 23.33 },
      ];

      for (const { impact, effort, expected } of testCases) {
        repository.create.mockImplementation((data) => data as Idea);
        repository.save.mockImplementation((idea) => Promise.resolve(idea as Idea));

        const result = await service.create(userId, { title: 'Test', impact, effort });

        expect(result.priorityScore).toBe(expected);
      }
    });
  });
});
