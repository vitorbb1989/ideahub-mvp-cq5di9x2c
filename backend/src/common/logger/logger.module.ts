import { Module, Global } from '@nestjs/common';
import { LoggerService } from './logger.service';

/**
 * Global Logger Module
 *
 * This module provides a Winston-based logging service that:
 * - Is globally available to all modules (no need to import)
 * - Uses JSON format in production for log aggregation
 * - Uses pretty format in development for readability
 * - Supports structured logging with requestId, userId, context
 *
 * Usage:
 * ```typescript
 * @Injectable()
 * export class MyService {
 *   constructor(private readonly logger: LoggerService) {
 *     this.logger.setContext('MyService');
 *   }
 *
 *   async myMethod() {
 *     this.logger.log('Operation started');
 *     this.logger.logWithMeta('info', 'User action', {
 *       requestId: 'abc123',
 *       userId: 'user-uuid',
 *       action: 'create'
 *     });
 *   }
 * }
 * ```
 */
@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
