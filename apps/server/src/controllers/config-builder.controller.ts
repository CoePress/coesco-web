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

  async getOptionCategoriesByProductClass(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result =
        await configBuilderService.getOptionCategoriesByProductClass(
          req.params.id
        );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getOptionsByOptionCategory(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await configBuilderService.getOptionsByOptionCategory(
        req.params.categoryId
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getOptionsByProductClass(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await configBuilderService.getOptionsByProductClass(
        req.params.id
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
