import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdeasService } from './ideas.service';
import { IdeasController } from './ideas.controller';
import { Idea } from './entities/idea.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Idea])],
  controllers: [IdeasController],
  providers: [IdeasService],
  exports: [IdeasService],
})
export class IdeasModule {}
