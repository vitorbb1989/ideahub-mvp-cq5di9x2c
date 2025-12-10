import { logger } from './logger'

interface CacheItem<T> {
  value: T
  expiry: number
}

class CacheService {
  private store = new Map<string, CacheItem<any>>()
  private hits = 0
  private misses = 0

  set<T>(key: string, value: T, ttlSeconds: number = 60) {
    const expiry = Date.now() + ttlSeconds * 1000
    this.store.set(key, { value, expiry })
    logger.debug(`Cache SET: ${key} (TTL: ${ttlSeconds}s)`)
  }

  get<T>(key: string): T | null {
    const item = this.store.get(key)
    if (!item) {
      this.misses++
      return null
    }

    if (Date.now() > item.expiry) {
      this.store.delete(key)
      this.misses++
      logger.debug(`Cache EXPIRED: ${key}`)
      return null
    }

    this.hits++
    logger.debug(`Cache HIT: ${key}`)
    return item.value
  }

  invalidate(keyPattern: string) {
    let count = 0
    for (const key of this.store.keys()) {
      if (key.includes(keyPattern)) {
        this.store.delete(key)
        count++
      }
    }
    if (count > 0)
      logger.info(`Cache INVALIDATED: ${count} keys matching "${keyPattern}"`)
  }

  clear() {
    this.store.clear()
    this.hits = 0
    this.misses = 0
    logger.info('Cache CLEARED')
  }

  getStats() {
    const total = this.hits + this.misses
    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRatio: total === 0 ? 0 : this.hits / total,
    }
  }
}

export const cacheService = new CacheService()
