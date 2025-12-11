import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Idea } from './entities/idea.entity';
import { Document } from '../documents/entities/document.entity';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { UpdateIdeaDto } from './dto/update-idea.dto';
import { PaginationQueryDto } from '../../common/dto';
import {
  PaginatedResponse,
  createPaginatedResponse,
} from '../../common/interfaces';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class IdeasService {
  constructor(
    @InjectRepository(Idea)
    private ideasRepository: Repository<Idea>,
    private dataSource: DataSource,
  ) {}

  async create(userId: string, createIdeaDto: CreateIdeaDto): Promise<Idea> {
    const idea = this.ideasRepository.create({
      ...createIdeaDto,
      userId,
      priorityScore: this.calculatePriorityScore(
        createIdeaDto.impact || 5,
        createIdeaDto.effort || 5,
      ),
    });

    return this.ideasRepository.save(idea);
  }

  async findAll(
    userId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponse<Idea>> {
    const { page = 1, limit = 20 } = paginationQuery;
    const skip = (page - 1) * limit;

    // TypeORM automatically filters out soft-deleted records (where deletedAt IS NOT NULL)
    const [data, total] = await this.ideasRepository.findAndCount({
      where: { userId },
      order: { updatedAt: 'DESC' },
      skip,
      take: limit,
    });

    return createPaginatedResponse(data, total, page, limit);
  }

  async findOne(userId: string, id: string): Promise<Idea> {
    // TypeORM automatically excludes soft-deleted records
    const idea = await this.ideasRepository.findOne({
      where: { id, userId },
    });

    if (!idea) {
      throw new NotFoundException('Idea not found');
    }

    return idea;
  }

  async update(
    userId: string,
    id: string,
    updateIdeaDto: UpdateIdeaDto,
  ): Promise<Idea> {
    const idea = await this.findOne(userId, id);

    if (updateIdeaDto.impact !== undefined || updateIdeaDto.effort !== undefined) {
      updateIdeaDto['priorityScore'] = this.calculatePriorityScore(
        updateIdeaDto.impact ?? idea.impact,
        updateIdeaDto.effort ?? idea.effort,
      );
    }

    Object.assign(idea, updateIdeaDto);
    return this.ideasRepository.save(idea);
  }

  /**
   * Soft delete an idea - sets deletedAt timestamp instead of removing from database
   * The idea can be restored later using the restore method
   */
  async remove(userId: string, id: string): Promise<void> {
    const idea = await this.findOne(userId, id);
    // softRemove sets deletedAt = current timestamp
    await this.ideasRepository.softRemove(idea);
  }

  /**
   * Restore a soft-deleted idea
   * Sets deletedAt back to null, making the idea visible again
   */
  async restore(userId: string, id: string): Promise<Idea> {
    // Use withDeleted to find soft-deleted records
    const idea = await this.ideasRepository.findOne({
      where: { id, userId },
      withDeleted: true,
    });

    if (!idea) {
      throw new NotFoundException('Idea not found');
    }

    if (!idea.deletedAt) {
      throw new NotFoundException('Idea is not deleted');
    }

    // Restore the record by clearing deletedAt
    await this.ideasRepository.restore(id);

    // Return the restored idea
    return this.findOne(userId, id);
  }

  /**
   * Find all soft-deleted ideas for a user (for trash/recovery UI)
   */
  async findDeleted(
    userId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponse<Idea>> {
    const { page = 1, limit = 20 } = paginationQuery;
    const skip = (page - 1) * limit;

    const [data, total] = await this.ideasRepository
      .createQueryBuilder('idea')
      .withDeleted()
      .where('idea.userId = :userId', { userId })
      .andWhere('idea.deletedAt IS NOT NULL')
      .orderBy('idea.deletedAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return createPaginatedResponse(data, total, page, limit);
  }

  private calculatePriorityScore(impact: number, effort: number): number {
    return Number(((impact / effort) * 10).toFixed(2));
  }

  /**
   * Create an idea with an initial document atomically
   * Uses database transaction to ensure both are created or neither is
   */
  async createIdeaWithDocument(
    userId: string,
    createIdeaDto: CreateIdeaDto,
    documentData: { name: string; content: string },
  ): Promise<{ idea: Idea; document: Document }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create the idea
      const idea = queryRunner.manager.create(Idea, {
        ...createIdeaDto,
        userId,
        priorityScore: this.calculatePriorityScore(
          createIdeaDto.impact || 5,
          createIdeaDto.effort || 5,
        ),
      });
      const savedIdea = await queryRunner.manager.save(Idea, idea);

      // Create the linked document
      const document = queryRunner.manager.create(Document, {
        name: documentData.name,
        content: documentData.content,
        userId,
        versions: [
          {
            id: uuidv4(),
            content: documentData.content,
            createdAt: new Date().toISOString(),
            description: 'Initial version',
          },
        ],
      });
      const savedDocument = await queryRunner.manager.save(Document, document);

      // Link the document to the idea
      savedIdea.linkedDocIds = [savedDocument.id];
      await queryRunner.manager.save(Idea, savedIdea);

      await queryRunner.commitTransaction();

      return { idea: savedIdea, document: savedDocument };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Soft delete an idea along with all linked documents atomically
   * Uses database transaction to ensure consistency
   */
  async removeWithLinkedDocuments(userId: string, id: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find the idea (including soft-deleted check)
      const idea = await queryRunner.manager.findOne(Idea, {
        where: { id, userId },
      });

      if (!idea) {
        throw new NotFoundException('Idea not found');
      }

      // Soft delete linked documents if any
      if (idea.linkedDocIds && idea.linkedDocIds.length > 0) {
        for (const docId of idea.linkedDocIds) {
          const document = await queryRunner.manager.findOne(Document, {
            where: { id: docId, userId },
          });
          if (document) {
            await queryRunner.manager.softRemove(Document, document);
          }
        }
      }

      // Soft delete the idea
      await queryRunner.manager.softRemove(Idea, idea);

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Restore an idea along with all linked documents atomically
   * Uses database transaction to ensure consistency
   */
  async restoreWithLinkedDocuments(userId: string, id: string): Promise<Idea> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find the deleted idea
      const idea = await queryRunner.manager.findOne(Idea, {
        where: { id, userId },
        withDeleted: true,
      });

      if (!idea) {
        throw new NotFoundException('Idea not found');
      }

      if (!idea.deletedAt) {
        throw new NotFoundException('Idea is not deleted');
      }

      // Restore linked documents if any
      if (idea.linkedDocIds && idea.linkedDocIds.length > 0) {
        for (const docId of idea.linkedDocIds) {
          await queryRunner.manager.restore(Document, docId);
        }
      }

      // Restore the idea
      await queryRunner.manager.restore(Idea, id);

      await queryRunner.commitTransaction();

      // Return the restored idea
      return this.findOne(userId, id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
