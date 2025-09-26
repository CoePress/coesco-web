import Redis from "ioredis";

import { env } from "@/config/env";
import { logger } from "@/utils/logger";

export class CacheService {
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
    });

    // this.client = new Redis(env.REDIS_URL);

    this.client.on("error", (err) => {
      logger.error(`Redis Client Error: ${err}`);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    }
    catch (err) {
      logger.error(`Redis get error: ${err}`);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.client.set(key, JSON.stringify(value), "EX", ttl);
      }
      else {
        await this.client.set(key, JSON.stringify(value));
      }
    }
    catch (err) {
      logger.error(`Redis set error: ${err}`);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    }
    catch (err) {
      logger.error(`Redis delete error: ${err}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      return (await this.client.exists(key)) === 1;
    }
    catch (err) {
      logger.error(`Redis exists error: ${err}`);
      return false;
    }
  }

  async clearCache(): Promise<void> {
    try {
      await this.client.flushall();
    }
    catch (err) {
      logger.error(`Redis clear cache error: ${err}`);
    }
  }

  async scanKeys(pattern: string): Promise<string[]> {
    try {
      const keys: string[] = [];
      let cursor = 0;

      do {
        const result = await this.client.scan(
          cursor,
          "MATCH",
          pattern,
          "COUNT",
          "100",
        );
        cursor = Number.parseInt(result[0]);
        keys.push(...result[1]);
      } while (cursor !== 0);

      return keys;
    }
    catch (err) {
      logger.error(`Redis scan error: ${err}`);
      return [];
    }
  }

  async stop() {
    try {
      await this.client.quit();
    }
    catch (err) {
      logger.error(`Redis quit error: ${err}`);
    }
  }
}
