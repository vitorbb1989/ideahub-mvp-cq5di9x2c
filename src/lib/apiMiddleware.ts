import { logger } from './logger'
import { cacheService } from './cache'
import { rateLimiter } from './rateLimit'
import { monitorService } from './monitor'

interface ApiCallOptions {
  cacheKey?: string
  ttl?: number
  skipRateLimit?: boolean
}

/**
 * Higher-order function to simulate backend middleware.
 * Handles: Rate Limiting -> Caching -> Execution -> Logging -> Monitoring
 */
export async function apiCall<T>(
  endpoint: string,
  operation: () => Promise<T>,
  options: ApiCallOptions = {},
): Promise<T> {
  const start = performance.now()
  const context = { endpoint }

  // 1. Rate Limiting
  if (!options.skipRateLimit && !rateLimiter.check('global_api')) {
    monitorService.recordRequest(0, true)
    throw new Error('429 Too Many Requests: Slow down!')
  }

  // 2. Caching (Read)
  if (options.cacheKey) {
    const cached = cacheService.get<T>(options.cacheKey)
    if (cached) {
      const duration = performance.now() - start
      logger.info(`[API] ${endpoint} (Cache Hit)`, {
        ...context,
        duration: `${duration.toFixed(2)}ms`,
      })
      monitorService.recordRequest(duration, false)
      return cached
    }
  }

  try {
    // 3. Execution (with simulated delay logic inside service methods usually, but we measure here)
    logger.debug(`[API] ${endpoint} - Started`)
    const result = await operation()

    const duration = performance.now() - start

    // 4. Caching (Write)
    if (options.cacheKey) {
      cacheService.set(options.cacheKey, result, options.ttl)
    }

    // 5. Logging Success
    logger.info(`[API] ${endpoint} - Success`, {
      ...context,
      duration: `${duration.toFixed(2)}ms`,
    })

    // 6. Monitoring
    monitorService.recordRequest(duration, false)

    return result
  } catch (error) {
    const duration = performance.now() - start
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown Error'

    // Logging Error
    logger.error(`[API] ${endpoint} - Failed`, {
      ...context,
      error: errorMessage,
      duration: `${duration.toFixed(2)}ms`,
    })

    // Monitoring Error
    monitorService.recordRequest(duration, true)

    throw error
  }
}
