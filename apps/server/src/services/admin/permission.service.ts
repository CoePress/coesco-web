import type { Permission } from "@prisma/client";

import type { IQueryParams } from "@/types";

import { permissionRepository } from "@/repositories";

export class PermissionService {
  async createPermission(data: Omit<Permission, "id" | "createdAt" | "updatedAt">) {
    return permissionRepository.create(data);
  }

  async updatePermission(id: string, data: Partial<Omit<Permission, "id" | "createdAt" | "updatedAt">>) {
    return permissionRepository.update(id, data);
  }

  async deletePermission(id: string) {
    return permissionRepository.delete(id);
  }

  async getAllPermissions(params?: IQueryParams<Permission>) {
    return permissionRepository.getAll(params);
  }

  async getPermissionById(id: string, params?: IQueryParams<Permission>) {
    return permissionRepository.getById(id, params);
  }
}