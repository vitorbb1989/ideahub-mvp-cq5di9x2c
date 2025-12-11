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
import { PromptsService } from './prompts.service';
import { AuditInterceptor } from '../../common/interceptors';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { UpdatePromptDto } from './dto/update-prompt.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto';

@ApiTags('prompts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(AuditInterceptor)
@Controller({ path: 'prompts', version: '1' })
export class PromptsController {
  constructor(private readonly promptsService: PromptsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new prompt' })
  create(
    @CurrentUser('id') userId: string,
    @Body() createPromptDto: CreatePromptDto,
  ) {
    return this.promptsService.create(userId, createPromptDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all prompts for current user (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  findAll(
    @CurrentUser('id') userId: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.promptsService.findAll(userId, paginationQuery);
  }

  @Get('trash')
  @ApiOperation({ summary: 'Get all deleted prompts (trash) for current user' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  findDeleted(
    @CurrentUser('id') userId: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.promptsService.findDeleted(userId, paginationQuery);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific prompt' })
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.promptsService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a prompt' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePromptDto: UpdatePromptDto,
  ) {
    return this.promptsService.update(userId, id, updatePromptDto);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore a deleted prompt from trash' })
  @ApiResponse({ status: 200, description: 'Prompt restored successfully' })
  @ApiResponse({ status: 404, description: 'Prompt not found or not deleted' })
  restore(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.promptsService.restore(userId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a prompt (moves to trash)' })
  @ApiResponse({ status: 204, description: 'Prompt deleted successfully' })
  remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.promptsService.remove(userId, id);
  }

  @Post(':id/use')
  @ApiOperation({ summary: 'Increment usage count for a prompt' })
  incrementUsage(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.promptsService.incrementUsageCount(userId, id);
  }

  @Post(':id/favorite')
  @ApiOperation({ summary: 'Toggle favorite status' })
  toggleFavorite(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.promptsService.toggleFavorite(userId, id);
  }
}
