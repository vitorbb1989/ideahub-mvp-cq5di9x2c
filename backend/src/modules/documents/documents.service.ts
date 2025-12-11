import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { v4 as uuidv4 } from 'uuid';
import { PaginationQueryDto } from '../../common/dto';
import {
  PaginatedResponse,
  createPaginatedResponse,
} from '../../common/interfaces';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
  ) {}

  async create(userId: string, createDocumentDto: CreateDocumentDto): Promise<Document> {
    const document = this.documentsRepository.create({
      ...createDocumentDto,
      userId,
      versions: createDocumentDto.content
        ? [
            {
              id: uuidv4(),
              content: createDocumentDto.content,
              createdAt: new Date().toISOString(),
              description: 'Initial version',
            },
          ]
        : [],
    });

    return this.documentsRepository.save(document);
  }

  async findAll(
    userId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponse<Document>> {
    const { page = 1, limit = 20 } = paginationQuery;
    const skip = (page - 1) * limit;

    // TypeORM automatically filters out soft-deleted records (where deletedAt IS NOT NULL)
    const [data, total] = await this.documentsRepository.findAndCount({
      where: { userId },
      order: { updatedAt: 'DESC' },
      skip,
      take: limit,
    });

    return createPaginatedResponse(data, total, page, limit);
  }

  async findOne(userId: string, id: string): Promise<Document> {
    // TypeORM automatically excludes soft-deleted records
    const document = await this.documentsRepository.findOne({
      where: { id, userId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async update(
    userId: string,
    id: string,
    updateDocumentDto: UpdateDocumentDto,
  ): Promise<Document> {
    const document = await this.findOne(userId, id);

    // Add version history when content changes
    if (updateDocumentDto.content && updateDocumentDto.content !== document.content) {
      const versions = document.versions || [];
      versions.push({
        id: uuidv4(),
        content: updateDocumentDto.content,
        createdAt: new Date().toISOString(),
        description: 'Updated',
      });
      updateDocumentDto.versions = versions;
    }

    Object.assign(document, updateDocumentDto);
    return this.documentsRepository.save(document);
  }

  /**
   * Soft delete a document - sets deletedAt timestamp instead of removing from database
   * The document can be restored later using the restore method
   */
  async remove(userId: string, id: string): Promise<void> {
    const document = await this.findOne(userId, id);
    // softRemove sets deletedAt = current timestamp
    await this.documentsRepository.softRemove(document);
  }

  /**
   * Restore a soft-deleted document
   * Sets deletedAt back to null, making the document visible again
   */
  async restore(userId: string, id: string): Promise<Document> {
    // Use withDeleted to find soft-deleted records
    const document = await this.documentsRepository.findOne({
      where: { id, userId },
      withDeleted: true,
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (!document.deletedAt) {
      throw new NotFoundException('Document is not deleted');
    }

    // Restore the record by clearing deletedAt
    await this.documentsRepository.restore(id);

    // Return the restored document
    return this.findOne(userId, id);
  }

  /**
   * Find all soft-deleted documents for a user (for trash/recovery UI)
   */
  async findDeleted(
    userId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponse<Document>> {
    const { page = 1, limit = 20 } = paginationQuery;
    const skip = (page - 1) * limit;

    const [data, total] = await this.documentsRepository
      .createQueryBuilder('document')
      .withDeleted()
      .where('document.userId = :userId', { userId })
      .andWhere('document.deletedAt IS NOT NULL')
      .orderBy('document.deletedAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return createPaginatedResponse(data, total, page, limit);
  }

  async restoreVersion(userId: string, id: string, versionId: string): Promise<Document> {
    const document = await this.findOne(userId, id);
    const version = document.versions?.find((v) => v.id === versionId);

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    document.content = version.content;
    document.versions = [
      ...(document.versions || []),
      {
        id: uuidv4(),
        content: version.content,
        createdAt: new Date().toISOString(),
        description: `Restored from version ${versionId}`,
      },
    ];

    return this.documentsRepository.save(document);
  }
}
