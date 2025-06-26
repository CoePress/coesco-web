import { configBuilderService } from "@/services";
import { NextFunction, Request, Response } from "express";

export class ConfigBuilderController {
  public async getProductClasses(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await configBuilderService.getProductClasses();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
