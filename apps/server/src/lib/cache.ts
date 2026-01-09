import logger from "./logger";

interface CacheEntry<T> {
  value: T;
  timer?: ReturnType<typeof setTimeout>;
}

class CacheService {
  private cache = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }
    return entry.value as T;
  }

  set(key: string, value: unknown, ttlSeconds?: number): void {
    // Clear existing timer if key already exists
    const existing = this.cache.get(key);
    if (existing?.timer) {
      clearTimeout(existing.timer);
    }

    const entry: CacheEntry<unknown> = { value };

    if (ttlSeconds && ttlSeconds > 0) {
      entry.timer = setTimeout(() => {
        this.cache.delete(key);
        logger.debug(`Cache entry expired: ${key}`);
      }, ttlSeconds * 1000);
    }

    this.cache.set(key, entry);
  }

  delete(key: string): void {
    const entry = this.cache.get(key);
    if (entry?.timer) {
      clearTimeout(entry.timer);
    }
    this.cache.delete(key);
  }

  exists(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    for (const entry of this.cache.values()) {
      if (entry.timer) {
        clearTimeout(entry.timer);
      }
    }
    this.cache.clear();
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  scanKeys(pattern: string): string[] {
    const allKeys = this.keys();
    // Convert glob pattern to regex (e.g., "lock:*" -> "^lock:.*$")
    const regexPattern =
      "^" + pattern.replace(/\*/g, ".*").replace(/\?/g, ".") + "$";
    const regex = new RegExp(regexPattern);
    return allKeys.filter((key) => regex.test(key));
  }

  stop(): void {
    logger.info("Stopping cache service, clearing all timers");
    this.clear();
  }
}

export const cacheService = new CacheService();
