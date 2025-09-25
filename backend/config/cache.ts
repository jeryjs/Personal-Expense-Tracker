import { createClient } from 'redis';

// TTL in seconds
const TTL = {
    SHORT: 300, // 5 mins
    MEDIUM: 1800, // 30 mins
    LONG: 7200, // 2 hours
    EXTENDED: 86400, // 24 hours
};

// Create Redis client
const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Connect to Redis
redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.connect();

// Cache wrapper
const cache = {
    async get(key: string) {
        try {
            const value = await redisClient.get(key);
            return value ? JSON.parse(value) : undefined;
        } catch (error) {
            console.error('Cache get error:', error);
            return undefined;
        }
    },

    async set(key: string, value: any, ttl: number = 120) {
        try {
            await redisClient.setEx(key, ttl, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Cache set error:', error);
            return false;
        }
    },

    async del(key: string) {
        try {
            const result = await redisClient.del(key);
            return result > 0;
        } catch (error) {
            console.error('Cache delete error:', error);
            return false;
        }
    },

    async flushAll() {
        try {
            await redisClient.flushAll();
            return true;
        } catch (error) {
            console.error('Cache flush error:', error);
            return false;
        }
    },

    async keys(pattern: string = '*') {
        try {
            return await redisClient.keys(pattern);
        } catch (error) {
            console.error('Cache keys error:', error);
            return [];
        }
    }
};

export { cache, TTL };