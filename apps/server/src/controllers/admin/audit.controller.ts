import type { AuditLog, BugReport, EmailLog, LoginHistory } from "@prisma/client";
import type { Request, Response } from "express";

import fs from "node:fs";
import zlib from "node:zlib";

import { auditService, backupService, loginHistoryService } from "@/services";
import { asyncWrapper, buildQueryParams } from "@/utils";
import { HTTP_STATUS } from "@/utils/constants";

export class AuditController {
  getAuditLogs = asyncWrapper(async (req: Request, res: Response) => {
    const params = buildQueryParams<AuditLog>(req.query);
    const result = await auditService.getAuditLogs(params);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getEmailLogs = asyncWrapper(async (req: Request, res: Response) => {
    const params = buildQueryParams<EmailLog>(req.query);
    const result = await auditService.getEmailLogs(params);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getBugReports = asyncWrapper(async (req: Request, res: Response) => {
    const params = buildQueryParams<BugReport>(req.query);
    const result = await auditService.getBugReports(params);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getLoginAttempts = asyncWrapper(async (req: Request, res: Response) => {
    const params = buildQueryParams<LoginHistory>(req.query);
    const result = await loginHistoryService.getAllLoginHistory(params);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getLogFiles = asyncWrapper(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const result = await auditService.getLogFiles(page, limit);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getLogFile = async (req: Request, res: Response, next: (error?: any) => void) => {
    try {
      const { file } = req.params;
      const result = await auditService.getLogFile(file);

      if (!result.success || !result.data) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({ error: "Log file not found" });
      }

      const { path: logPath, isGzipped } = result.data;

      res.setHeader("Content-Type", "text/plain");

      if (isGzipped) {
        const stream = fs.createReadStream(logPath).pipe(zlib.createGunzip());
        stream.pipe(res);
      }
      else {
        fs.createReadStream(logPath).pipe(res);
      }
    }
    catch (error) {
      next(error);
    }
  };

  getBackupFiles = asyncWrapper(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const result = await backupService.getBackupFiles(page, limit);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getBackupFile = async (req: Request, res: Response, next: (error?: any) => void) => {
    try {
      const { file } = req.params;
      const result = await backupService.getBackupFile(file);

      if (!result.success || !result.data) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({ error: "Backup file not found" });
      }

      const { path: backupPath, isGzipped } = result.data;

      res.setHeader("Content-Type", "application/sql");
      res.setHeader("Content-Disposition", `attachment; filename="${file}"`);

      if (isGzipped) {
        const stream = fs.createReadStream(backupPath).pipe(zlib.createGunzip());
        stream.pipe(res);
      }
      else {
        fs.createReadStream(backupPath).pipe(res);
      }
    }
    catch (error) {
      next(error);
    }
  };
}
