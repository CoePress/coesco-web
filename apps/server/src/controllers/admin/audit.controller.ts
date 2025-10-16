import type { AuditLog, BugReport, EmailLog, LoginHistory } from "@prisma/client";
import type { Request, Response } from "express";

import fs from "node:fs";
import zlib from "node:zlib";

import { auditService, loginHistoryService } from "@/services";
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
    const result = await auditService.getLogFiles();
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
}
