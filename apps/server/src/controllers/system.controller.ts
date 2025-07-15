import { systemService } from "@/services";
import { NextFunction, Request, Response } from "express";

export class SystemController {
  async health(req: Request, res: Response, next: NextFunction) {
    try {
      return res
        .status(200)
        .json({ status: "ok", timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async getEntityTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await systemService.getEntityTypes();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getEntityFields(req: Request, res: Response, next: NextFunction) {
    try {
      const { entityType } = req.params;
      const result = await systemService.getEntityFields(entityType);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async notFound(req: Request, res: Response, next: NextFunction) {
    try {
      return res.status(404).json({ error: "Route not found" });
    } catch (error) {
      next(error);
    }
  }
}
