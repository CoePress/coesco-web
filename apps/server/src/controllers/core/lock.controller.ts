import type { NextFunction, Request, Response } from "express";

import type { AuthenticatedRequest } from "@/middleware/auth.middleware";

import { lockingService } from "@/services";
import { getEmployeeContext } from "@/utils/context";

export class LockController {
  async acquireLock(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { recordType, recordId, ttl } = req.body;

      const employee = getEmployeeContext();

      if (!recordType || !recordId) {
        res.status(400).json({
          success: false,
          error: "recordType and recordId are required",
        });
        return;
      }

      const result = await lockingService.acquireLock(
        recordType,
        recordId,
        employee.id,
        ttl || undefined,
      );

      if (result.success) {
        res.status(200).json({
          success: true,
          message: "Lock acquired successfully",
          lockInfo: result.lockInfo,
        });
      }
      else {
        res.status(409).json({
          success: false,
          error: result.error,
          lockedBy: result.lockedBy,
        });
      }
    }
    catch (error) {
      next(error);
    }
  }

  async releaseLock(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { recordType, recordId, userId } = req.body;

      if (!recordType || !recordId || !userId) {
        res.status(400).json({
          success: false,
          error: "recordType, recordId and userId are required",
        });
        return;
      }

      const result = await lockingService.releaseLock(
        recordType,
        recordId,
        userId,
      );

      if (result.success) {
        res.status(200).json({
          success: true,
          message: "Lock released successfully",
        });
      }
      else {
        res.status(403).json({
          success: false,
          error: result.error,
          lockedBy: result.lockedBy,
        });
      }
    }
    catch (error) {
      next(error);
    }
  }

  async forceReleaseLock(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { recordType, recordId } = req.body;
      const authReq = req as AuthenticatedRequest;

      if (!recordType || !recordId) {
        res.status(400).json({
          success: false,
          error: "recordType and recordId are required",
        });
        return;
      }

      if (authReq.user?.role !== "ADMIN") {
        res.status(403).json({
          success: false,
          error: "Admin privileges required",
        });
        return;
      }

      const result = await lockingService.forceReleaseLock(
        recordType,
        recordId,
        authReq.user.id,
      );

      if (result.success) {
        res.status(200).json({
          success: true,
          message: "Lock force-released successfully",
        });
      }
      else {
        res.status(500).json({
          success: false,
          error: result.error,
        });
      }
    }
    catch (error) {
      next(error);
    }
  }

  async extendLock(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { recordType, recordId, ttl } = req.body;

      const employee = getEmployeeContext();

      if (!recordType || !recordId) {
        res.status(400).json({
          success: false,
          error: "recordType and recordId are required",
        });
        return;
      }

      const result = await lockingService.extendLock(
        recordType,
        recordId,
        employee.id,
        ttl,
      );

      if (result.success) {
        res.status(200).json({
          success: true,
          message: "Lock extended successfully",
          lockInfo: result.lockInfo,
        });
      }
      else {
        res.status(400).json({
          success: false,
          error: result.error,
          lockedBy: result.lockedBy,
        });
      }
    }
    catch (error) {
      next(error);
    }
  }

  async getLockStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { recordType, recordId } = req.params;

      if (!recordType || !recordId) {
        res.status(400).json({
          success: false,
          error: "recordType and recordId are required",
        });
        return;
      }

      const lockInfo = await lockingService.getLockInfo(recordType, recordId);
      const isLocked = await lockingService.isLocked(recordType, recordId);

      res.status(200).json({
        success: true,
        isLocked,
        lockInfo: lockInfo || null,
      });
    }
    catch (error) {
      next(error);
    }
  }

  async getAllLocks(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;

      if (authReq.user?.role !== "ADMIN") {
        res.status(403).json({
          success: false,
          error: "Admin privileges required",
        });
        return;
      }

      const locks = await lockingService.getAllLocks();

      res.status(200).json({
        success: true,
        locks,
      });
    }
    catch (error) {
      next(error);
    }
  }

  async getAllLocksByRecordType(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { recordType } = req.params;

      if (!recordType) {
        res.status(400).json({
          success: false,
          error: "recordType is required",
        });
        return;
      }

      const locks = await lockingService.getAllLocksByRecordType(recordType);

      res.status(200).json({
        success: true,
        locks,
      });
    }
    catch (error) {
      next(error);
    }
  }

  async clearAllLocks(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;

      if (authReq.user?.role !== "ADMIN") {
        res.status(403).json({
          success: false,
          error: "Admin privileges required",
        });
        return;
      }

      await lockingService.clearAllLocks();

      res.status(200).json({
        success: true,
        message: "All locks cleared successfully",
      });
    }
    catch (error) {
      next(error);
    }
  }
}
