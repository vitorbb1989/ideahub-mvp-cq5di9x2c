import { User } from '../modules/users/entities/user.entity';
import { Idea, IdeaStatus, IdeaCategory } from '../modules/ideas/entities/idea.entity';
import { Document, DocumentType } from '../modules/documents/entities/document.entity';
import { Prompt } from '../modules/prompts/entities/prompt.entity';

// ============================================
// Mock Repository Factory
// ============================================

export type MockRepository<T = any> = {
  find: jest.Mock;
  findOne: jest.Mock;
  findOneBy: jest.Mock;
  findAndCount: jest.Mock;
  save: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  remove: jest.Mock;
  softDelete: jest.Mock;
  softRemove: jest.Mock;
  restore: jest.Mock;
  count: jest.Mock;
  createQueryBuilder: jest.Mock;
  manager: {
    transaction: jest.Mock;
  };
};

export const createMockRepository = <T = any>(): MockRepository<T> => {
  const queryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
    getManyAndCount: jest.fn(),
    getCount: jest.fn(),
    execute: jest.fn(),
    setParameter: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
  };

  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    softDelete: jest.fn(),
    softRemove: jest.fn(),
    restore: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    manager: {
      transaction: jest.fn((cb) => cb({
        save: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findOne: jest.fn(),
      })),
    },
  };
};

// ============================================
// Entity Factories
// ============================================

let userIdCounter = 1;
let ideaIdCounter = 1;
let documentIdCounter = 1;
let promptIdCounter = 1;

export const resetIdCounters = () => {
  userIdCounter = 1;
  ideaIdCounter = 1;
  documentIdCounter = 1;
  promptIdCounter = 1;
};

export interface CreateMockUserOptions {
  id?: string;
  email?: string;
  name?: string;
  password?: string;
  refreshToken?: string | null;
  avatar?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export const createMockUser = (options: CreateMockUserOptions = {}): User => {
  const id = options.id || `user-${userIdCounter++}`;
  const now = new Date();

  return {
    id,
    email: options.email || `user${userIdCounter}@test.com`,
    name: options.name || `Test User ${userIdCounter}`,
    password: options.password || '$2b$10$hashedpassword',
    refreshToken: options.refreshToken !== undefined ? options.refreshToken : null,
    avatar: options.avatar || null,
    isActive: options.isActive !== undefined ? options.isActive : true,
    createdAt: options.createdAt || now,
    updatedAt: options.updatedAt || now,
    ideas: [],
    documents: [],
    prompts: [],
  } as User;
};

export interface CreateMockIdeaOptions {
  id?: string;
  title?: string;
  summary?: string;
  description?: string;
  status?: IdeaStatus;
  category?: IdeaCategory;
  tags?: string[];
  impact?: number;
  effort?: number;
  priorityScore?: number;
  checklist?: { id: string; text: string; completed: boolean }[];
  attachments?: { id: string; name: string; url: string; type: string }[];
  links?: { id: string; title: string; url: string }[];
  snapshots?: { id: string; title: string; content: string; createdAt: string }[];
  lastSavedState?: { whereIStopped: string; whatIWasDoing: string; nextSteps: string; savedAt: string };
  timeline?: { id: string; action: string; description: string; timestamp: string }[];
  linkedDocIds?: string[];
  userId?: string;
  user?: User;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export const createMockIdea = (options: CreateMockIdeaOptions = {}): Idea => {
  const id = options.id || `idea-${ideaIdCounter++}`;
  const now = new Date();
  const userId = options.userId || 'user-1';

  return {
    id,
    title: options.title || `Test Idea ${ideaIdCounter}`,
    summary: options.summary || 'Test summary',
    description: options.description || 'Test description',
    status: options.status || IdeaStatus.INBOX,
    category: options.category || IdeaCategory.OTHER,
    tags: options.tags || ['test'],
    impact: options.impact !== undefined ? options.impact : 5,
    effort: options.effort !== undefined ? options.effort : 5,
    priorityScore: options.priorityScore !== undefined ? options.priorityScore : null,
    checklist: options.checklist || null,
    attachments: options.attachments || null,
    links: options.links || null,
    snapshots: options.snapshots || null,
    lastSavedState: options.lastSavedState || null,
    timeline: options.timeline || null,
    linkedDocIds: options.linkedDocIds || null,
    userId,
    user: options.user || createMockUser({ id: userId }),
    createdBy: options.createdBy || userId,
    createdByUser: null,
    updatedBy: options.updatedBy || userId,
    updatedByUser: null,
    createdAt: options.createdAt || now,
    updatedAt: options.updatedAt || now,
    deletedAt: options.deletedAt !== undefined ? options.deletedAt : null,
  } as Idea;
};

export interface CreateMockDocumentOptions {
  id?: string;
  name?: string;
  type?: DocumentType;
  content?: string;
  parentId?: string;
  versions?: { id: string; content: string; createdAt: string; description: string }[];
  userId?: string;
  user?: User;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export const createMockDocument = (options: CreateMockDocumentOptions = {}): Document => {
  const id = options.id || `doc-${documentIdCounter++}`;
  const now = new Date();
  const userId = options.userId || 'user-1';

  return {
    id,
    name: options.name || `Test Document ${documentIdCounter}`,
    type: options.type || DocumentType.FILE,
    content: options.content || 'Test content',
    parentId: options.parentId || null,
    versions: options.versions || null,
    userId,
    user: options.user || createMockUser({ id: userId }),
    createdBy: options.createdBy || userId,
    createdByUser: null,
    updatedBy: options.updatedBy || userId,
    updatedByUser: null,
    createdAt: options.createdAt || now,
    updatedAt: options.updatedAt || now,
    deletedAt: options.deletedAt !== undefined ? options.deletedAt : null,
  } as Document;
};

export interface CreateMockPromptOptions {
  id?: string;
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
  isFavorite?: boolean;
  usageCount?: number;
  userId?: string;
  user?: User;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export const createMockPrompt = (options: CreateMockPromptOptions = {}): Prompt => {
  const id = options.id || `prompt-${promptIdCounter++}`;
  const now = new Date();
  const userId = options.userId || 'user-1';

  return {
    id,
    title: options.title || `Test Prompt ${promptIdCounter}`,
    content: options.content || 'Test prompt content',
    category: options.category || 'general',
    tags: options.tags || ['test'],
    isFavorite: options.isFavorite !== undefined ? options.isFavorite : false,
    usageCount: options.usageCount !== undefined ? options.usageCount : 0,
    userId,
    user: options.user || createMockUser({ id: userId }),
    createdBy: options.createdBy || userId,
    createdByUser: null,
    updatedBy: options.updatedBy || userId,
    updatedByUser: null,
    createdAt: options.createdAt || now,
    updatedAt: options.updatedAt || now,
    deletedAt: options.deletedAt !== undefined ? options.deletedAt : null,
  } as Prompt;
};

// ============================================
// JWT Payload Factory
// ============================================

export interface MockJwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

export const createMockJwtPayload = (options: Partial<MockJwtPayload> = {}): MockJwtPayload => {
  const now = Math.floor(Date.now() / 1000);
  return {
    sub: options.sub || 'user-1',
    email: options.email || 'test@test.com',
    iat: options.iat || now,
    exp: options.exp || now + 3600, // 1 hour from now
  };
};

// ============================================
// Request Mock Factory
// ============================================

export interface MockRequest {
  user: {
    id: string;
    email: string;
  };
  headers: Record<string, string>;
  params: Record<string, string>;
  query: Record<string, string>;
  body: Record<string, any>;
}

export const createMockRequest = (options: Partial<MockRequest> = {}): MockRequest => {
  return {
    user: options.user || { id: 'user-1', email: 'test@test.com' },
    headers: options.headers || {},
    params: options.params || {},
    query: options.query || {},
    body: options.body || {},
  };
};

// ============================================
// Pagination Helper
// ============================================

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export const createPaginatedResponse = <T>(
  items: T[],
  total: number,
  options: PaginationOptions = {},
) => {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const totalPages = Math.ceil(total / limit);

  return {
    data: items,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};
