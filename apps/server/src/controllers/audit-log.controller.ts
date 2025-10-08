import type { AuditLog } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

import { auditLogBusinessService } from "@/services";
import { auditLogService } from "@/services/repository";
import { buildQueryParams } from "@/utils";

export class AuditLogController {
  async createAuditLog(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await auditLogService.create(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

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

  async getAuditLog(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await auditLogBusinessService.getAuditLog(req.params.auditLogId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateAuditLog(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await auditLogService.update(req.params.auditLogId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteAuditLog(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await auditLogService.delete(req.params.auditLogId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }
}
