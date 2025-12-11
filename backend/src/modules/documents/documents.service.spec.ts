import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { Document, DocumentType } from './entities/document.entity';
import {
  createMockRepository,
  createMockDocument,
  MockRepository,
} from '../../test/test-utils';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let repository: MockRepository<Document>;

  const userId = 'user-123';
  const documentId = 'doc-456';

  const mockDocument = createMockDocument({
    id: documentId,
    name: 'Test Document',
    type: DocumentType.FILE,
    content: 'Test content',
    userId,
    versions: [
      {
        id: 'version-1',
        content: 'Initial content',
        createdAt: '2025-01-01T00:00:00.000Z',
        description: 'Initial version',
      },
    ],
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    repository = createMockRepository<Document>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        {
          provide: getRepositoryToken(Document),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
  });

  describe('create', () => {
    const createDocumentDto = {
      name: 'New Document',
      type: DocumentType.FILE,
      content: 'Document content',
    };

    it('should create document with valid data', async () => {
      const expectedDocument = createMockDocument({
        ...createDocumentDto,
        userId,
      });

      repository.create.mockReturnValue(expectedDocument);
      repository.save.mockResolvedValue(expectedDocument);

      const result = await service.create(userId, createDocumentDto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: createDocumentDto.name,
          type: createDocumentDto.type,
          content: createDocumentDto.content,
          userId,
        }),
      );
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(expectedDocument);
    });

    it('should initialize versions array with initial version when content provided', async () => {
      repository.create.mockImplementation((data) => data as Document);
      repository.save.mockImplementation((doc) => Promise.resolve(doc as Document));

      const result = await service.create(userId, createDocumentDto);

      expect(result.versions).toBeDefined();
      expect(result.versions).toHaveLength(1);
      expect(result.versions[0]).toMatchObject({
        content: createDocumentDto.content,
        description: 'Initial version',
      });
      expect(result.versions[0].id).toBeDefined();
      expect(result.versions[0].createdAt).toBeDefined();
    });

    it('should initialize versions as empty array when no content provided', async () => {
      const dtoWithoutContent = { name: 'Empty Doc', type: DocumentType.FILE };

      repository.create.mockImplementation((data) => data as Document);
      repository.save.mockImplementation((doc) => Promise.resolve(doc as Document));

      const result = await service.create(userId, dtoWithoutContent);

      expect(result.versions).toEqual([]);
    });

    it('should set userId on created document', async () => {
      repository.create.mockImplementation((data) => data as Document);
      repository.save.mockImplementation((doc) => Promise.resolve(doc as Document));

      const result = await service.create(userId, createDocumentDto);

      expect(result.userId).toBe(userId);
    });

    it('should create folder type document', async () => {
      const folderDto = { name: 'My Folder', type: DocumentType.FOLDER };

      repository.create.mockImplementation((data) => data as Document);
      repository.save.mockImplementation((doc) => Promise.resolve(doc as Document));

      const result = await service.create(userId, folderDto);

      expect(result.type).toBe(DocumentType.FOLDER);
      expect(result.versions).toEqual([]);
    });
  });

  describe('findAll', () => {
    const paginationQuery = { page: 1, limit: 10 };

    it('should return only documents belonging to the user (ownership)', async () => {
      const userDocuments = [
        createMockDocument({ id: 'doc-1', userId }),
        createMockDocument({ id: 'doc-2', userId }),
      ];

      repository.findAndCount.mockResolvedValue([userDocuments, 2]);

      const result = await service.findAll(userId, paginationQuery);

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
        }),
      );
      expect(result.data).toEqual(userDocuments);
      expect(result.data.every((doc) => doc.userId === userId)).toBe(true);
    });

    it('should paginate results correctly', async () => {
      const documents = Array.from({ length: 5 }, (_, i) =>
        createMockDocument({ id: `doc-${i}`, userId }),
      );

      repository.findAndCount.mockResolvedValue([documents, 50]);

      const result = await service.findAll(userId, { page: 2, limit: 5 });

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        }),
      );
      expect(result.data).toHaveLength(5);
    });

    it('should not return soft-deleted documents', async () => {
      const activeDocuments = [
        createMockDocument({ id: 'active-doc', userId, deletedAt: null }),
      ];

      repository.findAndCount.mockResolvedValue([activeDocuments, 1]);

      const result = await service.findAll(userId, paginationQuery);

      expect(result.data.every((doc) => doc.deletedAt === null)).toBe(true);
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
    it('should return document with versions belonging to user', async () => {
      repository.findOne.mockResolvedValue(mockDocument);

      const result = await service.findOne(userId, documentId);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: documentId, userId },
      });
      expect(result).toEqual(mockDocument);
      expect(result.versions).toBeDefined();
    });

    it('should throw NotFoundException if document not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(userId, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(userId, 'non-existent')).rejects.toThrow(
        'Document not found',
      );
    });

    it('should throw NotFoundException if document belongs to another user', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('another-user', documentId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDocumentDto = {
      name: 'Updated Name',
      content: 'Updated content',
    };

    it('should update allowed fields', async () => {
      const docCopy = { ...mockDocument, versions: [...(mockDocument.versions || [])] };
      repository.findOne.mockResolvedValue(docCopy);
      repository.save.mockImplementation((doc) => Promise.resolve(doc as Document));

      const result = await service.update(userId, documentId, { name: 'New Name' });

      expect(result.name).toBe('New Name');
    });

    it('should add new version when content changes', async () => {
      const docCopy = {
        ...mockDocument,
        content: 'Original content',
        versions: [
          {
            id: 'v1',
            content: 'Original content',
            createdAt: '2025-01-01T00:00:00.000Z',
            description: 'Initial version',
          },
        ],
      };

      repository.findOne.mockResolvedValue(docCopy);
      repository.save.mockImplementation((doc) => Promise.resolve(doc as Document));

      const result = await service.update(userId, documentId, {
        content: 'New content',
      });

      expect(result.versions).toHaveLength(2);
      expect(result.versions[1].content).toBe('New content');
      expect(result.versions[1].description).toBe('Updated');
    });

    it('should not add version when content is unchanged', async () => {
      const docCopy = {
        ...mockDocument,
        content: 'Same content',
        versions: [{ id: 'v1', content: 'Same content', createdAt: '2025-01-01', description: 'Initial' }],
      };

      repository.findOne.mockResolvedValue(docCopy);
      repository.save.mockImplementation((doc) => Promise.resolve(doc as Document));

      const result = await service.update(userId, documentId, {
        content: 'Same content',
      });

      expect(result.versions).toHaveLength(1);
    });

    it('should initialize versions array if null when content changes', async () => {
      const docWithNullVersions = {
        ...mockDocument,
        content: 'Old content',
        versions: null,
      };

      repository.findOne.mockResolvedValue(docWithNullVersions);
      repository.save.mockImplementation((doc) => Promise.resolve(doc as Document));

      const result = await service.update(userId, documentId, {
        content: 'New content',
      });

      expect(result.versions).toHaveLength(1);
    });

    it('should throw NotFoundException if document not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update(userId, 'non-existent', updateDocumentDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('restoreVersion', () => {
    const documentWithVersions = {
      ...mockDocument,
      content: 'Current content',
      versions: [
        {
          id: 'version-1',
          content: 'Version 1 content',
          createdAt: '2025-01-01T00:00:00.000Z',
          description: 'Initial version',
        },
        {
          id: 'version-2',
          content: 'Version 2 content',
          createdAt: '2025-01-02T00:00:00.000Z',
          description: 'Updated',
        },
      ],
    };

    it('should restore content from previous version', async () => {
      const docCopy = { ...documentWithVersions, versions: [...documentWithVersions.versions] };
      repository.findOne.mockResolvedValue(docCopy);
      repository.save.mockImplementation((doc) => Promise.resolve(doc as Document));

      const result = await service.restoreVersion(userId, documentId, 'version-1');

      expect(result.content).toBe('Version 1 content');
    });

    it('should add restoration entry to version history', async () => {
      const docCopy = { ...documentWithVersions, versions: [...documentWithVersions.versions] };
      repository.findOne.mockResolvedValue(docCopy);
      repository.save.mockImplementation((doc) => Promise.resolve(doc as Document));

      const result = await service.restoreVersion(userId, documentId, 'version-1');

      expect(result.versions.length).toBeGreaterThan(documentWithVersions.versions.length);
      const lastVersion = result.versions[result.versions.length - 1];
      expect(lastVersion.description).toContain('Restored from version version-1');
      expect(lastVersion.content).toBe('Version 1 content');
    });

    it('should throw NotFoundException if version does not exist', async () => {
      repository.findOne.mockResolvedValue(documentWithVersions);

      await expect(
        service.restoreVersion(userId, documentId, 'non-existent-version'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.restoreVersion(userId, documentId, 'non-existent-version'),
      ).rejects.toThrow('Version not found');
    });

    it('should throw NotFoundException if document not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.restoreVersion(userId, 'non-existent', 'version-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle document with empty versions array', async () => {
      const docWithEmptyVersions = { ...mockDocument, versions: [] };
      repository.findOne.mockResolvedValue(docWithEmptyVersions);

      await expect(
        service.restoreVersion(userId, documentId, 'any-version'),
      ).rejects.toThrow('Version not found');
    });
  });

  describe('remove (soft delete)', () => {
    it('should soft delete document', async () => {
      const docCopy = { ...mockDocument };
      repository.findOne.mockResolvedValue(docCopy);
      repository.softRemove.mockResolvedValue({ ...docCopy, deletedAt: new Date() });

      await service.remove(userId, documentId);

      expect(repository.softRemove).toHaveBeenCalledWith(docCopy);
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if document not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(userId, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if document belongs to another user', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('another-user', documentId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('restore', () => {
    const deletedDocument = {
      ...mockDocument,
      deletedAt: new Date(),
    };

    it('should restore soft-deleted document', async () => {
      repository.findOne
        .mockResolvedValueOnce(deletedDocument)
        .mockResolvedValueOnce(mockDocument);
      repository.restore.mockResolvedValue({ affected: 1 });

      const result = await service.restore(userId, documentId);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: documentId, userId },
        withDeleted: true,
      });
      expect(repository.restore).toHaveBeenCalledWith(documentId);
      expect(result.deletedAt).toBeNull();
    });

    it('should throw NotFoundException if document not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.restore(userId, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if document is not deleted', async () => {
      repository.findOne.mockResolvedValue(mockDocument);

      await expect(service.restore(userId, documentId)).rejects.toThrow(
        'Document is not deleted',
      );
    });
  });

  describe('findDeleted', () => {
    it('should return only soft-deleted documents', async () => {
      const deletedDocuments = [
        createMockDocument({ id: 'deleted-1', userId, deletedAt: new Date() }),
        createMockDocument({ id: 'deleted-2', userId, deletedAt: new Date() }),
      ];

      const mockQueryBuilder = {
        withDeleted: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([deletedDocuments, 2]),
      };

      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findDeleted(userId, { page: 1, limit: 10 });

      expect(mockQueryBuilder.withDeleted).toHaveBeenCalled();
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'document.deletedAt IS NOT NULL',
      );
      expect(result.data).toEqual(deletedDocuments);
      expect(result.meta.total).toBe(2);
    });

    it('should paginate deleted documents', async () => {
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
