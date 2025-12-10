import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new document' })
  create(
    @CurrentUser('id') userId: string,
    @Body() createDocumentDto: CreateDocumentDto,
  ) {
    return this.documentsService.create(userId, createDocumentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all documents for current user' })
  findAll(@CurrentUser('id') userId: string) {
    return this.documentsService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific document' })
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.documentsService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a document' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(userId, id, updateDocumentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a document' })
  remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.documentsService.remove(userId, id);
  }

  @Post(':id/restore/:versionId')
  @ApiOperation({ summary: 'Restore a document to a specific version' })
  restoreVersion(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('versionId') versionId: string,
  ) {
    return this.documentsService.restoreVersion(userId, id, versionId);
  }
}
