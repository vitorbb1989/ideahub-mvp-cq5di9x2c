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
import { IsValidJsonb, IsValidJsonbArray } from '../../../common/validators';
import {
  ChecklistItemSchema,
  AttachmentSchema,
  LinkSchema,
  SnapshotSchema,
  LastSavedStateSchema,
  TimelineItemSchema,
  type ChecklistItem,
  type Attachment,
  type Link,
  type Snapshot,
  type LastSavedState,
  type TimelineItem,
} from '../../../common/schemas';

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

  @ApiPropertyOptional({
    description: 'Checklist items with id (UUID), text (1-500 chars), and completed (boolean)',
    example: [{ id: '550e8400-e29b-41d4-a716-446655440000', text: 'First task', completed: false }],
  })
  @IsOptional()
  @IsValidJsonbArray(ChecklistItemSchema, {
    message: 'checklist: Each item must have id (UUID), text (1-500 chars), and completed (boolean)',
  })
  checklist?: ChecklistItem[];

  @ApiPropertyOptional({
    description: 'Attachments with id (UUID), name, url (valid URL), and type',
    example: [{ id: '550e8400-e29b-41d4-a716-446655440000', name: 'doc.pdf', url: 'https://example.com/doc.pdf', type: 'application/pdf' }],
  })
  @IsOptional()
  @IsValidJsonbArray(AttachmentSchema, {
    message: 'attachments: Each item must have id (UUID), name, url (valid URL), and type',
  })
  attachments?: Attachment[];

  @ApiPropertyOptional({
    description: 'Links with id (UUID), title, and url (valid URL)',
    example: [{ id: '550e8400-e29b-41d4-a716-446655440000', title: 'Reference', url: 'https://example.com' }],
  })
  @IsOptional()
  @IsValidJsonbArray(LinkSchema, {
    message: 'links: Each item must have id (UUID), title, and url (valid URL)',
  })
  links?: Link[];

  @ApiPropertyOptional({
    description: 'Snapshots with id (UUID), title, content, and createdAt (ISO datetime)',
    example: [{ id: '550e8400-e29b-41d4-a716-446655440000', title: 'v1', content: 'Content', createdAt: '2024-01-01T00:00:00Z' }],
  })
  @IsOptional()
  @IsValidJsonbArray(SnapshotSchema, {
    message: 'snapshots: Each item must have id (UUID), title, content, and createdAt (ISO datetime)',
  })
  snapshots?: Snapshot[];

  @ApiPropertyOptional({
    description: 'Last saved state with optional whereIStopped, whatIWasDoing, nextSteps, and savedAt',
  })
  @IsOptional()
  @IsValidJsonb(LastSavedStateSchema, {
    message: 'lastSavedState: Invalid structure. Expected whereIStopped, whatIWasDoing, nextSteps (strings), savedAt (ISO datetime)',
  })
  lastSavedState?: LastSavedState;

  @ApiPropertyOptional({
    description: 'Timeline items with id (UUID), action, description, and timestamp (ISO datetime)',
    example: [{ id: '550e8400-e29b-41d4-a716-446655440000', action: 'created', description: 'Idea created', timestamp: '2024-01-01T00:00:00Z' }],
  })
  @IsOptional()
  @IsValidJsonbArray(TimelineItemSchema, {
    message: 'timeline: Each item must have id (UUID), action, description, and timestamp (ISO datetime)',
  })
  timeline?: TimelineItem[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  linkedDocIds?: string[];
}

/**
 * DTO for creating an idea with an initial document in a single transaction
 */
class InitialDocumentDto {
  @ApiProperty({ example: 'Project Documentation' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Initial content for the document' })
  @IsString()
  content: string;
}

export class CreateIdeaWithDocumentDto {
  @ApiProperty({ type: CreateIdeaDto })
  @ValidateNested()
  @Type(() => CreateIdeaDto)
  idea: CreateIdeaDto;

  @ApiProperty({ type: InitialDocumentDto })
  @ValidateNested()
  @Type(() => InitialDocumentDto)
  document: InitialDocumentDto;
}
