import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { v4 as uuidv4 } from 'uuid';

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

  async findAll(userId: string): Promise<Document[]> {
    return this.documentsRepository.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(userId: string, id: string): Promise<Document> {
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

  async remove(userId: string, id: string): Promise<void> {
    const document = await this.findOne(userId, id);
    await this.documentsRepository.remove(document);
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
