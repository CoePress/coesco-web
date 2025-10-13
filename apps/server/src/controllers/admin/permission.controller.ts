import { permissionService } from "@/services";
import { buildQueryParams } from "@/utils";
import { Permission } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

export class PermissionController {
    async createPermission(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await permissionService.createPermission(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buildQueryParams<Permission>(req.query);
      const result = await permissionService.getAllPermissions(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getPermission(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await permissionService.getPermissionById(req.params.permissionId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updatePermission(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await permissionService.updatePermission(req.params.permissionId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deletePermission(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await permissionService.deletePermission(req.params.permissionId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }
}