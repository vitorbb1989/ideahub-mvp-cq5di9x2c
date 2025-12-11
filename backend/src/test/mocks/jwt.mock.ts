import { JwtService } from '@nestjs/jwt';
import { createMockJwtPayload, MockJwtPayload } from '../test-utils';

// ============================================
// JWT Service Mock
// ============================================

export interface MockJwtService {
  sign: jest.Mock;
  signAsync: jest.Mock;
  verify: jest.Mock;
  verifyAsync: jest.Mock;
  decode: jest.Mock;
}

export const createMockJwtService = (defaultPayload?: Partial<MockJwtPayload>): MockJwtService => {
  const payload = createMockJwtPayload(defaultPayload);

  return {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
    signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
    verify: jest.fn().mockReturnValue(payload),
    verifyAsync: jest.fn().mockResolvedValue(payload),
    decode: jest.fn().mockReturnValue(payload),
  };
};

// ============================================
// JWT Strategy Mock Payload
// ============================================

export const createMockValidatedUser = (options: { id?: string; email?: string } = {}) => ({
  id: options.id || 'user-1',
  email: options.email || 'test@test.com',
});

// ============================================
// Auth Guard Mock
// ============================================

export const mockJwtAuthGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

// ============================================
// Token Constants for Testing
// ============================================

export const TEST_TOKENS = {
  VALID_ACCESS_TOKEN: 'valid-access-token',
  VALID_REFRESH_TOKEN: 'valid-refresh-token',
  EXPIRED_ACCESS_TOKEN: 'expired-access-token',
  EXPIRED_REFRESH_TOKEN: 'expired-refresh-token',
  INVALID_TOKEN: 'invalid-token',
  MALFORMED_TOKEN: 'not-a-jwt',
};

// ============================================
// JWT Module Test Configuration
// ============================================

export const jwtModuleTestConfig = {
  secret: 'test-secret-key',
  signOptions: { expiresIn: '1h' },
};

export const jwtRefreshModuleTestConfig = {
  secret: 'test-refresh-secret-key',
  signOptions: { expiresIn: '7d' },
};
