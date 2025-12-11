import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ForbiddenException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { LoggerService } from '../../common/logger';
import { createMockUser } from '../../test/test-utils';
import { createMockJwtService } from '../../test/mocks/jwt.mock';
import { createMockLogger } from '../../test/mocks/logger.mock';

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// Mock crypto
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => ({
    toString: jest.fn(() => 'mock-refresh-token-hex-string'),
  })),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Partial<UsersService>>;
  let jwtService: ReturnType<typeof createMockJwtService>;
  let logger: ReturnType<typeof createMockLogger>;

  const mockUser = createMockUser({
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    password: '$2b$10$hashedpassword',
    refreshToken: null,
  });

  const mockUserWithRefreshToken = {
    ...mockUser,
    refreshToken: '$2b$10$hashedrefreshtoken',
  };

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock implementations
    usersService = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      validatePassword: jest.fn(),
      updateRefreshToken: jest.fn(),
      findOneWithRefreshToken: jest.fn(),
    };

    jwtService = createMockJwtService();
    logger = createMockLogger();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: LoggerService, useValue: logger },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Default bcrypt mock implementations
    (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashedtoken');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  describe('register', () => {
    const registerDto = {
      email: 'newuser@example.com',
      name: 'New User',
      password: 'password123',
    };

    it('should create user and return tokens on successful registration', async () => {
      const createdUser = createMockUser({
        id: 'new-user-id',
        email: registerDto.email,
        name: registerDto.name,
      });

      usersService.create!.mockResolvedValue(createdUser);
      usersService.updateRefreshToken!.mockResolvedValue(undefined);

      const result = await service.register(registerDto);

      expect(usersService.create).toHaveBeenCalledWith(registerDto);
      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
        createdUser.id,
        expect.any(String),
      );
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresIn', 900);
      expect(result).toHaveProperty('user');
      expect(result.user.id).toBe(createdUser.id);
      expect(result.user.email).toBe(createdUser.email);
    });

    it('should hash password correctly via UsersService', async () => {
      const createdUser = createMockUser({
        id: 'new-user-id',
        email: registerDto.email,
      });

      usersService.create!.mockResolvedValue(createdUser);
      usersService.updateRefreshToken!.mockResolvedValue(undefined);

      await service.register(registerDto);

      // Verify that create was called (UsersService handles hashing)
      expect(usersService.create).toHaveBeenCalledWith(registerDto);
    });

    it('should return access and refresh tokens', async () => {
      const createdUser = createMockUser({
        id: 'new-user-id',
        email: registerDto.email,
      });

      usersService.create!.mockResolvedValue(createdUser);
      usersService.updateRefreshToken!.mockResolvedValue(undefined);
      jwtService.sign.mockReturnValue('mock-access-token');

      const result = await service.register(registerDto);

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token-hex-string');
    });

    it('should throw error if email already exists', async () => {
      usersService.create!.mockRejectedValue(
        new ConflictException('Email already exists'),
      );

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      await expect(service.register(registerDto)).rejects.toThrow('Email already exists');
    });

    it('should log registration attempt and success', async () => {
      const createdUser = createMockUser({ id: 'new-user-id', email: registerDto.email });
      usersService.create!.mockResolvedValue(createdUser);
      usersService.updateRefreshToken!.mockResolvedValue(undefined);

      await service.register(registerDto);

      expect(logger.log).toHaveBeenCalledWith(
        'Registration attempt',
        expect.objectContaining({ email: registerDto.email }),
      );
      expect(logger.log).toHaveBeenCalledWith(
        'User registered successfully',
        expect.objectContaining({ userId: createdUser.id }),
      );
    });

    it('should log warning on registration failure', async () => {
      usersService.create!.mockRejectedValue(new Error('Database error'));

      await expect(service.register(registerDto)).rejects.toThrow();

      expect(logger.warn).toHaveBeenCalledWith(
        'Registration failed',
        expect.objectContaining({ email: registerDto.email }),
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should return tokens on successful login with correct credentials', async () => {
      usersService.findByEmail!.mockResolvedValue(mockUser);
      usersService.validatePassword!.mockResolvedValue(true);
      usersService.updateRefreshToken!.mockResolvedValue(undefined);
      jwtService.sign.mockReturnValue('mock-access-token');

      const result = await service.login(loginDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(usersService.validatePassword).toHaveBeenCalledWith(mockUser, loginDto.password);
      expect(result).toHaveProperty('accessToken', 'mock-access-token');
      expect(result).toHaveProperty('refreshToken', 'mock-refresh-token-hex-string');
      expect(result).toHaveProperty('expiresIn', 900);
      expect(result.user.id).toBe(mockUser.id);
    });

    it('should save hashed refresh token to user on login', async () => {
      usersService.findByEmail!.mockResolvedValue(mockUser);
      usersService.validatePassword!.mockResolvedValue(true);
      usersService.updateRefreshToken!.mockResolvedValue(undefined);

      await service.login(loginDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('mock-refresh-token-hex-string', 10);
      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        '$2b$10$hashedtoken',
      );
    });

    it('should throw UnauthorizedException if email does not exist', async () => {
      usersService.findByEmail!.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      usersService.findByEmail!.mockResolvedValue(mockUser);
      usersService.validatePassword!.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should log login attempt and success', async () => {
      usersService.findByEmail!.mockResolvedValue(mockUser);
      usersService.validatePassword!.mockResolvedValue(true);
      usersService.updateRefreshToken!.mockResolvedValue(undefined);

      await service.login(loginDto);

      expect(logger.log).toHaveBeenCalledWith(
        'Login attempt',
        expect.objectContaining({ email: loginDto.email }),
      );
      expect(logger.log).toHaveBeenCalledWith(
        'User logged in successfully',
        expect.objectContaining({ userId: mockUser.id }),
      );
    });

    it('should log warning when user not found', async () => {
      usersService.findByEmail!.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow();

      expect(logger.warn).toHaveBeenCalledWith(
        'Login failed - user not found',
        expect.objectContaining({ reason: 'user_not_found' }),
      );
    });

    it('should log warning when password is invalid', async () => {
      usersService.findByEmail!.mockResolvedValue(mockUser);
      usersService.validatePassword!.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow();

      expect(logger.warn).toHaveBeenCalledWith(
        'Login failed - invalid password',
        expect.objectContaining({ reason: 'invalid_password' }),
      );
    });
  });

  describe('refreshTokens', () => {
    const userId = 'user-123';
    const validRefreshToken = 'valid-refresh-token';

    it('should generate new tokens with valid refresh token', async () => {
      usersService.findOneWithRefreshToken!.mockResolvedValue(mockUserWithRefreshToken);
      usersService.updateRefreshToken!.mockResolvedValue(undefined);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('new-access-token');

      const result = await service.refreshTokens(userId, validRefreshToken);

      expect(result).toHaveProperty('accessToken', 'new-access-token');
      expect(result).toHaveProperty('refreshToken', 'mock-refresh-token-hex-string');
      expect(result).toHaveProperty('expiresIn', 900);
    });

    it('should rotate refresh token on each use (new token different)', async () => {
      usersService.findOneWithRefreshToken!.mockResolvedValue(mockUserWithRefreshToken);
      usersService.updateRefreshToken!.mockResolvedValue(undefined);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.refreshTokens(userId, validRefreshToken);

      // Verify new refresh token is hashed and saved
      expect(bcrypt.hash).toHaveBeenCalledWith('mock-refresh-token-hex-string', 10);
      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
        userId,
        '$2b$10$hashedtoken',
      );
    });

    it('should throw ForbiddenException if refresh token is invalid', async () => {
      usersService.findOneWithRefreshToken!.mockResolvedValue(mockUserWithRefreshToken);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.refreshTokens(userId, 'invalid-token')).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.refreshTokens(userId, 'invalid-token')).rejects.toThrow(
        'Access denied - refresh token invalid or reused',
      );
    });

    it('should invalidate all tokens on potential token reuse attack', async () => {
      usersService.findOneWithRefreshToken!.mockResolvedValue(mockUserWithRefreshToken);
      usersService.updateRefreshToken!.mockResolvedValue(undefined);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.refreshTokens(userId, 'reused-token')).rejects.toThrow();

      // Should invalidate refresh token (set to null)
      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(userId, null);
    });

    it('should throw ForbiddenException if user not found', async () => {
      usersService.findOneWithRefreshToken!.mockResolvedValue(null);

      await expect(service.refreshTokens(userId, validRefreshToken)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.refreshTokens(userId, validRefreshToken)).rejects.toThrow(
        'Access denied - invalid refresh token',
      );
    });

    it('should throw ForbiddenException if user has no refresh token', async () => {
      const userWithoutToken = { ...mockUser, refreshToken: null };
      usersService.findOneWithRefreshToken!.mockResolvedValue(userWithoutToken);

      await expect(service.refreshTokens(userId, validRefreshToken)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should log token refresh success', async () => {
      usersService.findOneWithRefreshToken!.mockResolvedValue(mockUserWithRefreshToken);
      usersService.updateRefreshToken!.mockResolvedValue(undefined);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.refreshTokens(userId, validRefreshToken);

      expect(logger.log).toHaveBeenCalledWith(
        'Tokens refreshed successfully',
        expect.objectContaining({ userId }),
      );
    });

    it('should log error on token reuse attack detection', async () => {
      usersService.findOneWithRefreshToken!.mockResolvedValue(mockUserWithRefreshToken);
      usersService.updateRefreshToken!.mockResolvedValue(undefined);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.refreshTokens(userId, 'invalid')).rejects.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        'Token refresh failed - possible token reuse attack',
        expect.objectContaining({ severity: 'critical' }),
      );
    });
  });

  describe('logout', () => {
    const userId = 'user-123';

    it('should remove refresh token from user', async () => {
      usersService.updateRefreshToken!.mockResolvedValue(undefined);

      const result = await service.logout(userId);

      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(userId, null);
      expect(result).toEqual({ message: 'Successfully logged out' });
    });

    it('should return success even if user was already logged out', async () => {
      usersService.updateRefreshToken!.mockResolvedValue(undefined);

      const result = await service.logout(userId);

      expect(result).toEqual({ message: 'Successfully logged out' });
    });

    it('should log logout events', async () => {
      usersService.updateRefreshToken!.mockResolvedValue(undefined);

      await service.logout(userId);

      expect(logger.log).toHaveBeenCalledWith(
        'Logout initiated',
        expect.objectContaining({ userId }),
      );
      expect(logger.log).toHaveBeenCalledWith(
        'User logged out successfully',
        expect.objectContaining({ userId }),
      );
    });
  });

  describe('generateAuthResponse (private method, tested indirectly)', () => {
    it('should generate JWT with correct payload', async () => {
      usersService.findByEmail!.mockResolvedValue(mockUser);
      usersService.validatePassword!.mockResolvedValue(true);
      usersService.updateRefreshToken!.mockResolvedValue(undefined);

      await service.login({ email: mockUser.email, password: 'password' });

      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: mockUser.id, email: mockUser.email },
        { expiresIn: '15m' },
      );
    });

    it('should include user data without sensitive fields in response', async () => {
      usersService.findByEmail!.mockResolvedValue(mockUser);
      usersService.validatePassword!.mockResolvedValue(true);
      usersService.updateRefreshToken!.mockResolvedValue(undefined);

      const result = await service.login({ email: mockUser.email, password: 'password' });

      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        avatar: mockUser.avatar,
      });
      // Should not include password or refreshToken
      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('refreshToken');
    });
  });
});
