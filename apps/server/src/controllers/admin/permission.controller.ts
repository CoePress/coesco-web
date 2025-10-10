import type { NextFunction, Request, Response } from "express";

export class PermissionController {
    async createPermission(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await permissionService.create(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buildQueryParams<Permission>(req.query);
      const result = await permissionService.getAll(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getPermission(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await permissionService.getById(req.params.permissionId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updatePermission(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await permissionService.update(req.params.permissionId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deletePermission(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await permissionService.delete(req.params.permissionId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }
}