import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { databaseConfig, jwtConfig, redisConfig } from './config';
import { LoggerModule } from './common/logger';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { IdeasModule } from './modules/ideas/ideas.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { PromptsModule } from './modules/prompts/prompts.module';

@Module({
  imports: [
    // Global logger module - provides LoggerService to all modules
    LoggerModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, redisConfig],
    }),
    // Redis cache configuration - improves performance for frequent queries
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const isTest = process.env.NODE_ENV === 'test';
        const redisEnabled = configService.get('redis.enabled');

        // Use in-memory cache for tests or when Redis is disabled
        if (isTest || !redisEnabled) {
          return {
            ttl: 60 * 1000, // 1 minute default
          };
        }

        // Use Redis for production/development
        return {
          store: await redisStore({
            socket: {
              host: configService.get('redis.host'),
              port: configService.get('redis.port'),
            },
            ttl: 60 * 1000, // 1 minute default TTL
          }),
        };
      },
      inject: [ConfigService],
    }),
    // Rate limiting configuration - protects against brute force and DDoS
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 3, // 3 requests per second (burst protection)
      },
      {
        name: 'medium',
        ttl: 10000, // 10 seconds
        limit: 20, // 20 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute (main limit)
      },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isProduction = process.env.NODE_ENV === 'production';
        return {
          type: 'postgres',
          host: configService.get('database.host'),
          port: configService.get('database.port'),
          username: configService.get('database.username'),
          password: configService.get('database.password'),
          database: configService.get('database.database'),
          autoLoadEntities: true,
          // CRITICAL: synchronize must be false in production to prevent data loss
          synchronize: !isProduction,
          // Run migrations automatically on application start in production
          migrationsRun: isProduction,
          migrations: [__dirname + '/migrations/*{.ts,.js}'],
        };
      },
      inject: [ConfigService],
    }),
    // Health check module - provides /health, /health/live, /health/ready endpoints
    HealthModule,
    AuthModule,
    UsersModule,
    IdeasModule,
    DocumentsModule,
    PromptsModule,
  ],
  providers: [
    // Apply ThrottlerGuard globally to all routes
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
