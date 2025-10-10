import { buildQueryParams } from "@/utils";
import { AuditLog } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

export class AuditController {
    async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buildQueryParams<AuditLog>(req.query);
      const result = await auditLogBusinessService.getAuditLogs(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }
}