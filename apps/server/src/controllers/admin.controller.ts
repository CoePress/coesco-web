import type { Employee, NtfyDevice, Permission, PermissionException, Role, RoleAssignment, RolePermission } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

import { deviceService, microsoftService } from "@/services";
import { employeeService, ntfyDeviceService, permissionExceptionService, permissionService, roleAssignmentService, rolePermissionService, roleService } from "@/services/repository";
import { buildQueryParams } from "@/utils";

export class AdminController {
  // Employees
  async createEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await employeeService.create(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getEmployees(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buildQueryParams<Employee>(req.query);
      const result = await employeeService.getAll(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await employeeService.getById(req.params.deviceId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await employeeService.update(req.params.deviceId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await employeeService.delete(req.params.deviceId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async syncEmployees(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await microsoftService.sync();
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  // Permissions
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
      const result = await permissionService.getById(req.params.deviceId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updatePermission(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await permissionService.update(req.params.deviceId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deletePermission(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await permissionService.delete(req.params.deviceId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

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
      const result = await roleService.getById(req.params.deviceId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await roleService.update(req.params.deviceId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteRole(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await roleService.delete(req.params.deviceId);
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
      const result = await rolePermissionService.getById(req.params.deviceId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateRolePermission(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await rolePermissionService.update(req.params.deviceId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteRolePermission(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await rolePermissionService.delete(req.params.deviceId);
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
      const result = await roleAssignmentService.getById(req.params.deviceId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateRoleAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await roleAssignmentService.update(req.params.deviceId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteRoleAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await roleAssignmentService.delete(req.params.deviceId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  // Permission Exceptions
  async createPermissionException(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await permissionExceptionService.create(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getPermissionExceptions(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buildQueryParams<PermissionException>(req.query);
      const result = await permissionExceptionService.getAll(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getPermissionException(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await permissionExceptionService.getById(req.params.deviceId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updatePermissionException(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await permissionExceptionService.update(req.params.deviceId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deletePermissionException(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await permissionExceptionService.delete(req.params.deviceId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  // Devices
  async createDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ntfyDeviceService.create(req.body);
      await deviceService.reload();
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getDevices(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buildQueryParams<NtfyDevice>(req.query);
      const result = await ntfyDeviceService.getAll(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ntfyDeviceService.getById(req.params.deviceId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ntfyDeviceService.update(req.params.deviceId, req.body);
      await deviceService.reload();
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ntfyDeviceService.delete(req.params.deviceId);
      await deviceService.reload();
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }
}
