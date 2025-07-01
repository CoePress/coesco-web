import { configBuilderService, quoteBuilderService } from "@/services";
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

  async getOptionRules(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await configBuilderService.getOptionRules();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getConfigurations(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await configBuilderService.getConfigurations();
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAvailableOptionsGroupedByCategory(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result =
        await configBuilderService.getAvailableOptionsGroupedByCategory(
          req.params.id
        );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async saveConfiguration(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await configBuilderService.saveConfiguration(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
