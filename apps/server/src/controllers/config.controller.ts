import { configService } from "@/services";
import { NextFunction, Request, Response } from "express";

export class ConfigController {
  public async getProductClasses(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await configService.getProductClasses();
      res.status(200).json({
        success: true,
        data: result,
      });
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
      const result = await configService.getOptionCategoriesByProductClass(
        req.params.id
      );
      res.status(200).json({
        success: true,
        data: result,
      });
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
      const result = await configService.getOptionsByOptionCategory(
        req.params.categoryId
      );
      res.status(200).json({
        success: true,
        data: result,
      });
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
      const result = await configService.getOptionsByProductClass(
        req.params.id
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOptionRules(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await configService.getOptionRules();
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getConfigurations(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await configService.getConfigurations();
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
      const result = await configService.getAvailableOptionsGroupedByCategory(
        req.params.id
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async saveConfiguration(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await configService.saveConfiguration(req.body);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
