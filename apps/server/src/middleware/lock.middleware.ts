import { Response, NextFunction } from "express";
import { logger } from "@/utils/logger";
import { AuthenticatedRequest } from "./auth.middleware";
import { lockingService } from "@/services";

export const checkEntityLock = (
  entityType: string,
  entityIdParam: string = "id",
  userIdParam: string = "userId"
) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const entityId = req.params[entityIdParam] || req.body[entityIdParam];
      const userId = req.body[userIdParam] || req.user?.id;

      if (!entityType) {
        return res.status(400).json({
          success: false,
          error: "Entity type is required",
        });
      }

      if (!entityId) {
        return res.status(400).json({
          success: false,
          error: "Entity ID is required",
        });
      }

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: "User ID is required",
        });
      }

      const lockInfo = await lockingService.getLockInfo(entityType, entityId);

      if (lockInfo && lockInfo.userId !== userId) {
        return res.status(409).json({
          success: false,
          error: "Entity is locked by another user",
          lockedBy: lockInfo.userId,
          lockInfo,
        });
      }

      next();
    } catch (error) {
      logger.error("Error in checkEntityLock middleware:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  };
};

export const acquireEntityLock = (
  entityType: string,
  entityIdParam: string = "id",
  userIdParam: string = "userId"
) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const entityId = req.params[entityIdParam] || req.body[entityIdParam];
      const userId = req.body[userIdParam] || req.user?.id;
      const username = req.body.username || `${req.user?.id}`;

      if (!entityType) {
        return res.status(400).json({
          success: false,
          error: "Entity type is required",
        });
      }

      if (!entityId) {
        return res.status(400).json({
          success: false,
          error: "Entity ID is required",
        });
      }

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: "User ID is required",
        });
      }

      const result = await lockingService.acquireLock(
        entityType,
        entityId,
        userId,
        username
      );

      if (!result.success) {
        return res.status(409).json({
          success: false,
          error: result.error,
          lockedBy: result.lockedBy,
        });
      }

      req.lockInfo = result.lockInfo;
      next();
    } catch (error) {
      logger.error("Error in acquireEntityLock middleware:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  };
};

export const releaseEntityLock = (
  entityType: string,
  entityIdParam: string = "id",
  userIdParam: string = "userId"
) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const entityId = req.params[entityIdParam] || req.body[entityIdParam];
      const userId = req.body[userIdParam] || req.user?.id;

      if (!entityType || !entityId || !userId) {
        return next();
      }

      await lockingService.releaseLock(entityType, entityId, userId);
      next();
    } catch (error) {
      logger.error("Error in releaseEntityLock middleware:", error);
      next();
    }
  };
};

declare global {
  namespace Express {
    interface Request {
      lockInfo?: {
        userId: string;
        timestamp: number;
        username?: string;
      };
    }
  }
}
