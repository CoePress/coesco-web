import { cacheService } from "..";
import { logger } from "@/utils/logger";

export interface LockInfo {
  userId: string;
  timestamp: number;
  username?: string;
}

export interface LockResult {
  success: boolean;
  lockedBy?: string;
  lockInfo?: LockInfo;
  error?: string;
}

export class LockingService {
  private readonly DEFAULT_TTL = 300; // 5 minutes
  private readonly LOCK_KEY_PREFIX = "doc-lock:";

  async acquireLock(
    entityType: string,
    entityId: string,
    userId: string,
    ttl: number = this.DEFAULT_TTL,
    username?: string
  ): Promise<LockResult> {
    try {
      const lockKey = this.getLockKey(entityType, entityId);

      const existingLock = await cacheService.get<LockInfo>(lockKey);

      if (existingLock) {
        if (existingLock.userId === userId) {
          const lockInfo: LockInfo = {
            userId,
            timestamp: Date.now(),
            username: username || existingLock.username,
          };

          await cacheService.set(lockKey, lockInfo, ttl);

          return {
            success: true,
            lockInfo,
          };
        } else {
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
        username,
      };

      await cacheService.set(lockKey, lockInfo, ttl);

      logger.info(`Lock acquired for document ${entityId} by user ${userId}`);

      return {
        success: true,
        lockInfo,
      };
    } catch (error) {
      logger.error(`Error acquiring lock for document ${entityId}:`, error);
      return {
        success: false,
        error: "Failed to acquire lock",
      };
    }
  }

  async releaseLock(
    entityType: string,
    entityId: string,
    userId: string
  ): Promise<LockResult> {
    try {
      const lockKey = this.getLockKey(entityType, entityId);
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

      logger.info(`Lock released for document ${entityId} by user ${userId}`);

      return {
        success: true,
      };
    } catch (error) {
      logger.error(`Error releasing lock for document ${entityId}:`, error);
      return {
        success: false,
        error: "Failed to release lock",
      };
    }
  }

  async forceReleaseLock(
    entityType: string,
    entityId: string,
    adminUserId: string
  ): Promise<LockResult> {
    try {
      const lockKey = this.getLockKey(entityType, entityId);
      const existingLock = await cacheService.get<LockInfo>(lockKey);

      if (!existingLock) {
        return {
          success: true,
        };
      }

      await cacheService.delete(lockKey);

      logger.info(
        `Lock force-released for document ${entityId} by admin ${adminUserId} (was held by ${existingLock.userId})`
      );

      return {
        success: true,
      };
    } catch (error) {
      logger.error(
        `Error force-releasing lock for document ${entityId}:`,
        error
      );
      return {
        success: false,
        error: "Failed to force release lock",
      };
    }
  }

  async extendLock(
    entityType: string,
    entityId: string,
    userId: string,
    ttl: number = this.DEFAULT_TTL
  ): Promise<LockResult> {
    try {
      const lockKey = this.getLockKey(entityType, entityId);
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
    } catch (error) {
      logger.error(`Error extending lock for document ${entityId}:`, error);
      return {
        success: false,
        error: "Failed to extend lock",
      };
    }
  }

  async getLockInfo(
    entityType: string,
    entityId: string
  ): Promise<LockInfo | null> {
    try {
      const lockKey = this.getLockKey(entityType, entityId);
      return await cacheService.get<LockInfo>(lockKey);
    } catch (error) {
      logger.error(`Error getting lock info for document ${entityId}:`, error);
      return null;
    }
  }

  async isLocked(entityType: string, entityId: string): Promise<boolean> {
    try {
      const lockKey = this.getLockKey(entityType, entityId);
      return await cacheService.exists(lockKey);
    } catch (error) {
      logger.error(
        `Error checking lock status for document ${entityId}:`,
        error
      );
      return false;
    }
  }

  async getAllLocks(): Promise<
    Array<{ entityId: string; lockInfo: LockInfo }>
  > {
    try {
      const lockKeys = await cacheService.scanKeys(`${this.LOCK_KEY_PREFIX}*`);
      const locks: Array<{ entityId: string; lockInfo: LockInfo }> = [];

      for (const key of lockKeys) {
        const lockInfo = await cacheService.get<LockInfo>(key);
        if (lockInfo) {
          const entityId = key.replace(`${this.LOCK_KEY_PREFIX}`, "");
          locks.push({
            entityId,
            lockInfo,
          });
        }
      }

      return locks;
    } catch (error) {
      logger.error("Error getting all locks:", error);
      return [];
    }
  }

  async clearAllLocks(): Promise<void> {
    try {
      logger.warn("clearAllLocks() called - clearing entire cache");
      await cacheService.clearCache();
    } catch (error) {
      logger.error("Error clearing all locks:", error);
    }
  }

  private getLockKey(entityType: string, entityId: string): string {
    return `${this.LOCK_KEY_PREFIX}${entityType}:${entityId}`;
  }
}
