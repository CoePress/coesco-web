import type { Request, Response } from "express";
import type { AuditLog, EmailLog } from "@prisma/client";

import { auditService } from "@/services";
import { asyncWrapper, buildQueryParams } from "@/utils";
import { HTTP_STATUS } from "@/utils/constants";

import fs from "node:fs";
import zlib from "node:zlib";

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

  getLogFiles = asyncWrapper(async (req: Request, res: Response) => {
    const result = await auditService.getLogFiles();
    res.status(HTTP_STATUS.OK).json(result);
  });

  getLogFile = asyncWrapper(async (req: Request, res: Response) => {
    const { file } = req.params;
    const result = await auditService.getLogFile(file);

    if (!result.success || !result.data) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: "Log file not found" });
    }

    const { path: logPath, isGzipped } = result.data;

    res.setHeader("Content-Type", "text/plain");

    if (isGzipped) {
      const stream = fs.createReadStream(logPath).pipe(zlib.createGunzip());
      return stream.pipe(res);
    }
    else {
      return fs.createReadStream(logPath).pipe(res);
    }
  });
}