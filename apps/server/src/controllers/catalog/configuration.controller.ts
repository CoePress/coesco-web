import { configurationService } from "@/services";
import { buildQueryParams } from "@/utils";
import { Configuration } from "@azure/msal-node";
import type { NextFunction, Request, Response } from "express";

export class ConfigurationController {
    async createConfiguration(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await configurationService.createConfiguration(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getConfigurations(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buildQueryParams<Configuration>(req.query);
      const result = await configurationService.getAllConfigurations(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getConfiguration(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await configurationService.getConfigurationById(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateConfiguration(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await configurationService.updateConfiguration(req.params.companyId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteConfiguration(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await configurationService.deleteConfiguration(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }
}