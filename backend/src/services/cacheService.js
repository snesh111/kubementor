import crypto from 'crypto';

class CacheService {
  constructor() {
    this.memoryCache = new Map();
    this.ttlMap = new Map();
    this.redisClient = null;
    this.isRedisReady = false;

    // Optional Redis initialization if REDIS_URL is provided in environment
    if (process.env.REDIS_URL) {
      this.initRedis(process.env.REDIS_URL);
    }
  }

  async initRedis(url) {
    try {
      const { createClient } = await import('redis');
      this.redisClient = createClient({ url });
      this.redisClient.on('error', (err) => {
        console.warn('[CacheService] Redis error (falling back to In-Memory cache):', err.message);
        this.isRedisReady = false;
      });
      await this.redisClient.connect();
      this.isRedisReady = true;
      console.log('[CacheService] Connected to Redis cache successfully.');
    } catch (err) {
      console.warn('[CacheService] Redis not available, using In-Memory TTL Cache:', err.message);
      this.isRedisReady = false;
    }
  }

  /**
   * Generate cache key from string or object
   */
  generateKey(prefix, data) {
    const serialized = typeof data === 'string' ? data : JSON.stringify(data);
    const hash = crypto.createHash('sha256').update(serialized).digest('hex').slice(0, 16);
    return `${prefix}:${hash}`;
  }

  /**
   * Get item from cache (Redis or In-Memory)
   */
  async get(key) {
    if (this.isRedisReady && this.redisClient) {
      try {
        const val = await this.redisClient.get(key);
        return val ? JSON.parse(val) : null;
      } catch (err) {
        console.warn('[CacheService] Redis get failed:', err.message);
      }
    }

    // In-memory fallback
    const expiry = this.ttlMap.get(key);
    if (expiry && Date.now() > expiry) {
      this.memoryCache.delete(key);
      this.ttlMap.delete(key);
      return null;
    }
    return this.memoryCache.get(key) || null;
  }

  /**
   * Set item in cache with TTL in seconds (default: 600s / 10min)
   */
  async set(key, value, ttlSeconds = 600) {
    if (this.isRedisReady && this.redisClient) {
      try {
        await this.redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
        return;
      } catch (err) {
        console.warn('[CacheService] Redis set failed:', err.message);
      }
    }

    // In-memory fallback
    this.memoryCache.set(key, value);
    this.ttlMap.set(key, Date.now() + ttlSeconds * 1000);

    // Limit memory cache size to 1000 items to avoid memory leaks
    if (this.memoryCache.size > 1000) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
      this.ttlMap.delete(firstKey);
    }
  }

  /**
   * Invalidate specific key or prefix
   */
  async del(key) {
    if (this.isRedisReady && this.redisClient) {
      try {
        await this.redisClient.del(key);
      } catch (err) {
        console.warn('[CacheService] Redis del failed:', err.message);
      }
    }
    this.memoryCache.delete(key);
    this.ttlMap.delete(key);
  }
}

export const cacheService = new CacheService();
export default cacheService;
