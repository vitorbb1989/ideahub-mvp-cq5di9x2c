import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UseGuards,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  AuthResponseDto,
  TokenRefreshResponseDto,
  LogoutResponseDto,
} from './dto/auth-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('auth')
@UseInterceptors(ClassSerializerInterceptor)
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Strict rate limiting for registration: 3 attempts per hour per IP
  // Prevents mass account creation attacks
  @Throttle({
    short: { limit: 1, ttl: 1000 }, // 1 per second
    medium: { limit: 2, ttl: 60000 }, // 2 per minute
    long: { limit: 3, ttl: 3600000 }, // 3 per hour
  })
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiResponse({ status: 429, description: 'Too many registration attempts' })
  register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  // Strict rate limiting for login: 5 attempts per 15 minutes per IP
  // Prevents brute force password attacks
  @Throttle({
    short: { limit: 1, ttl: 1000 }, // 1 per second
    medium: { limit: 3, ttl: 60000 }, // 3 per minute
    long: { limit: 5, ttl: 900000 }, // 5 per 15 minutes
  })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  // Rate limiting for refresh: prevent token enumeration
  @Throttle({
    short: { limit: 1, ttl: 1000 }, // 1 per second
    medium: { limit: 5, ttl: 60000 }, // 5 per minute
    long: { limit: 20, ttl: 900000 }, // 20 per 15 minutes
  })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Exchange a valid refresh token for new access and refresh tokens. The old refresh token is invalidated (rotation).',
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully',
    type: TokenRefreshResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Invalid or expired refresh token' })
  @ApiResponse({ status: 429, description: 'Too many refresh attempts' })
  refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<TokenRefreshResponseDto> {
    return this.authService.refreshTokens(
      refreshTokenDto.userId,
      refreshTokenDto.refreshToken,
    );
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout user',
    description: 'Invalidates the refresh token, effectively logging out the user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged out',
    type: LogoutResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  logout(@CurrentUser('id') userId: string): Promise<LogoutResponseDto> {
    return this.authService.logout(userId);
  }
}
