import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePromptDto {
  @ApiProperty({ example: 'My Prompt Template' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'You are a helpful assistant that...' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ example: 'writing' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ type: [String], example: ['ai', 'writing'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;
}
