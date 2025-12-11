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
import { IdeasService } from './ideas.service';
import { AuditInterceptor } from '../../common/interceptors';
import { CreateIdeaDto, CreateIdeaWithDocumentDto } from './dto/create-idea.dto';
import { UpdateIdeaDto } from './dto/update-idea.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto';

@ApiTags('ideas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(AuditInterceptor)
@Controller({ path: 'ideas', version: '1' })
export class IdeasController {
  constructor(private readonly ideasService: IdeasService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new idea' })
  create(
    @CurrentUser('id') userId: string,
    @Body() createIdeaDto: CreateIdeaDto,
  ) {
    return this.ideasService.create(userId, createIdeaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all ideas for current user (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  findAll(
    @CurrentUser('id') userId: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.ideasService.findAll(userId, paginationQuery);
  }

  @Get('trash')
  @ApiOperation({ summary: 'Get all deleted ideas (trash) for current user' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  findDeleted(
    @CurrentUser('id') userId: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.ideasService.findDeleted(userId, paginationQuery);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific idea' })
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ideasService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an idea' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateIdeaDto: UpdateIdeaDto,
  ) {
    return this.ideasService.update(userId, id, updateIdeaDto);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore a deleted idea from trash' })
  @ApiResponse({ status: 200, description: 'Idea restored successfully' })
  @ApiResponse({ status: 404, description: 'Idea not found or not deleted' })
  restore(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ideasService.restore(userId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete an idea (moves to trash)' })
  @ApiResponse({ status: 204, description: 'Idea deleted successfully' })
  remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ideasService.remove(userId, id);
  }

  @Post('with-document')
  @ApiOperation({
    summary: 'Create an idea with an initial document (transactional)',
    description: 'Creates an idea and a linked document atomically. If either fails, both are rolled back.',
  })
  @ApiResponse({ status: 201, description: 'Idea and document created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  createWithDocument(
    @CurrentUser('id') userId: string,
    @Body() createIdeaWithDocumentDto: CreateIdeaWithDocumentDto,
  ) {
    return this.ideasService.createIdeaWithDocument(
      userId,
      createIdeaWithDocumentDto.idea,
      createIdeaWithDocumentDto.document,
    );
  }

  @Delete(':id/with-documents')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft delete an idea with all linked documents (transactional)',
    description: 'Deletes the idea and all linked documents atomically. If any fails, all are rolled back.',
  })
  @ApiResponse({ status: 204, description: 'Idea and linked documents deleted successfully' })
  @ApiResponse({ status: 404, description: 'Idea not found' })
  removeWithDocuments(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ideasService.removeWithLinkedDocuments(userId, id);
  }

  @Post(':id/restore-with-documents')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restore a deleted idea with all linked documents (transactional)',
    description: 'Restores the idea and all linked documents atomically. If any fails, all are rolled back.',
  })
  @ApiResponse({ status: 200, description: 'Idea and linked documents restored successfully' })
  @ApiResponse({ status: 404, description: 'Idea not found or not deleted' })
  restoreWithDocuments(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ideasService.restoreWithLinkedDocuments(userId, id);
  }
}
