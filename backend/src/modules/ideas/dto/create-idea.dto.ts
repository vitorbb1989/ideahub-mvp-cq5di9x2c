import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IdeaStatus, IdeaCategory } from '../entities/idea.entity';

class ChecklistItemDto {
  @IsString()
  id: string;

  @IsString()
  text: string;

  @IsOptional()
  completed?: boolean;
}

class AttachmentDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  url: string;

  @IsString()
  type: string;
}

class LinkDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsString()
  url: string;
}

class SnapshotDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsString()
  createdAt: string;
}

class LastSavedStateDto {
  @IsOptional()
  @IsString()
  whereIStopped?: string;

  @IsOptional()
  @IsString()
  whatIWasDoing?: string;

  @IsOptional()
  @IsString()
  nextSteps?: string;

  @IsOptional()
  @IsString()
  savedAt?: string;
}

class TimelineItemDto {
  @IsString()
  id: string;

  @IsString()
  action: string;

  @IsString()
  description: string;

  @IsString()
  timestamp: string;
}

export class CreateIdeaDto {
  @ApiProperty({ example: 'My great idea' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'A brief summary of the idea' })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ example: 'Detailed description of the idea' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: IdeaStatus, default: IdeaStatus.INBOX })
  @IsOptional()
  @IsEnum(IdeaStatus)
  status?: IdeaStatus;

  @ApiPropertyOptional({ enum: IdeaCategory, default: IdeaCategory.OTHER })
  @IsOptional()
  @IsEnum(IdeaCategory)
  category?: IdeaCategory;

  @ApiPropertyOptional({ type: [String], example: ['innovation', 'tech'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ minimum: 1, maximum: 10, default: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  impact?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 10, default: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  effort?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  checklist?: ChecklistItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinkDto)
  links?: LinkDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SnapshotDto)
  snapshots?: SnapshotDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => LastSavedStateDto)
  lastSavedState?: LastSavedStateDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimelineItemDto)
  timeline?: TimelineItemDto[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  linkedDocIds?: string[];
}
