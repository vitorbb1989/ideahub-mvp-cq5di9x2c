import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';

/**
 * Health Check Controller
 *
 * Provides endpoints for monitoring application health.
 * Used by load balancers, Kubernetes probes, and monitoring systems.
 *
 * Endpoints:
 * - GET /api/v1/health - Full health check (database, memory, disk)
 * - GET /api/v1/health/live - Liveness probe (is app running?)
 * - GET /api/v1/health/ready - Readiness probe (is app ready to serve traffic?)
 *
 * This controller is:
 * - Public (no authentication required)
 * - Excluded from rate limiting
 */
@ApiTags('health')
@Controller({ path: 'health', version: '1' })
@SkipThrottle() // Exclude from all rate limiting
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  /**
   * Full health check - checks all indicators
   * Returns 200 if healthy, 503 if unhealthy
   */
  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Full health check',
    description: 'Checks database connectivity, memory usage, and disk space',
  })
  @ApiResponse({
    status: 200,
    description: 'Application is healthy',
    schema: {
      example: {
        status: 'ok',
        info: {
          database: { status: 'up' },
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
        },
        error: {},
        details: {
          database: { status: 'up' },
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Application is unhealthy',
    schema: {
      example: {
        status: 'error',
        info: {},
        error: {
          database: {
            status: 'down',
            message: 'Connection refused',
          },
        },
        details: {
          database: {
            status: 'down',
            message: 'Connection refused',
          },
        },
      },
    },
  })
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      // Database health - checks TypeORM connection
      () => this.db.pingCheck('database'),

      // Memory health - heap should be under 300MB
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),

      // Memory health - RSS (Resident Set Size) should be under 500MB
      () => this.memory.checkRSS('memory_rss', 500 * 1024 * 1024),
    ]);
  }

  /**
   * Liveness probe - checks if the application is running
   * Used by Kubernetes to know when to restart a container
   * Always returns 200 if the app is responding
   */
  @Get('live')
  @HealthCheck()
  @ApiOperation({
    summary: 'Liveness probe',
    description: 'Simple check to verify the application is running',
  })
  @ApiResponse({ status: 200, description: 'Application is alive' })
  liveness(): Promise<HealthCheckResult> {
    return this.health.check([
      // Just check memory to confirm app is responsive
      () => this.memory.checkHeap('memory_heap', 500 * 1024 * 1024),
    ]);
  }

  /**
   * Readiness probe - checks if the application is ready to receive traffic
   * Used by Kubernetes to know when to add/remove pod from load balancer
   * Checks database connectivity
   */
  @Get('ready')
  @HealthCheck()
  @ApiOperation({
    summary: 'Readiness probe',
    description: 'Checks if the application is ready to serve traffic (database connected)',
  })
  @ApiResponse({ status: 200, description: 'Application is ready' })
  @ApiResponse({ status: 503, description: 'Application is not ready' })
  readiness(): Promise<HealthCheckResult> {
    return this.health.check([
      // Database must be connected for app to be ready
      () => this.db.pingCheck('database'),
    ]);
  }
}
