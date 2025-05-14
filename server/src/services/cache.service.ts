import { config } from "@/config/config";
import { logger } from "@/utils/logger";
import Redis from "ioredis";

export class CacheService {
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on("error", (err) => {
      logger.error(`Redis Client Error: ${err}`);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (err) {
      logger.error(`Redis get error: ${err}`);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.client.set(key, JSON.stringify(value), "EX", ttl);
      } else {
        await this.client.set(key, JSON.stringify(value));
      }
    } catch (err) {
      logger.error(`Redis set error: ${err}`);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (err) {
      logger.error(`Redis delete error: ${err}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      return (await this.client.exists(key)) === 1;
    } catch (err) {
      logger.error(`Redis exists error: ${err}`);
      return false;
    }
  }

  async clearCache(): Promise<void> {
    try {
      await this.client.flushall();
    } catch (err) {
      logger.error(`Redis clear cache error: ${err}`);
    }
  }
}
