import { cacheService } from "@/services";
import { prisma } from "@/utils/prisma";

import type { LockInfo } from "../locking.service";

import { LockingService } from "../locking.service";

jest.mock("@/utils/logger");
jest.mock("@/utils/prisma", () => ({
  prisma: {
    employee: {
      findUnique: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}));
jest.mock("@/services", () => ({
  cacheService: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    exists: jest.fn(),
    scanKeys: jest.fn(),
    clearCache: jest.fn(),
  },
}));

describe("lockingService", () => {
  let service: LockingService;
  const mockUserId = "user-123";
  const mockRecordType = "quote";
  const mockRecordId = "record-456";

  beforeEach(() => {
    (cacheService.get as jest.Mock).mockReset();
    (cacheService.set as jest.Mock).mockReset();
    (cacheService.delete as jest.Mock).mockReset();
    (cacheService.exists as jest.Mock).mockReset();
    (cacheService.scanKeys as jest.Mock).mockReset();
    (cacheService.clearCache as jest.Mock).mockReset();
    (prisma.employee.findUnique as jest.Mock).mockReset();
    (prisma.$queryRaw as jest.Mock).mockReset();
    service = new LockingService();
  });

  describe("acquireLock", () => {
    it("should acquire lock successfully when no lock exists", async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([
        { tablename: "quotes" },
      ]);
      (prisma as any).quote = {
        findUnique: jest.fn().mockResolvedValue({ id: mockRecordId }),
      };
      (prisma.employee.findUnique as jest.Mock).mockResolvedValue({
        firstName: "John",
        lastName: "Doe",
      });
      (cacheService.get as jest.Mock).mockResolvedValue(null);

      const result = await service.acquireLock(mockRecordType, mockRecordId, mockUserId);

      expect(result.success).toBe(true);
      expect(result.lockInfo).toBeDefined();
      expect(result.lockInfo?.userId).toBe(mockUserId);
      expect(result.lockInfo?.userName).toBe("John Doe");
      expect(result.lockInfo?.recordType).toBe(mockRecordType);
      expect(result.lockInfo?.recordId).toBe(mockRecordId);
      expect(cacheService.set).toHaveBeenCalledWith(
        `lock:${mockRecordType}:${mockRecordId}`,
        expect.objectContaining({
          userId: mockUserId,
          recordType: mockRecordType,
          recordId: mockRecordId,
        }),
        300,
      );
    });

    it("should renew lock when user already owns it", async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([
        { tablename: "quotes" },
      ]);
      (prisma as any).quote = {
        findUnique: jest.fn().mockResolvedValue({ id: mockRecordId }),
      };
      (prisma.employee.findUnique as jest.Mock).mockResolvedValue({
        firstName: "John",
        lastName: "Doe",
      });
      const existingLock: LockInfo = {
        userId: mockUserId,
        userName: "John Doe",
        timestamp: Date.now() - 60000,
        recordType: mockRecordType,
        recordId: mockRecordId,
      };
      (cacheService.get as jest.Mock).mockResolvedValue(existingLock);

      const result = await service.acquireLock(mockRecordType, mockRecordId, mockUserId);

      expect(result.success).toBe(true);
      expect(result.lockInfo?.userId).toBe(mockUserId);
      expect(cacheService.set).toHaveBeenCalled();
    });

    it("should fail when lock is held by another user", async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([
        { tablename: "quotes" },
      ]);
      (prisma as any).quote = {
        findUnique: jest.fn().mockResolvedValue({ id: mockRecordId }),
      };
      const existingLock: LockInfo = {
        userId: "other-user",
        userName: "Jane Smith",
        timestamp: Date.now(),
        recordType: mockRecordType,
        recordId: mockRecordId,
      };
      (cacheService.get as jest.Mock).mockResolvedValue(existingLock);

      const result = await service.acquireLock(mockRecordType, mockRecordId, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Document is locked by another user");
      expect(result.lockedBy).toBe("other-user");
      expect(cacheService.set).not.toHaveBeenCalled();
    });

    it("should fail when entity type does not exist", async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([
        { tablename: "companies" },
      ]);

      const result = await service.acquireLock("invalid-type", mockRecordId, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Entity type 'invalid-type' does not exist");
    });

    it("should fail when entity does not exist", async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([
        { tablename: "quotes" },
      ]);
      (prisma as any).quote = {
        findUnique: jest.fn().mockResolvedValue(null),
      };

      const result = await service.acquireLock(mockRecordType, mockRecordId, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toContain("does not exist");
    });

    it("should use custom TTL when provided", async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([
        { tablename: "quotes" },
      ]);
      (prisma as any).quote = {
        findUnique: jest.fn().mockResolvedValue({ id: mockRecordId }),
      };
      (prisma.employee.findUnique as jest.Mock).mockResolvedValue({
        firstName: "John",
        lastName: "Doe",
      });
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      const customTTL = 600;

      await service.acquireLock(mockRecordType, mockRecordId, mockUserId, customTTL);

      expect(cacheService.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        customTTL,
      );
    });

    it("should handle errors gracefully", async () => {
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error("Database error"));

      const result = await service.acquireLock(mockRecordType, mockRecordId, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to acquire lock");
    });

    it("should handle entity type with hyphens", async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([
        { tablename: "product_classes" },
      ]);
      (prisma as any).productClass = {
        findUnique: jest.fn().mockResolvedValue({ id: mockRecordId }),
      };
      (cacheService.get as jest.Mock).mockResolvedValue(null);

      const result = await service.acquireLock("product-classes", mockRecordId, mockUserId);

      expect(result.success).toBe(true);
    });
  });

  describe("releaseLock", () => {
    it("should release lock successfully when user owns it", async () => {
      const existingLock: LockInfo = {
        userId: mockUserId,
        userName: "John Doe",
        timestamp: Date.now(),
        recordType: mockRecordType,
        recordId: mockRecordId,
      };
      (cacheService.get as jest.Mock).mockResolvedValue(existingLock);

      const result = await service.releaseLock(mockRecordType, mockRecordId, mockUserId);

      expect(result.success).toBe(true);
      expect(cacheService.delete).toHaveBeenCalledWith(`lock:${mockRecordType}:${mockRecordId}`);
    });

    it("should succeed when no lock exists", async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(null);

      const result = await service.releaseLock(mockRecordType, mockRecordId, mockUserId);

      expect(result.success).toBe(true);
      expect(cacheService.delete).not.toHaveBeenCalled();
    });

    it("should fail when user does not own the lock", async () => {
      const existingLock: LockInfo = {
        userId: "other-user",
        userName: "Jane Smith",
        timestamp: Date.now(),
        recordType: mockRecordType,
        recordId: mockRecordId,
      };
      (cacheService.get as jest.Mock).mockResolvedValue(existingLock);

      const result = await service.releaseLock(mockRecordType, mockRecordId, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("You do not own this lock");
      expect(result.lockedBy).toBe("other-user");
      expect(cacheService.delete).not.toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      (cacheService.get as jest.Mock).mockRejectedValue(new Error("Cache error"));

      const result = await service.releaseLock(mockRecordType, mockRecordId, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to release lock");
    });
  });

  describe("forceReleaseLock", () => {
    it("should force release any lock", async () => {
      const existingLock: LockInfo = {
        userId: "other-user",
        userName: "Jane Smith",
        timestamp: Date.now(),
        recordType: mockRecordType,
        recordId: mockRecordId,
      };
      (cacheService.get as jest.Mock).mockResolvedValue(existingLock);

      const result = await service.forceReleaseLock(mockRecordType, mockRecordId, "admin-123");

      expect(result.success).toBe(true);
      expect(cacheService.delete).toHaveBeenCalledWith(`lock:${mockRecordType}:${mockRecordId}`);
    });

    it("should succeed when no lock exists", async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(null);

      const result = await service.forceReleaseLock(mockRecordType, mockRecordId, "admin-123");

      expect(result.success).toBe(true);
      expect(cacheService.delete).not.toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      (cacheService.get as jest.Mock).mockRejectedValue(new Error("Cache error"));

      const result = await service.forceReleaseLock(mockRecordType, mockRecordId, "admin-123");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to force release lock");
    });
  });

  describe("extendLock", () => {
    it("should extend lock when user owns it", async () => {
      const existingLock: LockInfo = {
        userId: mockUserId,
        userName: "John Doe",
        timestamp: Date.now() - 60000,
        recordType: mockRecordType,
        recordId: mockRecordId,
      };
      (cacheService.get as jest.Mock).mockResolvedValue(existingLock);
      (prisma.employee.findUnique as jest.Mock).mockResolvedValue({
        firstName: "John",
        lastName: "Doe",
      });

      const result = await service.extendLock(mockRecordType, mockRecordId, mockUserId);

      expect(result.success).toBe(true);
      expect(result.lockInfo?.timestamp).toBeGreaterThan(existingLock.timestamp);
      expect(cacheService.set).toHaveBeenCalled();
    });

    it("should fail when no lock exists", async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(null);

      const result = await service.extendLock(mockRecordType, mockRecordId, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("No lock exists for this document");
    });

    it("should fail when user does not own the lock", async () => {
      const existingLock: LockInfo = {
        userId: "other-user",
        userName: "Jane Smith",
        timestamp: Date.now(),
        recordType: mockRecordType,
        recordId: mockRecordId,
      };
      (cacheService.get as jest.Mock).mockResolvedValue(existingLock);

      const result = await service.extendLock(mockRecordType, mockRecordId, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("You do not own this lock");
      expect(result.lockedBy).toBe("other-user");
    });

    it("should use custom TTL when provided", async () => {
      const existingLock: LockInfo = {
        userId: mockUserId,
        userName: "John Doe",
        timestamp: Date.now(),
        recordType: mockRecordType,
        recordId: mockRecordId,
      };
      (cacheService.get as jest.Mock).mockResolvedValue(existingLock);
      (prisma.employee.findUnique as jest.Mock).mockResolvedValue({
        firstName: "John",
        lastName: "Doe",
      });
      const customTTL = 600;

      await service.extendLock(mockRecordType, mockRecordId, mockUserId, customTTL);

      expect(cacheService.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        customTTL,
      );
    });

    it("should handle errors gracefully", async () => {
      (cacheService.get as jest.Mock).mockRejectedValue(new Error("Cache error"));

      const result = await service.extendLock(mockRecordType, mockRecordId, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to extend lock");
    });
  });

  describe("getLockInfo", () => {
    it("should return lock info when lock exists", async () => {
      const lockInfo: LockInfo = {
        userId: mockUserId,
        userName: "John Doe",
        timestamp: Date.now(),
        recordType: mockRecordType,
        recordId: mockRecordId,
      };
      (cacheService.get as jest.Mock).mockResolvedValue(lockInfo);

      const result = await service.getLockInfo(mockRecordType, mockRecordId);

      expect(result).toEqual(lockInfo);
    });

    it("should return null when no lock exists", async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(null);

      const result = await service.getLockInfo(mockRecordType, mockRecordId);

      expect(result).toBeNull();
    });

    it("should return null on error", async () => {
      (cacheService.get as jest.Mock).mockRejectedValue(new Error("Cache error"));

      const result = await service.getLockInfo(mockRecordType, mockRecordId);

      expect(result).toBeNull();
    });
  });

  describe("isLocked", () => {
    it("should return true when lock exists", async () => {
      (cacheService.exists as jest.Mock).mockResolvedValue(true);

      const result = await service.isLocked(mockRecordType, mockRecordId);

      expect(result).toBe(true);
    });

    it("should return false when no lock exists", async () => {
      (cacheService.exists as jest.Mock).mockResolvedValue(false);

      const result = await service.isLocked(mockRecordType, mockRecordId);

      expect(result).toBe(false);
    });

    it("should return false on error", async () => {
      (cacheService.exists as jest.Mock).mockRejectedValue(new Error("Cache error"));

      const result = await service.isLocked(mockRecordType, mockRecordId);

      expect(result).toBe(false);
    });
  });

  describe("getAllLocks", () => {
    it("should return all locks", async () => {
      const lockKeys = ["lock:quote:1", "lock:quote:2", "lock:company:3"];
      const locks: LockInfo[] = [
        {
          userId: "user-1",
          userName: "User One",
          timestamp: Date.now(),
          recordType: "quote",
          recordId: "1",
        },
        {
          userId: "user-2",
          userName: "User Two",
          timestamp: Date.now(),
          recordType: "quote",
          recordId: "2",
        },
        {
          userId: "user-3",
          userName: "User Three",
          timestamp: Date.now(),
          recordType: "company",
          recordId: "3",
        },
      ];

      (cacheService.scanKeys as jest.Mock).mockResolvedValue(lockKeys);
      (cacheService.get as jest.Mock)
        .mockResolvedValueOnce(locks[0])
        .mockResolvedValueOnce(locks[1])
        .mockResolvedValueOnce(locks[2]);

      const result = await service.getAllLocks();

      expect(result).toHaveLength(3);
      expect(result[0].key).toBe(lockKeys[0]);
      expect(result[0].lockInfo).toEqual(locks[0]);
    });

    it("should skip keys with no lock info", async () => {
      const lockKeys = ["lock:quote:1", "lock:quote:2"];
      (cacheService.scanKeys as jest.Mock).mockResolvedValue(lockKeys);
      (cacheService.get as jest.Mock)
        .mockResolvedValueOnce({ userId: "user-1", recordType: "quote", recordId: "1", timestamp: Date.now() })
        .mockResolvedValueOnce(null);

      const result = await service.getAllLocks();

      expect(result).toHaveLength(1);
    });

    it("should return empty array on error", async () => {
      (cacheService.scanKeys as jest.Mock).mockRejectedValue(new Error("Cache error"));

      const result = await service.getAllLocks();

      expect(result).toEqual([]);
    });
  });

  describe("getAllLocksByRecordType", () => {
    it("should return locks for specific record type", async () => {
      const lockKeys = ["lock:quote:1", "lock:quote:2"];
      const locks: LockInfo[] = [
        {
          userId: "user-1",
          userName: "User One",
          timestamp: Date.now(),
          recordType: "quote",
          recordId: "1",
        },
        {
          userId: "user-2",
          userName: "User Two",
          timestamp: Date.now(),
          recordType: "quote",
          recordId: "2",
        },
      ];

      (cacheService.scanKeys as jest.Mock).mockResolvedValue(lockKeys);
      (cacheService.get as jest.Mock)
        .mockResolvedValueOnce(locks[0])
        .mockResolvedValueOnce(locks[1]);

      const result = await service.getAllLocksByRecordType("quote");

      expect(result).toHaveLength(2);
      expect(cacheService.scanKeys).toHaveBeenCalledWith("lock:quote:*");
    });

    it("should return empty array on error", async () => {
      (cacheService.scanKeys as jest.Mock).mockRejectedValue(new Error("Cache error"));

      const result = await service.getAllLocksByRecordType("quote");

      expect(result).toEqual([]);
    });
  });

  describe("clearAllLocks", () => {
    it("should clear all locks", async () => {
      await service.clearAllLocks();

      expect(cacheService.clearCache).toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      (cacheService.clearCache as jest.Mock).mockRejectedValue(new Error("Cache error"));

      await expect(service.clearAllLocks()).resolves.not.toThrow();
    });
  });

  describe("getEntityTypes", () => {
    it("should return list of entity types", async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([
        { tablename: "quotes" },
        { tablename: "companies" },
        { tablename: "product_classes" },
      ]);

      const result = await service.getEntityTypes();

      expect(result).toEqual([
        { tableName: "quotes", modelName: "Quote" },
        { tableName: "companies", modelName: "Company" },
        { tableName: "product_classes", modelName: "ProductClass" },
      ]);
    });

    it("should handle table names ending with ies", async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([
        { tablename: "categories" },
      ]);

      const result = await service.getEntityTypes();

      expect(result[0].modelName).toBe("Category");
    });

    it("should handle table names ending with ses", async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([
        { tablename: "addresses" },
      ]);

      const result = await service.getEntityTypes();

      expect(result[0].modelName).toBe("Address");
    });

    it("should handle table names ending with ches", async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([
        { tablename: "batches" },
      ]);

      const result = await service.getEntityTypes();

      expect(result[0].modelName).toBe("Batch");
    });

    it("should not remove s from words ending with ss", async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([
        { tablename: "progress" },
      ]);

      const result = await service.getEntityTypes();

      expect(result[0].modelName).toBe("Progress");
    });
  });

  describe("getEntityFields", () => {
    it("should return list of fields for entity type", async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([
        { column_name: "id" },
        { column_name: "name" },
        { column_name: "created_at" },
      ]);

      const result = await service.getEntityFields("quotes");

      expect(result).toEqual(["id", "name", "created_at"]);
    });
  });

  describe("getEmployeeName", () => {
    it("should return System for system user", async () => {
      const name = await (service as any).getEmployeeName("system");

      expect(name).toBe("System");
      expect(prisma.employee.findUnique).not.toHaveBeenCalled();
    });

    it("should return full name for regular employee", async () => {
      (prisma.employee.findUnique as jest.Mock).mockResolvedValue({
        firstName: "John",
        lastName: "Doe",
      });

      const name = await (service as any).getEmployeeName(mockUserId);

      expect(name).toBe("John Doe");
    });

    it("should return undefined when employee not found", async () => {
      (prisma.employee.findUnique as jest.Mock).mockResolvedValue(null);

      const name = await (service as any).getEmployeeName(mockUserId);

      expect(name).toBeUndefined();
    });

    it("should return undefined on error", async () => {
      (prisma.employee.findUnique as jest.Mock).mockRejectedValue(new Error("Database error"));

      const name = await (service as any).getEmployeeName(mockUserId);

      expect(name).toBeUndefined();
    });
  });
});
