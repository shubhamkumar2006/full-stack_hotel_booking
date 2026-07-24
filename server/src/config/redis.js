const Redis = require('ioredis');
const logger = require('./logger');

let redisClient;
let useMemoryFallback = false;
const memoryStore = new Map();

class MemoryRedisMock {
  constructor() {
    // Only log once
    if (!global.loggedRedisFallback) {
      logger.warn('⚠️ Redis connection refused. Falling back to In-Memory store for caching & locks.');
      global.loggedRedisFallback = true;
    }
  }
  async connect() { return 'OK'; }
  async ping() { return 'PONG'; }
  async quit() { return 'OK'; }
  async set(key, value, ...args) {
    const hasNX = args.includes('NX');
    if (hasNX && memoryStore.has(key)) {
      return null;
    }
    memoryStore.set(key, value);
    return 'OK';
  }
  async get(key) {
    return memoryStore.get(key) || null;
  }
  async del(key) {
    memoryStore.delete(key);
    return 1;
  }
  on() {}
}

const getRedisClient = () => {
  if (!redisClient) {
    try {
      const realClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          logger.warn('Redis connection failed, switching to in-memory fallback.');
          useMemoryFallback = true;
          return null; // stop retrying
        },
        lazyConnect: true,
      });

      realClient.on('connect', () => logger.info('Redis connected'));
      realClient.on('error', (err) => {
        useMemoryFallback = true;
      });

      const handler = {
        get(target, prop) {
          if (useMemoryFallback) {
            const mock = new MemoryRedisMock();
            return typeof mock[prop] === 'function' ? mock[prop].bind(mock) : mock[prop];
          }
          const value = target[prop];
          if (typeof value === 'function') {
            return async function(...args) {
              try {
                if (prop === 'connect') {
                  // Connect with a fast timeout to prevent long hangs
                  return await Promise.race([
                    value.apply(target, args),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1000))
                  ]);
                }
                return await value.apply(target, args);
              } catch (e) {
                useMemoryFallback = true;
                const mock = new MemoryRedisMock();
                return await mock[prop].apply(mock, args);
              }
            };
          }
          return value;
        }
      };

      redisClient = new Proxy(realClient, handler);
    } catch (e) {
      useMemoryFallback = true;
      redisClient = new MemoryRedisMock();
    }
  }

  return redisClient;
};

const redis = getRedisClient();

// ── Helpers ───────────────────────────────────────────────

const acquireBookingLock = async (roomId, checkIn, checkOut, ttlSeconds = 600) => {
  const key = `booking_lock:${roomId}:${checkIn}:${checkOut}`;
  const result = await redis.set(key, '1', 'EX', ttlSeconds, 'NX');
  return result === 'OK';
};

const releaseBookingLock = async (roomId, checkIn, checkOut) => {
  const key = `booking_lock:${roomId}:${checkIn}:${checkOut}`;
  await redis.del(key);
};

const setWithTTL = async (key, value, ttlSeconds) => {
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
};

const getKey = async (key) => {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
};

const deleteKey = async (key) => redis.del(key);

module.exports = {
  redis,
  acquireBookingLock,
  releaseBookingLock,
  setWithTTL,
  getKey,
  deleteKey,
};

