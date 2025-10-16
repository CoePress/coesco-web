import type { Role } from "@prisma/client";

import type { IQueryParams } from "@/types";

import { roleRepository } from "@/repositories";

export class RoleService {
  async create(data: Partial<Role>) {
    return roleRepository.create(data);
  }

  async update(id: string, data: Partial<Role>) {
    return roleRepository.update(id, data);
  }

  async delete(id: string) {
    return roleRepository.delete(id);
  }

  async getAll(params?: IQueryParams<Role>) {
    return roleRepository.getAll(params);
  }

  async getById(id: string, params?: IQueryParams<Role>) {
    return roleRepository.getById(id, params);
  }
}
