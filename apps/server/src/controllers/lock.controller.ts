import { Request, Response } from "express";
import { logger } from "@/utils/logger";
import { lockingService } from "@/services";
import { getEmployeeContext } from "@/utils/context";

export class LockController {
  async acquireLock(req: Request, res: Response): Promise<void> {
    try {
      const { entityType, entityId, ttl, username } = req.body;

      const employee = getEmployeeContext();

      if (!entityType || !entityId) {
        res.status(400).json({
          success: false,
          error: "entityType and entityId are required",
        });
        return;
      }

      const result = await lockingService.acquireLock(
        entityType,
        entityId,
        employee.id,
        ttl || undefined,
        username
      );

      if (result.success) {
        res.status(200).json({
          success: true,
          message: "Lock acquired successfully",
          lockInfo: result.lockInfo,
        });
      } else {
        res.status(409).json({
          success: false,
          error: result.error,
          lockedBy: result.lockedBy,
        });
      }
    } catch (error) {
      logger.error("Error in acquireLock controller:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async releaseLock(req: Request, res: Response): Promise<void> {
    try {
      const { entityType, entityId, userId } = req.body;

      if (!entityType || !entityId || !userId) {
        res.status(400).json({
          success: false,
          error: "entityType, entityId and userId are required",
        });
        return;
      }

      const result = await lockingService.releaseLock(
        entityType,
        entityId,
        userId
      );

      if (result.success) {
        res.status(200).json({
          success: true,
          message: "Lock released successfully",
        });
      } else {
        res.status(403).json({
          success: false,
          error: result.error,
          lockedBy: result.lockedBy,
        });
      }
    } catch (error) {
      logger.error("Error in releaseLock controller:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async forceReleaseLock(req: Request, res: Response): Promise<void> {
    try {
      const { entityType, entityId, adminUserId } = req.body;

      if (!entityType || !entityId || !adminUserId) {
        res.status(400).json({
          success: false,
          error: "entityType, entityId and adminUserId are required",
        });
        return;
      }

      // const isAdmin = await this.authService.isAdmin(adminUserId);
      // if (!isAdmin) {
      //   res.status(403).json({
      //     success: false,
      //     error: "Admin privileges required",
      //   });
      //   return;
      // }

      const result = await lockingService.forceReleaseLock(
        entityType,
        entityId,
        adminUserId
      );

      if (result.success) {
        res.status(200).json({
          success: true,
          message: "Lock force-released successfully",
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      logger.error("Error in forceReleaseLock controller:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async extendLock(req: Request, res: Response): Promise<void> {
    try {
      const { entityType, entityId, ttl } = req.body;

      const employee = getEmployeeContext();

      if (!entityType || !entityId) {
        res.status(400).json({
          success: false,
          error: "entityType and entityId are required",
        });
        return;
      }

      const result = await lockingService.extendLock(
        entityType,
        entityId,
        employee.id,
        ttl
      );

      if (result.success) {
        res.status(200).json({
          success: true,
          message: "Lock extended successfully",
          lockInfo: result.lockInfo,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          lockedBy: result.lockedBy,
        });
      }
    } catch (error) {
      logger.error("Error in extendLock controller:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async getLockStatus(req: Request, res: Response): Promise<void> {
    try {
      const { entityType, entityId } = req.params;

      if (!entityType || !entityId) {
        res.status(400).json({
          success: false,
          error: "entityType and entityId are required",
        });
        return;
      }

      const lockInfo = await lockingService.getLockInfo(entityType, entityId);
      const isLocked = await lockingService.isLocked(entityType, entityId);

      res.status(200).json({
        success: true,
        isLocked,
        lockInfo: lockInfo || null,
      });
    } catch (error) {
      logger.error("Error in getLockStatus controller:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async getAllLocks(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Add admin role validation here
      // const { userId } = req.user;
      // const isAdmin = await this.authService.isAdmin(userId);
      // if (!isAdmin) {
      //   res.status(403).json({
      //     success: false,
      //     error: "Admin privileges required",
      //   });
      //   return;
      // }

      const locks = await lockingService.getAllLocks();

      res.status(200).json({
        success: true,
        locks,
      });
    } catch (error) {
      logger.error("Error in getAllLocks controller:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async clearAllLocks(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Add admin role validation here
      // const { userId } = req.user;
      // const isAdmin = await this.authService.isAdmin(userId);
      // if (!isAdmin) {
      //   res.status(403).json({
      //     success: false,
      //     error: "Admin privileges required",
      //   });
      //   return;
      // }

      await lockingService.clearAllLocks();

      res.status(200).json({
        success: true,
        message: "All locks cleared successfully",
      });
    } catch (error) {
      logger.error("Error in clearAllLocks controller:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
}
