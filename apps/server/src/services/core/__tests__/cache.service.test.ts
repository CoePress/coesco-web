import type Redis from "ioredis";

import RedisMock from "ioredis";

import { CacheService } from "../cache.service";

jest.mock("ioredis");

describe("cacheService", () => {
  let cacheService: CacheService;
  let mockRedisClient: jest.Mocked<Redis>;

  beforeEach(() => {
    mockRedisClient = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      flushall: jest.fn(),
      scan: jest.fn(),
      quit: jest.fn(),
      on: jest.fn(),
    } as any;

    (RedisMock as jest.MockedClass<typeof RedisMock>).mockImplementation(() => mockRedisClient);

    cacheService = new CacheService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create redis client with correct config", () => {
      expect(mockRedisClient.on).toHaveBeenCalledWith("error", expect.any(Function));
    });
  });

  describe("get", () => {
    it("should return parsed value when key exists", async () => {
      const testData = { foo: "bar" };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(testData));

      const result = await cacheService.get("test-key");

      expect(mockRedisClient.get).toHaveBeenCalledWith("test-key");
      expect(result).toEqual(testData);
    });

    it("should return null when key does not exist", async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await cacheService.get("non-existent");

      expect(result).toBeNull();
    });

    it("should handle JSON parse errors and return null", async () => {
      mockRedisClient.get.mockResolvedValue("invalid json");

      const result = await cacheService.get("invalid-key");

      expect(result).toBeNull();
    });

    it("should return null when redis throws error", async () => {
      mockRedisClient.get.mockRejectedValue(new Error("Redis error"));

      const result = await cacheService.get("error-key");

      expect(result).toBeNull();
    });
  });

  describe("set", () => {
    it("should set value without TTL", async () => {
      const testData = { foo: "bar" };

      await cacheService.set("test-key", testData);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        "test-key",
        JSON.stringify(testData),
      );
    });

    it("should set value with TTL", async () => {
      const testData = { foo: "bar" };
      const ttl = 3600;

      await cacheService.set("test-key", testData, ttl);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        "test-key",
        JSON.stringify(testData),
        "EX",
        ttl,
      );
    });

    it("should handle redis errors gracefully", async () => {
      mockRedisClient.set.mockRejectedValue(new Error("Redis error"));

      await expect(cacheService.set("test-key", { foo: "bar" })).resolves.not.toThrow();
    });
  });

  describe("delete", () => {
    it("should delete key", async () => {
      await cacheService.delete("test-key");

      expect(mockRedisClient.del).toHaveBeenCalledWith("test-key");
    });

    it("should handle redis errors gracefully", async () => {
      mockRedisClient.del.mockRejectedValue(new Error("Redis error"));

      await expect(cacheService.delete("test-key")).resolves.not.toThrow();
    });
  });

  describe("exists", () => {
    it("should return true when key exists", async () => {
      mockRedisClient.exists.mockResolvedValue(1);

      const result = await cacheService.exists("test-key");

      expect(mockRedisClient.exists).toHaveBeenCalledWith("test-key");
      expect(result).toBe(true);
    });

    it("should return false when key does not exist", async () => {
      mockRedisClient.exists.mockResolvedValue(0);

      const result = await cacheService.exists("test-key");

      expect(result).toBe(false);
    });

    it("should return false when redis throws error", async () => {
      mockRedisClient.exists.mockRejectedValue(new Error("Redis error"));

      const result = await cacheService.exists("test-key");

      expect(result).toBe(false);
    });
  });

  describe("clearCache", () => {
    it("should flush all keys", async () => {
      await cacheService.clearCache();

      expect(mockRedisClient.flushall).toHaveBeenCalled();
    });

    it("should handle redis errors gracefully", async () => {
      mockRedisClient.flushall.mockRejectedValue(new Error("Redis error"));

      await expect(cacheService.clearCache()).resolves.not.toThrow();
    });
  });

  describe("scanKeys", () => {
    it("should scan and return all matching keys", async () => {
      mockRedisClient.scan
        .mockResolvedValueOnce(["10", ["key1", "key2"]])
        .mockResolvedValueOnce(["0", ["key3"]]);

      const result = await cacheService.scanKeys("pattern:*");

      expect(mockRedisClient.scan).toHaveBeenCalledTimes(2);
      expect(mockRedisClient.scan).toHaveBeenNthCalledWith(1, 0, "MATCH", "pattern:*", "COUNT", "100");
      expect(mockRedisClient.scan).toHaveBeenNthCalledWith(2, 10, "MATCH", "pattern:*", "COUNT", "100");
      expect(result).toEqual(["key1", "key2", "key3"]);
    });

    it("should return empty array when no keys match", async () => {
      mockRedisClient.scan.mockResolvedValue(["0", []]);

      const result = await cacheService.scanKeys("pattern:*");

      expect(result).toEqual([]);
    });

    it("should return empty array when redis throws error", async () => {
      mockRedisClient.scan.mockRejectedValue(new Error("Redis error"));

      const result = await cacheService.scanKeys("pattern:*");

      expect(result).toEqual([]);
    });
  });

  describe("stop", () => {
    it("should quit redis connection", async () => {
      await cacheService.stop();

      expect(mockRedisClient.quit).toHaveBeenCalled();
    });

    it("should handle redis errors gracefully", async () => {
      mockRedisClient.quit.mockRejectedValue(new Error("Redis error"));

      await expect(cacheService.stop()).resolves.not.toThrow();
    });
  });
});
