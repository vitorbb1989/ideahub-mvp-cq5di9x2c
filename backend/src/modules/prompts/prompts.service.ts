import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prompt } from './entities/prompt.entity';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { UpdatePromptDto } from './dto/update-prompt.dto';
import { PaginationQueryDto } from '../../common/dto';
import {
  PaginatedResponse,
  createPaginatedResponse,
} from '../../common/interfaces';

@Injectable()
export class PromptsService {
  constructor(
    @InjectRepository(Prompt)
    private promptsRepository: Repository<Prompt>,
  ) {}

  async create(userId: string, createPromptDto: CreatePromptDto): Promise<Prompt> {
    const prompt = this.promptsRepository.create({
      ...createPromptDto,
      userId,
    });

    return this.promptsRepository.save(prompt);
  }

  async findAll(
    userId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponse<Prompt>> {
    const { page = 1, limit = 20 } = paginationQuery;
    const skip = (page - 1) * limit;

    // TypeORM automatically filters out soft-deleted records (where deletedAt IS NOT NULL)
    const [data, total] = await this.promptsRepository.findAndCount({
      where: { userId },
      order: { updatedAt: 'DESC' },
      skip,
      take: limit,
    });

    return createPaginatedResponse(data, total, page, limit);
  }

  async findOne(userId: string, id: string): Promise<Prompt> {
    // TypeORM automatically excludes soft-deleted records
    const prompt = await this.promptsRepository.findOne({
      where: { id, userId },
    });

    if (!prompt) {
      throw new NotFoundException('Prompt not found');
    }

    return prompt;
  }

  async update(
    userId: string,
    id: string,
    updatePromptDto: UpdatePromptDto,
  ): Promise<Prompt> {
    const prompt = await this.findOne(userId, id);
    Object.assign(prompt, updatePromptDto);
    return this.promptsRepository.save(prompt);
  }

  /**
   * Soft delete a prompt - sets deletedAt timestamp instead of removing from database
   * The prompt can be restored later using the restore method
   */
  async remove(userId: string, id: string): Promise<void> {
    const prompt = await this.findOne(userId, id);
    // softRemove sets deletedAt = current timestamp
    await this.promptsRepository.softRemove(prompt);
  }

  /**
   * Restore a soft-deleted prompt
   * Sets deletedAt back to null, making the prompt visible again
   */
  async restore(userId: string, id: string): Promise<Prompt> {
    // Use withDeleted to find soft-deleted records
    const prompt = await this.promptsRepository.findOne({
      where: { id, userId },
      withDeleted: true,
    });

    if (!prompt) {
      throw new NotFoundException('Prompt not found');
    }

    if (!prompt.deletedAt) {
      throw new NotFoundException('Prompt is not deleted');
    }

    // Restore the record by clearing deletedAt
    await this.promptsRepository.restore(id);

    // Return the restored prompt
    return this.findOne(userId, id);
  }

  /**
   * Find all soft-deleted prompts for a user (for trash/recovery UI)
   */
  async findDeleted(
    userId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponse<Prompt>> {
    const { page = 1, limit = 20 } = paginationQuery;
    const skip = (page - 1) * limit;

    const [data, total] = await this.promptsRepository
      .createQueryBuilder('prompt')
      .withDeleted()
      .where('prompt.userId = :userId', { userId })
      .andWhere('prompt.deletedAt IS NOT NULL')
      .orderBy('prompt.deletedAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return createPaginatedResponse(data, total, page, limit);
  }

  async incrementUsageCount(userId: string, id: string): Promise<Prompt> {
    const prompt = await this.findOne(userId, id);
    prompt.usageCount += 1;
    return this.promptsRepository.save(prompt);
  }

  async toggleFavorite(userId: string, id: string): Promise<Prompt> {
    const prompt = await this.findOne(userId, id);
    prompt.isFavorite = !prompt.isFavorite;
    return this.promptsRepository.save(prompt);
  }
}
