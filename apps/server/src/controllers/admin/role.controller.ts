import type { Request, Response } from "express";
import { Role, RoleAssignment, RolePermission } from "@prisma/client";
import { z } from "zod";

import { roleService, rolePermissionService, roleAssignmentService } from "@/services";
import { asyncWrapper, buildQueryParams } from "@/utils";
import { HTTP_STATUS } from "@/utils/constants";

const CreateRoleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  isSystem: z.boolean(),
  legacy: z.record(z.any()).optional(),
});

const UpdateRoleSchema = CreateRoleSchema.partial();

const CreateRolePermissionSchema = z.object({
  roleId: z.string().uuid("Invalid role ID"),
  permissionId: z.string().uuid("Invalid permission ID"),
});

const UpdateRolePermissionSchema = CreateRolePermissionSchema.partial();

const CreateRoleAssignmentSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  roleId: z.string().uuid("Invalid role ID"),
  scope: z.string().min(1, "Scope is required"),
  scopeKey: z.string().min(1, "Scope key is required"),
});

const UpdateRoleAssignmentSchema = CreateRoleAssignmentSchema.partial();

export class RoleController {
  // Roles
  createRole = asyncWrapper(async (req: Request, res: Response) => {
    const validData = CreateRoleSchema.parse(req.body);
    const result = await roleService.create(validData);
    res.status(HTTP_STATUS.CREATED).json(result);
  });

  getRoles = asyncWrapper(async (req: Request, res: Response) => {
    const params = buildQueryParams<Role>(req.query);
    const result = await roleService.getAll(params);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getRole = asyncWrapper(async (req: Request, res: Response) => {
    const result = await roleService.getById(req.params.roleId);
    res.status(HTTP_STATUS.OK).json(result);
  });

  updateRole = asyncWrapper(async (req: Request, res: Response) => {
    const validData = UpdateRoleSchema.parse(req.body);
    const result = await roleService.update(req.params.roleId, validData);
    res.status(HTTP_STATUS.OK).json(result);
  });

  deleteRole = asyncWrapper(async (req: Request, res: Response) => {
    await roleService.delete(req.params.roleId);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  });

  // Role Permissions
  createRolePermission = asyncWrapper(async (req: Request, res: Response) => {
    const validData = CreateRolePermissionSchema.parse(req.body);
    const result = await rolePermissionService.create(validData);
    res.status(HTTP_STATUS.CREATED).json(result);
  });

  getRolePermissions = asyncWrapper(async (req: Request, res: Response) => {
    const params = buildQueryParams<RolePermission>(req.query);
    const result = await rolePermissionService.getAll(params);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getRolePermission = asyncWrapper(async (req: Request, res: Response) => {
    const result = await rolePermissionService.getById(req.params.rolePermissionId);
    res.status(HTTP_STATUS.OK).json(result);
  });

  updateRolePermission = asyncWrapper(async (req: Request, res: Response) => {
    const validData = UpdateRolePermissionSchema.parse(req.body);
    const result = await rolePermissionService.update(req.params.rolePermissionId, validData);
    res.status(HTTP_STATUS.OK).json(result);
  });

  deleteRolePermission = asyncWrapper(async (req: Request, res: Response) => {
    await rolePermissionService.delete(req.params.rolePermissionId);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  });

  // Role Assignments
  createRoleAssignment = asyncWrapper(async (req: Request, res: Response) => {
    const validData = CreateRoleAssignmentSchema.parse(req.body);
    const result = await roleAssignmentService.create(validData);
    res.status(HTTP_STATUS.CREATED).json(result);
  });

  getRoleAssignments = asyncWrapper(async (req: Request, res: Response) => {
    const params = buildQueryParams<RoleAssignment>(req.query);
    const result = await roleAssignmentService.getAll(params);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getRoleAssignment = asyncWrapper(async (req: Request, res: Response) => {
    const result = await roleAssignmentService.getById(req.params.roleAssignmentId);
    res.status(HTTP_STATUS.OK).json(result);
  });

  updateRoleAssignment = asyncWrapper(async (req: Request, res: Response) => {
    const validData = UpdateRoleAssignmentSchema.parse(req.body);
    const result = await roleAssignmentService.update(req.params.roleAssignmentId, validData);
    res.status(HTTP_STATUS.OK).json(result);
  });

  deleteRoleAssignment = asyncWrapper(async (req: Request, res: Response) => {
    await roleAssignmentService.delete(req.params.roleAssignmentId);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  });
}