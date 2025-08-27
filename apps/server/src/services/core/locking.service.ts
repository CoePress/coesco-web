import { cacheService } from "@/services";
import { logger } from "@/utils/logger";
import { prisma } from "@/utils/prisma";

export interface LockInfo {
  userId: string;
  timestamp: number;
  recordType: string;
  recordId: string;
}

export interface LockResult {
  success: boolean;
  lockedBy?: string;
  lockInfo?: LockInfo;
  error?: string;
}

export class LockingService {
  private readonly DEFAULT_TTL = 300; // 5 minutes
  private readonly LOCK_KEY_PREFIX = "lock:";

  async acquireLock(
    recordType: string,
    recordId: string,
    userId: string,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<LockResult> {
    try {
      const entityTypes = await this.getEntityTypes();
      const foundType = entityTypes.find(
        t =>
          t.tableName.replace(/_/g, "-") === recordType
          || t.tableName === recordType,
      );
      if (!foundType) {
        return {
          success: false,
          error: `Entity type '${recordType}' does not exist.`,
        };
      }
      const modelName = foundType.modelName;
      const prismaModel = (prisma as any)[
        modelName.charAt(0).toLowerCase() + modelName.slice(1)
      ];
      if (!prismaModel) {
        return {
          success: false,
          error: `Prisma model for entity type '${recordType}' does not exist.`,
        };
      }
      const entity = await prismaModel.findUnique({ where: { id: recordId } });
      if (!entity) {
        return {
          success: false,
          error: `Entity of type '${recordType}' with ID '${recordId}' does not exist.`,
        };
      }
      const lockKey = this.getLockKey(recordType, recordId);
      const existingLock = await cacheService.get<LockInfo>(lockKey);
      if (existingLock) {
        if (existingLock.userId === userId) {
          const lockInfo: LockInfo = {
            userId,
            timestamp: Date.now(),
            recordType,
            recordId,
          };
          await cacheService.set(lockKey, lockInfo, ttl);
          return {
            success: true,
            lockInfo,
          };
        }
        else {
          return {
            success: false,
            lockedBy: existingLock.userId,
            error: "Document is locked by another user",
          };
        }
      }
      const lockInfo: LockInfo = {
        userId,
        timestamp: Date.now(),
        recordType,
        recordId,
      };
      await cacheService.set(lockKey, lockInfo, ttl);
      logger.info(`Lock acquired for document ${recordId} by user ${userId}`);
      return {
        success: true,
        lockInfo,
      };
    }
    catch (error) {
      logger.error(`Error acquiring lock for document ${recordId}:`, error);
      return {
        success: false,
        error: "Failed to acquire lock",
      };
    }
  }

  async releaseLock(
    recordType: string,
    recordId: string,
    userId: string,
  ): Promise<LockResult> {
    try {
      const lockKey = this.getLockKey(recordType, recordId);
      const existingLock = await cacheService.get<LockInfo>(lockKey);

      if (!existingLock) {
        return {
          success: true,
        };
      }

      if (existingLock.userId !== userId) {
        return {
          success: false,
          error: "You do not own this lock",
          lockedBy: existingLock.userId,
        };
      }

      await cacheService.delete(lockKey);

      logger.info(`Lock released for document ${recordId} by user ${userId}`);

      return {
        success: true,
      };
    }
    catch (error) {
      logger.error(`Error releasing lock for document ${recordId}:`, error);
      return {
        success: false,
        error: "Failed to release lock",
      };
    }
  }

  async forceReleaseLock(
    recordType: string,
    recordId: string,
    adminUserId: string,
  ): Promise<LockResult> {
    try {
      const lockKey = this.getLockKey(recordType, recordId);
      const existingLock = await cacheService.get<LockInfo>(lockKey);

      if (!existingLock) {
        return {
          success: true,
        };
      }

      await cacheService.delete(lockKey);

      logger.info(
        `Lock force-released for document ${recordId} by admin ${adminUserId} (was held by ${existingLock.userId})`,
      );

      return {
        success: true,
      };
    }
    catch (error) {
      logger.error(
        `Error force-releasing lock for document ${recordId}:`,
        error,
      );
      return {
        success: false,
        error: "Failed to force release lock",
      };
    }
  }

  async extendLock(
    recordType: string,
    recordId: string,
    userId: string,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<LockResult> {
    try {
      const lockKey = this.getLockKey(recordType, recordId);
      const existingLock = await cacheService.get<LockInfo>(lockKey);

      if (!existingLock) {
        return {
          success: false,
          error: "No lock exists for this document",
        };
      }

      if (existingLock.userId !== userId) {
        return {
          success: false,
          error: "You do not own this lock",
          lockedBy: existingLock.userId,
        };
      }

      const updatedLockInfo: LockInfo = {
        ...existingLock,
        timestamp: Date.now(),
      };

      await cacheService.set(lockKey, updatedLockInfo, ttl);

      return {
        success: true,
        lockInfo: updatedLockInfo,
      };
    }
    catch (error) {
      logger.error(`Error extending lock for document ${recordId}:`, error);
      return {
        success: false,
        error: "Failed to extend lock",
      };
    }
  }

  async getLockInfo(
    recordType: string,
    recordId: string,
  ): Promise<LockInfo | null> {
    try {
      const lockKey = this.getLockKey(recordType, recordId);
      return await cacheService.get<LockInfo>(lockKey);
    }
    catch (error) {
      logger.error(`Error getting lock info for document ${recordId}:`, error);
      return null;
    }
  }

  async isLocked(recordType: string, recordId: string): Promise<boolean> {
    try {
      const lockKey = this.getLockKey(recordType, recordId);
      return await cacheService.exists(lockKey);
    }
    catch (error) {
      logger.error(
        `Error checking lock status for document ${recordId}:`,
        error,
      );
      return false;
    }
  }

  async getAllLocks(): Promise<Array<{ key: string; lockInfo: LockInfo }>> {
    try {
      const lockKeys = await cacheService.scanKeys(`${this.LOCK_KEY_PREFIX}*`);
      const locks: Array<{ key: string; lockInfo: LockInfo }> = [];

      for (const key of lockKeys) {
        const lockInfo = await cacheService.get<LockInfo>(key);
        if (lockInfo) {
          locks.push({
            key,
            lockInfo,
          });
        }
      }

      return locks;
    }
    catch (error) {
      logger.error("Error getting all locks:", error);
      return [];
    }
  }

  async getAllLocksByRecordType(
    recordType: string,
  ): Promise<Array<{ key: string; lockInfo: LockInfo }>> {
    try {
      const lockKeys = await cacheService.scanKeys(
        `${this.LOCK_KEY_PREFIX}${recordType}:*`,
      );
      const locks: Array<{ key: string; lockInfo: LockInfo }> = [];

      for (const key of lockKeys) {
        const lockInfo = await cacheService.get<LockInfo>(key);
        if (lockInfo) {
          locks.push({ key, lockInfo });
        }
      }

      return locks;
    }
    catch (error) {
      logger.error(
        `Error getting all locks for record type ${recordType}:`,
        error,
      );
      return [];
    }
  }

  async clearAllLocks(): Promise<void> {
    try {
      logger.warn("clearAllLocks() called - clearing entire cache");
      await cacheService.clearCache();
    }
    catch (error) {
      logger.error("Error clearing all locks:", error);
    }
  }

  private getLockKey(recordType: string, recordId: string): string {
    return `${this.LOCK_KEY_PREFIX}${recordType}:${recordId}`;
  }

  async getEntityTypes(): Promise<
    Array<{ tableName: string; modelName: string }>
  > {
    const result = await prisma.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;

    return result.map(row => ({
      tableName: row.tablename,
      modelName: this.convertToModelName(row.tablename),
    }));
  }

  async getEntityFields(entityType: string): Promise<string[]> {
    const result = await prisma.$queryRaw<
      Array<{ column_name: string }>
    >`SELECT column_name FROM information_schema.columns WHERE table_name = ${entityType} AND table_schema = 'public'`;

    return result.map(row => row.column_name);
  }

  private convertToModelName(tableName: string): string {
    let modelName = tableName
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("");

    if (modelName.endsWith("ies")) {
      modelName = `${modelName.slice(0, -3)}y`;
    }
    else if (
      modelName.endsWith("ses")
      || modelName.endsWith("ches")
      || modelName.endsWith("shes")
    ) {
      modelName = modelName.slice(0, -2);
    }
    else if (modelName.endsWith("s") && !modelName.endsWith("ss")) {
      modelName = modelName.slice(0, -1);
    }

    return modelName;
  }
}
