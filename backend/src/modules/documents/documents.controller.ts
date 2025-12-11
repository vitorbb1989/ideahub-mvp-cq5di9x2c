import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { AuditInterceptor } from '../../common/interceptors';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto';

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(AuditInterceptor)
@Controller({ path: 'documents', version: '1' })
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
  @ApiOperation({ summary: 'Get all documents for current user (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  findAll(
    @CurrentUser('id') userId: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.documentsService.findAll(userId, paginationQuery);
  }

  @Get('trash')
  @ApiOperation({ summary: 'Get all deleted documents (trash) for current user' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  findDeleted(
    @CurrentUser('id') userId: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.documentsService.findDeleted(userId, paginationQuery);
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

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore a deleted document from trash' })
  @ApiResponse({ status: 200, description: 'Document restored successfully' })
  @ApiResponse({ status: 404, description: 'Document not found or not deleted' })
  restore(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.documentsService.restore(userId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a document (moves to trash)' })
  @ApiResponse({ status: 204, description: 'Document deleted successfully' })
  remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.documentsService.remove(userId, id);
  }

  @Post(':id/restore-version/:versionId')
  @ApiOperation({ summary: 'Restore a document to a specific version' })
  restoreVersion(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('versionId') versionId: string,
  ) {
    return this.documentsService.restoreVersion(userId, id, versionId);
  }
}
