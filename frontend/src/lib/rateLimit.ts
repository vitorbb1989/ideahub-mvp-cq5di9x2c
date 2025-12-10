import { logger } from './logger'

interface TokenBucket {
  tokens: number
  lastRefill: number
}

class RateLimiter {
  private buckets = new Map<string, TokenBucket>()

  // Default config: 100 requests per minute per key
  private readonly capacity = 100
  private readonly refillRate = 100 / 60 // tokens per second

  check(key: string, cost: number = 1): boolean {
    const now = Date.now()
    let bucket = this.buckets.get(key)

    if (!bucket) {
      bucket = { tokens: this.capacity, lastRefill: now }
      this.buckets.set(key, bucket)
    }

    // Refill tokens
    const elapsedSeconds = (now - bucket.lastRefill) / 1000
    const refillAmount = elapsedSeconds * this.refillRate
    bucket.tokens = Math.min(this.capacity, bucket.tokens + refillAmount)
    bucket.lastRefill = now

    // Consume tokens
    if (bucket.tokens >= cost) {
      bucket.tokens -= cost
      return true
    }

    logger.warn(`Rate Limit Exceeded for ${key}`)
    return false
  }

  reset() {
    this.buckets.clear()
  }
}

export const rateLimiter = new RateLimiter()
