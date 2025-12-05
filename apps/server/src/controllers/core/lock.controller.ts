import type { Request, Response } from "express";

import type { AuthenticatedRequest } from "@/middleware/auth.middleware";

import { lockingService } from "@/services";
import { asyncWrapper } from "@/utils";
import { getEmployeeContext } from "@/utils/context";
import { HTTP_STATUS } from "@/utils/constants";

export class LockController {
  acquireLock = asyncWrapper(async (req: Request, res: Response) => {
    const { recordType, recordId, ttl } = req.body;

    const employee = getEmployeeContext();

    if (!recordType || !recordId) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
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
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Lock acquired successfully",
        lockInfo: result.lockInfo,
      });
    }
    else {
      res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        error: result.error,
        lockedBy: result.lockedBy,
      });
    }
  });

  releaseLock = asyncWrapper(async (req: Request, res: Response) => {
    const { recordType, recordId, userId } = req.body;

    if (!recordType || !recordId || !userId) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
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
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Lock released successfully",
      });
    }
    else {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: result.error,
        lockedBy: result.lockedBy,
      });
    }
  });

  forceReleaseLock = asyncWrapper(async (req: Request, res: Response) => {
    const { recordType, recordId } = req.body;
    const authReq = req as AuthenticatedRequest;

    if (!recordType || !recordId) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: "recordType and recordId are required",
      });
      return;
    }

    if (authReq.user?.role !== "ADMIN") {
      res.status(HTTP_STATUS.FORBIDDEN).json({
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
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Lock force-released successfully",
      });
    }
    else {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: result.error,
      });
    }
  });

  extendLock = asyncWrapper(async (req: Request, res: Response) => {
    const { recordType, recordId, ttl } = req.body;

    const employee = getEmployeeContext();

    if (!recordType || !recordId) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
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
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Lock extended successfully",
        lockInfo: result.lockInfo,
      });
    }
    else {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: result.error,
        lockedBy: result.lockedBy,
      });
    }
  });

  getLockStatus = asyncWrapper(async (req: Request, res: Response) => {
    const { recordType, recordId } = req.params;

    if (!recordType || !recordId) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: "recordType and recordId are required",
      });
      return;
    }

    const lockInfo = await lockingService.getLockInfo(recordType, recordId);
    const isLocked = await lockingService.isLocked(recordType, recordId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      isLocked,
      lockInfo: lockInfo || null,
    });
  });

  getAllLocks = asyncWrapper(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;

    if (authReq.user?.role !== "ADMIN") {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: "Admin privileges required",
      });
      return;
    }

    const locks = await lockingService.getAllLocks();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      locks,
    });
  });

  getAllLocksByRecordType = asyncWrapper(async (req: Request, res: Response) => {
    const { recordType } = req.params;

    if (!recordType) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: "recordType is required",
      });
      return;
    }

    const locks = await lockingService.getAllLocksByRecordType(recordType);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      locks,
    });
  });

  clearAllLocks = asyncWrapper(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;

    if (authReq.user?.role !== "ADMIN") {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: "Admin privileges required",
      });
      return;
    }

    await lockingService.clearAllLocks();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "All locks cleared successfully",
    });
  });
}
