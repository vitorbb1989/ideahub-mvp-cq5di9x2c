import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Idea } from './entities/idea.entity';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { UpdateIdeaDto } from './dto/update-idea.dto';

@Injectable()
export class IdeasService {
  constructor(
    @InjectRepository(Idea)
    private ideasRepository: Repository<Idea>,
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

  async findAll(userId: string): Promise<Idea[]> {
    return this.ideasRepository.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(userId: string, id: string): Promise<Idea> {
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

  async remove(userId: string, id: string): Promise<void> {
    const idea = await this.findOne(userId, id);
    await this.ideasRepository.remove(idea);
  }

  private calculatePriorityScore(impact: number, effort: number): number {
    return Number(((impact / effort) * 10).toFixed(2));
  }
}
