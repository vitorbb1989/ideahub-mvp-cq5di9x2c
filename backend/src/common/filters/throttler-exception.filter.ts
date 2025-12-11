import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { LoggerService } from '../logger';

/**
 * Custom exception filter for rate limiting (429 Too Many Requests)
 * Provides clear error messages, Retry-After header, and structured logging
 */
@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('ThrottlerExceptionFilter');
  }

  catch(exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = uuidv4();

    // Default retry after 60 seconds
    const retryAfterSeconds = 60;

    // Set Retry-After header (in seconds)
    response.setHeader('Retry-After', retryAfterSeconds.toString());

    // Determine context-specific message based on endpoint
    let message = 'Too many requests. Please try again later.';
    let details = '';

    const path = request.url || '';
    if (path.includes('/auth/login')) {
      message = 'Too many login attempts.';
      details =
        'For security reasons, login attempts are limited. Please wait before trying again.';
    } else if (path.includes('/auth/register')) {
      message = 'Too many registration attempts.';
      details =
        'Registration attempts are limited. Please wait before trying again.';
    } else if (path.includes('/auth/refresh')) {
      message = 'Too many token refresh attempts.';
      details = 'Token refresh attempts are limited. Please wait before trying again.';
    }

    // Log rate limit event with structured metadata
    const userId = (request as Request & { user?: { id: string } }).user?.id;
    this.logger.logWithMeta('warn', message, {
      requestId,
      userId,
      method: request.method,
      path: request.url,
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      userAgent: request.headers['user-agent'],
      ip: request.ip || request.headers['x-forwarded-for'],
      retryAfter: retryAfterSeconds,
      event: 'rate_limit_exceeded',
    });

    response.status(HttpStatus.TOO_MANY_REQUESTS).json({
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      error: 'Too Many Requests',
      message,
      details,
      retryAfter: retryAfterSeconds,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
    });
  }
}
