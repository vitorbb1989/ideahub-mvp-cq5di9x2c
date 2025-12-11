import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { LoggerService } from './common/logger';
import {
  AllExceptionsFilter,
  HttpExceptionFilter,
  ThrottlerExceptionFilter,
} from './common/filters';
import { SanitizePipe } from './common/pipes';

async function bootstrap() {
  // Create app with custom logger
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // Buffer logs until custom logger is set
  });

  // Get logger instance and set it as the application logger
  const logger = app.get(LoggerService);
  logger.setContext('Bootstrap');
  app.useLogger(logger);

  // Enable class-validator to use NestJS DI container
  // This allows custom validators to inject dependencies
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  // HTTP response compression
  // Compress responses > 1KB, skip already compressed formats (images)
  app.use(
    compression({
      threshold: 1024, // Only compress responses > 1KB
      filter: (req, res) => {
        // Don't compress if client doesn't accept gzip
        if (req.headers['x-no-compression']) {
          return false;
        }
        // Use compression filter default (skips already compressed content-types)
        return compression.filter(req, res);
      },
    }),
  );

  // Security headers with helmet
  // Configured to allow Swagger UI to work properly
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false, // Required for Swagger UI
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin for API
    }),
  );

  // Enable CORS for frontend
  app.enableCors({
    origin: ['http://localhost:8080', 'http://localhost:5173'],
    credentials: true,
  });

  // Global pipes
  // 1. SanitizePipe - Sanitize all string inputs to prevent XSS attacks
  // 2. ValidationPipe - Validate DTOs and transform types
  app.useGlobalPipes(
    new SanitizePipe(),
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global exception filters with logger injection
  // Order matters - most specific first
  // 1. ThrottlerExceptionFilter - handles rate limiting (429)
  // 2. HttpExceptionFilter - handles all HTTP exceptions with consistent format
  // 3. AllExceptionsFilter - catches everything else (fallback for 500 errors)
  app.useGlobalFilters(
    new AllExceptionsFilter(logger),
    new HttpExceptionFilter(logger),
    new ThrottlerExceptionFilter(logger),
  );

  // API versioning using URI strategy: /api/v1/...
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // API prefix (combined with versioning: /api/v1/...)
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('IdeaHub API')
    .setDescription(
      'API for IdeaHub - Idea Management Platform\n\n' +
      '## API Versioning\n' +
      'All endpoints are versioned using URI versioning: `/api/v1/...`\n\n' +
      '## Available Versions\n' +
      '- **v1** (current): Initial stable API version',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addServer('http://localhost:3000', 'Local Development')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  // Log application startup with structured logging
  logger.log(`Application is running on: http://localhost:${port}`, {
    context: 'Bootstrap',
    port,
    environment: process.env.NODE_ENV || 'development',
  });
  logger.log(`API Documentation: http://localhost:${port}/api/docs`, {
    context: 'Bootstrap',
  });
}
bootstrap();
