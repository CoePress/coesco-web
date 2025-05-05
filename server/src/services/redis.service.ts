import Redis from "ioredis";

import { error } from "@/utils/logger";

class RedisService {
  private client: Redis;
  private readonly defaultTTL = 3600; // 1 hour in seconds

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on("error", (err) => {
      error(`Redis Client Error: ${err}`);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (err) {
      error(`Redis get error: ${err}`);
      return null;
    }
  }

  async set(
    key: string,
    value: any,
    ttl: number = this.defaultTTL
  ): Promise<void> {
    try {
      await this.client.set(key, JSON.stringify(value), "EX", ttl);
    } catch (err) {
      error(`Redis set error: ${err}`);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (err) {
      error(`Redis delete error: ${err}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      return (await this.client.exists(key)) === 1;
    } catch (err) {
      error(`Redis exists error: ${err}`);
      return false;
    }
  }

  async clearCache(): Promise<void> {
    try {
      await this.client.flushall();
    } catch (err) {
      error(`Redis clear cache error: ${err}`);
    }
  }
}

export default RedisService;
