import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for refresh token request
 * Used to exchange a valid refresh token for new access + refresh tokens
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Refresh token received from login or previous refresh',
    example: 'a1b2c3d4e5f6g7h8i9j0...',
  })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}
