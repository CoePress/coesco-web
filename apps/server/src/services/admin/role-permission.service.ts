import type { RolePermission } from "@prisma/client";

import type { IQueryParams } from "@/types";

import { rolePermissionRepository } from "@/repositories";

export class RolePermissionService {
  async create(data: Partial<RolePermission>) {
    return rolePermissionRepository.create(data);
  }

  async update(id: string, data: Partial<RolePermission>) {
    return rolePermissionRepository.update(id, data);
  }

  async delete(id: string) {
    return rolePermissionRepository.delete(id);
  }

  async getAll(params?: IQueryParams<RolePermission>) {
    return rolePermissionRepository.getAll(params);
  }

  async getById(id: string, params?: IQueryParams<RolePermission>) {
    return rolePermissionRepository.getById(id, params);
  }
}
