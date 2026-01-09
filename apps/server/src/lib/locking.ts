import { cacheService } from "./cache";
import logger from "./logger";
import { prisma } from "./prisma";

export interface LockInfo {
  userId: string;
  userName?: string;
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

class LockingService {
  private readonly DEFAULT_TTL = 300; // 5 minutes
  private readonly LOCK_KEY_PREFIX = "lock:";

  private async getEmployeeName(userId: string): Promise<string | undefined> {
    try {
      if (userId === "system") {
        return "System";
      }

      const employee = await prisma.employee.findUnique({
        where: { userId },
        select: { firstName: true, lastName: true },
      });

      if (employee) {
        return `${employee.firstName} ${employee.lastName}`;
      }

      return undefined;
    } catch (error) {
      logger.error(`Error fetching employee name for userId ${userId}:`, error);
      return undefined;
    }
  }

  private getLockKey(recordType: string, recordId: string): string {
    return `${this.LOCK_KEY_PREFIX}${recordType}:${recordId}`;
  }

  async acquireLock(
    recordType: string,
    recordId: string,
    userId: string,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<LockResult> {
    try {
      const lockKey = this.getLockKey(recordType, recordId);
      const existingLock = cacheService.get<LockInfo>(lockKey);
      const userName = await this.getEmployeeName(userId);

      if (existingLock) {
        if (existingLock.userId === userId) {
          // Same user - extend the lock
          const lockInfo: LockInfo = {
            userId,
            userName,
            timestamp: Date.now(),
            recordType,
            recordId,
          };
          cacheService.set(lockKey, lockInfo, ttl);
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
        userName,
        timestamp: Date.now(),
        recordType,
        recordId,
      };
      cacheService.set(lockKey, lockInfo, ttl);
      logger.info(`Lock acquired for ${recordType}/${recordId} by user ${userId}`);
      return {
        success: true,
        lockInfo,
      };
    } catch (error) {
      logger.error(`Error acquiring lock for ${recordType}/${recordId}:`, error);
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
      const existingLock = cacheService.get<LockInfo>(lockKey);

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

      cacheService.delete(lockKey);
      logger.info(`Lock released for ${recordType}/${recordId} by user ${userId}`);

      return {
        success: true,
      };
    } catch (error) {
      logger.error(`Error releasing lock for ${recordType}/${recordId}:`, error);
      return {
        success: false,
        error: "Failed to release lock",
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
      const existingLock = cacheService.get<LockInfo>(lockKey);

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

      const userName = await this.getEmployeeName(userId);
      const updatedLockInfo: LockInfo = {
        ...existingLock,
        userName,
        timestamp: Date.now(),
      };

      cacheService.set(lockKey, updatedLockInfo, ttl);

      return {
        success: true,
        lockInfo: updatedLockInfo,
      };
    } catch (error) {
      logger.error(`Error extending lock for ${recordType}/${recordId}:`, error);
      return {
        success: false,
        error: "Failed to extend lock",
      };
    }
  }

  getLockInfo(recordType: string, recordId: string): LockInfo | null {
    try {
      const lockKey = this.getLockKey(recordType, recordId);
      return cacheService.get<LockInfo>(lockKey);
    } catch (error) {
      logger.error(`Error getting lock info for ${recordType}/${recordId}:`, error);
      return null;
    }
  }

  isLocked(recordType: string, recordId: string): boolean {
    try {
      const lockKey = this.getLockKey(recordType, recordId);
      return cacheService.exists(lockKey);
    } catch (error) {
      logger.error(`Error checking lock status for ${recordType}/${recordId}:`, error);
      return false;
    }
  }

  getAllLocks(): Array<{ key: string; lockInfo: LockInfo }> {
    try {
      const lockKeys = cacheService.scanKeys(`${this.LOCK_KEY_PREFIX}*`);
      const locks: Array<{ key: string; lockInfo: LockInfo }> = [];

      for (const key of lockKeys) {
        const lockInfo = cacheService.get<LockInfo>(key);
        if (lockInfo) {
          locks.push({
            key,
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
}

export const lockingService = new LockingService();
