import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prompt } from './entities/prompt.entity';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { UpdatePromptDto } from './dto/update-prompt.dto';

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

  async findAll(userId: string): Promise<Prompt[]> {
    return this.promptsRepository.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(userId: string, id: string): Promise<Prompt> {
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

  async remove(userId: string, id: string): Promise<void> {
    const prompt = await this.findOne(userId, id);
    await this.promptsRepository.remove(prompt);
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
