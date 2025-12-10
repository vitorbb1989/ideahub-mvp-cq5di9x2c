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
import { PromptsService } from './prompts.service';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { UpdatePromptDto } from './dto/update-prompt.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('prompts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('prompts')
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
  @ApiOperation({ summary: 'Get all prompts for current user' })
  findAll(@CurrentUser('id') userId: string) {
    return this.promptsService.findAll(userId);
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

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a prompt' })
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
