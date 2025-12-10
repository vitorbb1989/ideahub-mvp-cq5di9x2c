import { IsString, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DocumentType } from '../entities/document.entity';

class VersionDto {
  @IsString()
  id: string;

  @IsString()
  content: string;

  @IsString()
  createdAt: string;

  @IsOptional()
  @IsString()
  description?: string;
}

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VersionDto)
  versions?: VersionDto[];
}
