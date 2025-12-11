import { ApiProperty } from '@nestjs/swagger';

/**
 * User data returned in authentication responses
 */
export class AuthUserDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', nullable: true })
  avatar: string | null;
}

/**
 * Response DTO for login and refresh endpoints
 */
export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token (short-lived, 15 minutes)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token (long-lived, 7 days). Store securely!',
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Access token expiration time in seconds',
    example: 900,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'User information',
    type: AuthUserDto,
  })
  user: AuthUserDto;
}

/**
 * Response DTO for token refresh (without full user data)
 */
export class TokenRefreshResponseDto {
  @ApiProperty({
    description: 'New JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'New refresh token (old one is invalidated)',
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Access token expiration time in seconds',
    example: 900,
  })
  expiresIn: number;
}

/**
 * Response DTO for logout
 */
export class LogoutResponseDto {
  @ApiProperty({
    description: 'Logout status message',
    example: 'Successfully logged out',
  })
  message: string;
}
