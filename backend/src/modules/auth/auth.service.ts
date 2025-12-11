import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/entities/user.entity';
import {
  AuthResponseDto,
  TokenRefreshResponseDto,
  LogoutResponseDto,
} from './dto/auth-response.dto';
import { LoggerService } from '../../common/logger';

// Token configuration
const ACCESS_TOKEN_EXPIRES_IN = '15m'; // 15 minutes
const ACCESS_TOKEN_EXPIRES_SECONDS = 900; // 15 minutes in seconds
const REFRESH_TOKEN_BYTES = 32; // 256 bits of randomness
const BCRYPT_SALT_ROUNDS = 10;

/**
 * Authentication Service
 *
 * Handles user authentication with JWT access tokens and secure refresh tokens.
 * All authentication events are logged for security monitoring and audit trails.
 */
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private logger: LoggerService,
  ) {
    this.logger.setContext('AuthService');
  }

  /**
   * Register a new user and return tokens
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    this.logger.log('Registration attempt', {
      email: registerDto.email,
      event: 'register_attempt',
    });

    try {
      const user = await this.usersService.create(registerDto);
      const response = await this.generateAuthResponse(user);

      this.logger.log('User registered successfully', {
        userId: user.id,
        email: user.email,
        event: 'register_success',
      });

      return response;
    } catch (error) {
      this.logger.warn('Registration failed', {
        email: registerDto.email,
        event: 'register_failed',
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Login user with email and password
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    this.logger.log('Login attempt', {
      email: loginDto.email,
      event: 'login_attempt',
    });

    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      this.logger.warn('Login failed - user not found', {
        email: loginDto.email,
        event: 'login_failed',
        reason: 'user_not_found',
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      user,
      loginDto.password,
    );

    if (!isPasswordValid) {
      this.logger.warn('Login failed - invalid password', {
        userId: user.id,
        email: loginDto.email,
        event: 'login_failed',
        reason: 'invalid_password',
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const response = await this.generateAuthResponse(user);

    this.logger.log('User logged in successfully', {
      userId: user.id,
      email: user.email,
      event: 'login_success',
    });

    return response;
  }

  /**
   * Refresh tokens using a valid refresh token
   * Implements token rotation - each use generates a new refresh token
   */
  async refreshTokens(
    userId: string,
    refreshToken: string,
  ): Promise<TokenRefreshResponseDto> {
    this.logger.debug('Token refresh attempt', {
      userId,
      event: 'token_refresh_attempt',
    });

    // Get user with refresh token
    const user = await this.usersService.findOneWithRefreshToken(userId);

    if (!user || !user.refreshToken) {
      this.logger.warn('Token refresh failed - no valid refresh token', {
        userId,
        event: 'token_refresh_failed',
        reason: 'no_refresh_token',
      });
      throw new ForbiddenException('Access denied - invalid refresh token');
    }

    // Validate refresh token
    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );

    if (!isRefreshTokenValid) {
      // Possible token reuse attack - invalidate all tokens
      this.logger.error('Token refresh failed - possible token reuse attack', {
        userId,
        event: 'token_refresh_failed',
        reason: 'token_reuse_attack',
        severity: 'critical',
      });

      await this.usersService.updateRefreshToken(userId, null);
      throw new ForbiddenException('Access denied - refresh token invalid or reused');
    }

    // Generate new tokens (rotation)
    const tokens = await this.generateTokens(user);

    // Hash and store new refresh token
    const hashedRefreshToken = await bcrypt.hash(
      tokens.refreshToken,
      BCRYPT_SALT_ROUNDS,
    );
    await this.usersService.updateRefreshToken(userId, hashedRefreshToken);

    this.logger.log('Tokens refreshed successfully', {
      userId,
      event: 'token_refresh_success',
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: ACCESS_TOKEN_EXPIRES_SECONDS,
    };
  }

  /**
   * Logout user by invalidating refresh token
   */
  async logout(userId: string): Promise<LogoutResponseDto> {
    this.logger.log('Logout initiated', {
      userId,
      event: 'logout_attempt',
    });

    await this.usersService.updateRefreshToken(userId, null);

    this.logger.log('User logged out successfully', {
      userId,
      event: 'logout_success',
    });

    return { message: 'Successfully logged out' };
  }

  /**
   * Generate complete auth response with tokens and user data
   */
  private async generateAuthResponse(user: User): Promise<AuthResponseDto> {
    const tokens = await this.generateTokens(user);

    // Hash and store refresh token
    const hashedRefreshToken = await bcrypt.hash(
      tokens.refreshToken,
      BCRYPT_SALT_ROUNDS,
    );
    await this.usersService.updateRefreshToken(user.id, hashedRefreshToken);

    this.logger.debug('Auth tokens generated', {
      userId: user.id,
      event: 'tokens_generated',
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: ACCESS_TOKEN_EXPIRES_SECONDS,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    };
  }

  /**
   * Generate access token (JWT) and refresh token (random string)
   */
  private async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: user.id, email: user.email };

    // Access token: short-lived JWT
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });

    // Refresh token: cryptographically secure random string
    const refreshToken = crypto
      .randomBytes(REFRESH_TOKEN_BYTES)
      .toString('hex');

    return { accessToken, refreshToken };
  }
}
