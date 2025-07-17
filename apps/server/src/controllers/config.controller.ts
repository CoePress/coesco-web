import { configService } from "@/services";
import { NextFunction, Request, Response } from "express";

export class ConfigController {
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

  // Configurations
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

  async getConfiguration(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await configService.getConfiguration(req.params.id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async createConfiguration(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await configService.createConfiguration(req.body);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateConfiguration(req: Request, res: Response, next: NextFunction) {}

  async deleteConfiguration(req: Request, res: Response, next: NextFunction) {}

  // Product Classes
  async getProductClasses(req: Request, res: Response, next: NextFunction) {
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

  async getProductClass(req: Request, res: Response, next: NextFunction) {}

  async getProductClassOptions(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await configService.getProductClassOptions(req.params.id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async createProductClass(req: Request, res: Response, next: NextFunction) {}

  async updateProductClass(req: Request, res: Response, next: NextFunction) {}

  async deleteProductClass(req: Request, res: Response, next: NextFunction) {}

  // Option Categories
  async getOptionCategories(req: Request, res: Response, next: NextFunction) {}

  async getOptionCategory(req: Request, res: Response, next: NextFunction) {}

  async createOptionCategory(req: Request, res: Response, next: NextFunction) {}

  async updateOptionCategory(req: Request, res: Response, next: NextFunction) {}

  async deleteOptionCategory(req: Request, res: Response, next: NextFunction) {}

  // Options
  async getOptions(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await configService.getOptions();
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOption(req: Request, res: Response, next: NextFunction) {}

  async createOption(req: Request, res: Response, next: NextFunction) {}

  async updateOption(req: Request, res: Response, next: NextFunction) {}

  async deleteOption(req: Request, res: Response, next: NextFunction) {}

  // Option Rules
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

  async getOptionRule(req: Request, res: Response, next: NextFunction) {}

  async createOptionRule(req: Request, res: Response, next: NextFunction) {}

  async updateOptionRule(req: Request, res: Response, next: NextFunction) {}

  async deleteOptionRule(req: Request, res: Response, next: NextFunction) {}
}
