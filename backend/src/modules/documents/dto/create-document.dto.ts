import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '../entities/document.entity';
import { IsValidJsonbArray } from '../../../common/validators';
import {
  DocumentVersionSchema,
  type DocumentVersion,
} from '../../../common/schemas';

export class CreateDocumentDto {
  @ApiProperty({ example: 'My Document' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ enum: DocumentType, default: DocumentType.FILE })
  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;

  @ApiPropertyOptional({ example: '# Hello World' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'Parent folder ID' })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({
    description: 'Version history with id (UUID), content, createdAt (ISO datetime), and optional description',
    example: [{ id: '550e8400-e29b-41d4-a716-446655440000', content: 'Content', createdAt: '2024-01-01T00:00:00Z', description: 'Initial' }],
  })
  @IsOptional()
  @IsValidJsonbArray(DocumentVersionSchema, {
    message: 'versions: Each item must have id (UUID), content (string), createdAt (ISO datetime), and optional description',
  })
  versions?: DocumentVersion[];
}
