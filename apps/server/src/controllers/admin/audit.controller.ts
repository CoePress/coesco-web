import { env } from "@/config/env";
import { auditService } from "@/services";
import { buildQueryParams } from "@/utils";
import { HTTP_STATUS } from "@/utils/constants";
import { AuditLog } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

export class AuditController {
    async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buildQueryParams<AuditLog>(req.query);
      const result = await auditService.getAuditLogs(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

    async getLogFiles(req: Request, res: Response, next: NextFunction) {
      try {
        const files = fs.readdirSync(env.LOGS_DIR).filter(f => f.endsWith(".log") || f.endsWith(".gz"));
        const result = files.sort().reverse();
        res.status(200).json(result);
      }
      catch (error) {
        next(error);
      }
    }
  
    async getLogFile(req: Request, res: Response, next: NextFunction) {
      try {
        const { file } = req.params;
        const logPath = path.join(env.LOGS_DIR, file);
  
        if (!fs.existsSync(logPath)) {
          return res.status(HTTP_STATUS.NOT_FOUND).json({ error: "Log not found" });
        }
  
        const isGzipped = logPath.endsWith(".gz");
  
        if (isGzipped) {
          const stream = fs.createReadStream(logPath).pipe(zlib.createGunzip());
          res.setHeader("Content-Type", "text/plain");
          return stream.pipe(res);
        }
        else {
          return fs.createReadStream(logPath).pipe(res);
        }
      }
      catch (error) {
        next(error);
      }
    }
}