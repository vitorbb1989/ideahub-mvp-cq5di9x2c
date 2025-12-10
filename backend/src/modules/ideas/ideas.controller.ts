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
import { IdeasService } from './ideas.service';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { UpdateIdeaDto } from './dto/update-idea.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('ideas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ideas')
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
  @ApiOperation({ summary: 'Get all ideas for current user' })
  findAll(@CurrentUser('id') userId: string) {
    return this.ideasService.findAll(userId);
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

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an idea' })
  remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ideasService.remove(userId, id);
  }
}
