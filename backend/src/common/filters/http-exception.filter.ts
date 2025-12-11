import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { LoggerService } from '../logger';

/**
 * Standard error response format for all HTTP exceptions
 */
export interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
  error: string;
  requestId: string;
  // Only included in development
  stack?: string;
  details?: unknown;
}

/**
 * Global exception filter for handling all HttpExceptions
 * Provides consistent error response format across the application
 * Uses structured logging with Winston for production-ready log analysis
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('HttpExceptionFilter');
  }

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const isProduction = process.env.NODE_ENV === 'production';
    const requestId = uuidv4();

    // Extract message from exception response
    let message: string | string[];
    let error: string;
    let details: unknown;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
      error = HttpStatus[status] || 'Error';
    } else if (typeof exceptionResponse === 'object') {
      const responseObj = exceptionResponse as Record<string, unknown>;
      message = (responseObj.message as string | string[]) || exception.message;
      error = (responseObj.error as string) || HttpStatus[status] || 'Error';
      details = responseObj.details;
    } else {
      message = exception.message;
      error = HttpStatus[status] || 'Error';
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

    // Include additional details only in development
    if (!isProduction) {
      errorResponse.stack = exception.stack;
      if (details) {
        errorResponse.details = details;
      }
    }

    // Log the error with structured metadata
    this.logError(request, status, message, requestId, exception);

    response.status(status).json(errorResponse);
  }

  /**
   * Log error with structured metadata for log aggregation
   */
  private logError(
    request: Request,
    status: number,
    message: string | string[],
    requestId: string,
    exception: HttpException,
  ) {
    const messageStr = Array.isArray(message) ? message.join(', ') : message;
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
    };

    if (status >= 500) {
      this.logger.logWithMeta('error', messageStr, {
        ...logMeta,
        stack: exception.stack,
      });
    } else if (status >= 400) {
      this.logger.logWithMeta('warn', messageStr, logMeta);
    } else {
      this.logger.logWithMeta('info', messageStr, logMeta);
    }
  }
}
