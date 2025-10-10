import type { NextFunction, Request, Response } from "express";

export class ConfigurationController {
    async createConfiguration(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await configurationService.create(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getConfigurations(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buildQueryParams<Configuration>(req.query);
      const result = await configurationService.getAll(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getConfiguration(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await configurationService.getById(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateConfiguration(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await configurationService.update(req.params.companyId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteConfiguration(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await configurationService.delete(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }
}