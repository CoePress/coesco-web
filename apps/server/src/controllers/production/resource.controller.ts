import { resourceService } from "@/services";
import { buildQueryParams } from "@/utils";
import { Machine } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

export class ResourceController {
  async createResource(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await resourceService.createResource(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getAllResources(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buildQueryParams<Machine>(req.query);
      const result = await resourceService.getAllResources(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getResourceById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await resourceService.getResourceById(req.params.resourceId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateResource(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await resourceService.updateResource(req.params.resourceId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteResource(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await resourceService.deleteResource(req.params.resourceId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }
}