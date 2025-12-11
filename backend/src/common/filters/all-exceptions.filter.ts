import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';
import { ErrorResponse } from './http-exception.filter';
import { LoggerService } from '../logger';

/**
 * Global exception filter for handling ALL exceptions (including non-HTTP)
 * This is the last line of defense - catches anything not handled by HttpExceptionFilter
 *
 * Handles:
 * - HttpException (delegates to proper handling)
 * - TypeORM errors (QueryFailedError, EntityNotFoundError)
 * - Generic JavaScript errors
 * - Unknown errors
 *
 * Uses structured logging with Winston for production-ready log analysis
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('AllExceptionsFilter');
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isProduction = process.env.NODE_ENV === 'production';
    const requestId = uuidv4();

    let status: number;
    let message: string;
    let error: string;
    let stack: string | undefined;

    // Handle different exception types
    if (exception instanceof HttpException) {
      // HttpException - extract status and message
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as Record<string, unknown>;
        const msg = responseObj.message;
        message = Array.isArray(msg) ? msg.join(', ') : (msg as string) || exception.message;
      } else {
        message = exception.message;
      }

      error = HttpStatus[status] || 'Error';
      stack = exception.stack;
    } else if (exception instanceof QueryFailedError) {
      // TypeORM Query Error - likely constraint violation
      status = HttpStatus.BAD_REQUEST;
      error = 'Database Error';
      stack = exception.stack;

      // Check for common constraint violations
      const driverError = exception.driverError as { code?: string; detail?: string };
      if (driverError?.code === '23505') {
        // Unique constraint violation
        message = 'A record with this value already exists.';
      } else if (driverError?.code === '23503') {
        // Foreign key violation
        message = 'Referenced record does not exist.';
      } else if (driverError?.code === '23502') {
        // Not null violation
        message = 'Required field is missing.';
      } else {
        message = isProduction
          ? 'A database error occurred.'
          : exception.message;
      }
    } else if (exception instanceof EntityNotFoundError) {
      // TypeORM Entity Not Found
      status = HttpStatus.NOT_FOUND;
      message = 'Resource not found.';
      error = 'Not Found';
      stack = exception.stack;
    } else if (exception instanceof Error) {
      // Generic JavaScript Error
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      error = 'Internal Server Error';
      stack = exception.stack;

      // In production, hide internal error details
      message = isProduction
        ? 'An unexpected error occurred. Please try again later.'
        : exception.message;
    } else {
      // Unknown error type
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      error = 'Internal Server Error';
      message = 'An unexpected error occurred. Please try again later.';
    }

    // Build error response
    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
      requestId,
    };

    // Include stack trace only in development
    if (!isProduction && stack) {
      errorResponse.stack = stack;
    }

    // Log the error with structured metadata
    this.logError(request, status, message, requestId, exception, stack);

    response.status(status).json(errorResponse);
  }

  /**
   * Log error with structured metadata for log aggregation
   */
  private logError(
    request: Request,
    status: number,
    message: string,
    requestId: string,
    exception: unknown,
    stack?: string,
  ) {
    const userId = (request as Request & { user?: { id: string } }).user?.id;

    // Structured log metadata
    const logMeta = {
      requestId,
      userId,
      method: request.method,
      path: request.url,
      statusCode: status,
      userAgent: request.headers['user-agent'],
      ip: request.ip || request.headers['x-forwarded-for'],
      exceptionType: exception?.constructor?.name || 'Unknown',
    };

    if (status >= 500) {
      // Log full error details for 5xx errors
      this.logger.logWithMeta('error', message, {
        ...logMeta,
        stack: stack || (exception instanceof Error ? exception.stack : String(exception)),
      });
    } else if (status >= 400) {
      this.logger.logWithMeta('warn', message, logMeta);
    }
  }
}
