import { buildQueryParams } from "@/utils";
import { Role, RoleAssignment, RolePermission } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

export class RoleController {
    // Roles
  async createRole(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await roleService.create(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buildQueryParams<Role>(req.query);
      const result = await roleService.getAll(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getRole(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await roleService.getById(req.params.roleId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await roleService.update(req.params.roleId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteRole(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await roleService.delete(req.params.roleId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  // Role Permissions
  async createRolePermission(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await rolePermissionService.create(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getRolePermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buildQueryParams<RolePermission>(req.query);
      const result = await rolePermissionService.getAll(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getRolePermission(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await rolePermissionService.getById(req.params.rolePermissionId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateRolePermission(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await rolePermissionService.update(req.params.rolePermissionId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteRolePermission(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await rolePermissionService.delete(req.params.rolePermissionId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  // Role Assignments
  async createRoleAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await roleAssignmentService.create(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getRoleAssignments(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buildQueryParams<RoleAssignment>(req.query);
      const result = await roleAssignmentService.getAll(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getRoleAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await roleAssignmentService.getById(req.params.roleAssignmentId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateRoleAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await roleAssignmentService.update(req.params.roleAssignmentId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteRoleAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await roleAssignmentService.delete(req.params.roleAssignmentId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }
}