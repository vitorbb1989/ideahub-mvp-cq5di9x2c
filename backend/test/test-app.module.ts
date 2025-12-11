/**
 * Test Application Module
 *
 * This module is configured for E2E testing with PostgreSQL.
 * Requires PostgreSQL to be running (via Docker or locally).
 *
 * To run E2E tests:
 * 1. Start PostgreSQL: docker-compose up -d
 * 2. Run tests: npm run test:e2e
 */
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { jwtConfig } from '../src/config';
import { LoggerModule } from '../src/common/logger';
import { HealthModule } from '../src/modules/health/health.module';
import { AuthModule } from '../src/modules/auth/auth.module';
import { UsersModule } from '../src/modules/users/users.module';
import { IdeasModule } from '../src/modules/ideas/ideas.module';
import { DocumentsModule } from '../src/modules/documents/documents.module';
import { PromptsModule } from '../src/modules/prompts/prompts.module';
import { User } from '../src/modules/users/entities/user.entity';
import { Idea } from '../src/modules/ideas/entities/idea.entity';
import { Document } from '../src/modules/documents/entities/document.entity';
import { Prompt } from '../src/modules/prompts/entities/prompt.entity';

@Module({
  imports: [
    LoggerModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [jwtConfig],
    }),
    // High rate limits for E2E tests to avoid test flakiness
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 1000,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 1000,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 1000,
      },
    ]),
    // PostgreSQL test database configuration
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'ideahub_test',
      entities: [User, Idea, Document, Prompt],
      synchronize: true,
      dropSchema: true, // Clean database for each test run
    }),
    HealthModule,
    AuthModule,
    UsersModule,
    IdeasModule,
    DocumentsModule,
    PromptsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class TestAppModule {}
