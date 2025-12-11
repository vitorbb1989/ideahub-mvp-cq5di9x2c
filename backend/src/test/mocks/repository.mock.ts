import { createMockRepository, MockRepository } from '../test-utils';

// Re-export the mock repository factory
export { createMockRepository, MockRepository };

// ============================================
// Cache Manager Mock
// ============================================

export interface MockCacheManager {
  get: jest.Mock;
  set: jest.Mock;
  del: jest.Mock;
  reset: jest.Mock;
  store: {
    keys: jest.Mock;
  };
}

export const createMockCacheManager = (): MockCacheManager => ({
  get: jest.fn().mockResolvedValue(null), // Default: cache miss
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
  reset: jest.fn().mockResolvedValue(undefined),
  store: {
    keys: jest.fn().mockResolvedValue([]),
  },
});

// ============================================
// Pre-configured Repository Mocks
// ============================================

export const createUserRepositoryMock = (): MockRepository => {
  const mock = createMockRepository();

  // Add user-specific method mocks if needed
  return mock;
};

export const createIdeaRepositoryMock = (): MockRepository => {
  const mock = createMockRepository();

  // Add idea-specific method mocks if needed
  return mock;
};

export const createDocumentRepositoryMock = (): MockRepository => {
  const mock = createMockRepository();

  // Add document-specific method mocks if needed
  return mock;
};

export const createPromptRepositoryMock = (): MockRepository => {
  const mock = createMockRepository();

  // Add prompt-specific method mocks if needed
  return mock;
};

// ============================================
// QueryRunner Mock for Transactions
// ============================================

export interface MockQueryRunner {
  connect: jest.Mock;
  startTransaction: jest.Mock;
  commitTransaction: jest.Mock;
  rollbackTransaction: jest.Mock;
  release: jest.Mock;
  manager: {
    save: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    findOne: jest.Mock;
    find: jest.Mock;
    softDelete: jest.Mock;
    softRemove: jest.Mock;
    remove: jest.Mock;
    restore: jest.Mock;
  };
}

export const createMockQueryRunner = (): MockQueryRunner => ({
  connect: jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  release: jest.fn(),
  manager: {
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    softDelete: jest.fn(),
    softRemove: jest.fn(),
    remove: jest.fn(),
    restore: jest.fn(),
  },
});

// ============================================
// DataSource Mock
// ============================================

export interface MockDataSource {
  createQueryRunner: jest.Mock;
  getRepository: jest.Mock;
}

export const createMockDataSource = (queryRunner?: MockQueryRunner): MockDataSource => ({
  createQueryRunner: jest.fn().mockReturnValue(queryRunner || createMockQueryRunner()),
  getRepository: jest.fn().mockReturnValue(createMockRepository()),
});
