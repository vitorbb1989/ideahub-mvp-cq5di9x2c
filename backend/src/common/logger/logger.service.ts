import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';

/**
 * Custom Logger Service using Winston
 *
 * Features:
 * - JSON format in production for log aggregation tools
 * - Pretty format in development for readability
 * - Automatic requestId injection from async context
 * - Structured logging with context, userId, and metadata
 *
 * Log Levels (from highest to lowest priority):
 * - error: System errors, exceptions, failures
 * - warn: Warnings, deprecated features, recoverable issues
 * - info: General information, successful operations
 * - debug: Detailed information for debugging
 */
@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;
  private context?: string;

  constructor() {
    const isProduction = process.env.NODE_ENV === 'production';

    // Define log format based on environment
    const formatters = isProduction
      ? [
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json(),
        ]
      : [
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.errors({ stack: true }),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, context, requestId, userId, ...meta }) => {
            const reqId = requestId ? `[${requestId}]` : '';
            const ctx = context ? `[${context}]` : '';
            const uid = userId ? `[user:${userId}]` : '';
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp} ${level} ${reqId}${ctx}${uid} ${message}${metaStr}`;
          }),
        ];

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
      format: winston.format.combine(...formatters),
      defaultMeta: { service: 'ideahub-api' },
      transports: [
        new winston.transports.Console({
          stderrLevels: ['error'],
        }),
      ],
    });
  }

  /**
   * Set context for this logger instance
   */
  setContext(context: string): this {
    this.context = context;
    return this;
  }

  /**
   * Log info level message
   */
  log(message: string, context?: string): void;
  log(message: string, meta?: Record<string, unknown>): void;
  log(message: string, contextOrMeta?: string | Record<string, unknown>): void {
    const meta = this.buildMeta(contextOrMeta);
    this.logger.info(message, meta);
  }

  /**
   * Log error level message
   */
  error(message: string, trace?: string, context?: string): void;
  error(message: string, meta?: Record<string, unknown>): void;
  error(
    message: string,
    traceOrMeta?: string | Record<string, unknown>,
    context?: string,
  ): void {
    let meta: Record<string, unknown>;

    if (typeof traceOrMeta === 'string') {
      meta = {
        context: context || this.context,
        stack: traceOrMeta,
      };
    } else {
      meta = this.buildMeta(traceOrMeta);
    }

    this.logger.error(message, meta);
  }

  /**
   * Log warn level message
   */
  warn(message: string, context?: string): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, contextOrMeta?: string | Record<string, unknown>): void {
    const meta = this.buildMeta(contextOrMeta);
    this.logger.warn(message, meta);
  }

  /**
   * Log debug level message
   */
  debug(message: string, context?: string): void;
  debug(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, contextOrMeta?: string | Record<string, unknown>): void {
    const meta = this.buildMeta(contextOrMeta);
    this.logger.debug(message, meta);
  }

  /**
   * Log verbose level message (maps to debug in winston)
   */
  verbose(message: string, context?: string): void;
  verbose(message: string, meta?: Record<string, unknown>): void;
  verbose(message: string, contextOrMeta?: string | Record<string, unknown>): void {
    const meta = this.buildMeta(contextOrMeta);
    this.logger.verbose(message, meta);
  }

  /**
   * Log with full metadata support for structured logging
   * This is the preferred method for application-level logging
   */
  logWithMeta(
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    meta: {
      requestId?: string;
      userId?: string;
      context?: string;
      [key: string]: unknown;
    },
  ): void {
    const fullMeta = {
      ...meta,
      context: meta.context || this.context,
    };
    this.logger.log(level, message, fullMeta);
  }

  /**
   * Build metadata object from context string or metadata object
   */
  private buildMeta(
    contextOrMeta?: string | Record<string, unknown>,
  ): Record<string, unknown> {
    if (typeof contextOrMeta === 'string') {
      return { context: contextOrMeta || this.context };
    }
    return {
      context: this.context,
      ...contextOrMeta,
    };
  }
}
