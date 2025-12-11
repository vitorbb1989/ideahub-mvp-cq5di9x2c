import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Prompt } from './entities/prompt.entity';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { UpdatePromptDto } from './dto/update-prompt.dto';
import { PaginationQueryDto } from '../../common/dto';
import {
  PaginatedResponse,
  createPaginatedResponse,
} from '../../common/interfaces';

// Cache TTL constants (in milliseconds)
const CACHE_TTL = {
  LIST: 5 * 60 * 1000, // 5 minutes for list queries
  SINGLE: 10 * 60 * 1000, // 10 minutes for single item
};

@Injectable()
export class PromptsService {
  constructor(
    @InjectRepository(Prompt)
    private promptsRepository: Repository<Prompt>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(userId: string, createPromptDto: CreatePromptDto): Promise<Prompt> {
    const prompt = this.promptsRepository.create({
      ...createPromptDto,
      userId,
    });

    const saved = await this.promptsRepository.save(prompt);

    // Invalidate user's list cache after creating new prompt
    await this.invalidateUserCache(userId);

    return saved;
  }

  async findAll(
    userId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponse<Prompt>> {
    const { page = 1, limit = 20 } = paginationQuery;
    const cacheKey = this.getCacheKey('list', userId, page, limit);

    // Try to get from cache first
    const cached = await this.cacheManager.get<PaginatedResponse<Prompt>>(cacheKey);
    if (cached) {
      return cached;
    }

    const skip = (page - 1) * limit;

    // TypeORM automatically filters out soft-deleted records (where deletedAt IS NOT NULL)
    const [data, total] = await this.promptsRepository.findAndCount({
      where: { userId },
      order: { updatedAt: 'DESC' },
      skip,
      take: limit,
    });

    const result = createPaginatedResponse(data, total, page, limit);

    // Cache the result
    await this.cacheManager.set(cacheKey, result, CACHE_TTL.LIST);

    return result;
  }

  async findOne(userId: string, id: string): Promise<Prompt> {
    const cacheKey = this.getCacheKey('single', userId, id);

    // Try cache first
    const cached = await this.cacheManager.get<Prompt>(cacheKey);
    if (cached) {
      return cached;
    }

    // TypeORM automatically excludes soft-deleted records
    const prompt = await this.promptsRepository.findOne({
      where: { id, userId },
    });

    if (!prompt) {
      throw new NotFoundException('Prompt not found');
    }

    // Cache the result
    await this.cacheManager.set(cacheKey, prompt, CACHE_TTL.SINGLE);

    return prompt;
  }

  async update(
    userId: string,
    id: string,
    updatePromptDto: UpdatePromptDto,
  ): Promise<Prompt> {
    // findOne uses cache, but we need fresh data for update
    const prompt = await this.promptsRepository.findOne({
      where: { id, userId },
    });

    if (!prompt) {
      throw new NotFoundException('Prompt not found');
    }

    Object.assign(prompt, updatePromptDto);
    const updated = await this.promptsRepository.save(prompt);

    // Invalidate both single item and list caches
    await this.invalidatePromptCache(userId, id);

    return updated;
  }

  /**
   * Soft delete a prompt - sets deletedAt timestamp instead of removing from database
   * The prompt can be restored later using the restore method
   */
  async remove(userId: string, id: string): Promise<void> {
    const prompt = await this.promptsRepository.findOne({
      where: { id, userId },
    });

    if (!prompt) {
      throw new NotFoundException('Prompt not found');
    }

    // softRemove sets deletedAt = current timestamp
    await this.promptsRepository.softRemove(prompt);

    // Invalidate caches
    await this.invalidatePromptCache(userId, id);
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

    // Invalidate caches since prompt is back
    await this.invalidateUserCache(userId);

    // Return the restored prompt (fetch fresh from DB)
    const restored = await this.promptsRepository.findOne({
      where: { id, userId },
    });

    return restored!;
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
    const prompt = await this.promptsRepository.findOne({
      where: { id, userId },
    });

    if (!prompt) {
      throw new NotFoundException('Prompt not found');
    }

    prompt.usageCount += 1;
    const updated = await this.promptsRepository.save(prompt);

    // Invalidate cache for this prompt
    await this.invalidatePromptCache(userId, id);

    return updated;
  }

  async toggleFavorite(userId: string, id: string): Promise<Prompt> {
    const prompt = await this.promptsRepository.findOne({
      where: { id, userId },
    });

    if (!prompt) {
      throw new NotFoundException('Prompt not found');
    }

    prompt.isFavorite = !prompt.isFavorite;
    const updated = await this.promptsRepository.save(prompt);

    // Invalidate cache for this prompt
    await this.invalidatePromptCache(userId, id);

    return updated;
  }

  // ==================== Cache Helper Methods ====================

  /**
   * Generate cache key for prompts
   */
  private getCacheKey(type: 'list' | 'single', userId: string, ...args: (string | number)[]): string {
    return `prompts:${type}:${userId}:${args.join(':')}`;
  }

  /**
   * Invalidate all caches for a specific prompt
   */
  private async invalidatePromptCache(userId: string, promptId: string): Promise<void> {
    // Delete single prompt cache
    const singleKey = this.getCacheKey('single', userId, promptId);
    await this.cacheManager.del(singleKey);

    // Invalidate all list caches for this user
    await this.invalidateUserCache(userId);
  }

  /**
   * Invalidate all list caches for a user
   * Note: This is a simplified approach. In production with Redis,
   * you might want to use Redis SCAN to find and delete keys by pattern
   */
  private async invalidateUserCache(userId: string): Promise<void> {
    // Delete common pagination combinations
    const commonPages = [1, 2, 3, 4, 5];
    const commonLimits = [10, 20, 50, 100];

    const keysToDelete: string[] = [];

    for (const page of commonPages) {
      for (const limit of commonLimits) {
        keysToDelete.push(this.getCacheKey('list', userId, page, limit));
      }
    }

    await Promise.all(keysToDelete.map(key => this.cacheManager.del(key)));
  }
}
