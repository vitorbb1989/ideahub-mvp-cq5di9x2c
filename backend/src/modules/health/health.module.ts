import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

/**
 * Health Check Module
 *
 * Provides health check endpoints for monitoring application health.
 * Integrates with @nestjs/terminus for standardized health indicators.
 *
 * Available endpoints:
 * - GET /api/health - Full health check (all indicators)
 * - GET /api/health/live - Liveness probe (for K8s)
 * - GET /api/health/ready - Readiness probe (for K8s)
 *
 * Health indicators:
 * - Database: Checks PostgreSQL connectivity via TypeORM
 * - Memory Heap: Checks V8 heap memory usage
 * - Memory RSS: Checks process memory usage
 *
 * Integration with infrastructure:
 * - Kubernetes: Use /health/live for livenessProbe, /health/ready for readinessProbe
 * - AWS ELB: Use /health for target group health checks
 * - Docker: Use /health for HEALTHCHECK instruction
 */
@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
