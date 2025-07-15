import { systemService } from "@/services";
import { NextFunction, Request, Response } from "express";

export class SystemController {
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
}
