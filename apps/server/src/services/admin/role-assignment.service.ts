import type { RoleAssignment } from "@prisma/client";

import type { IQueryParams } from "@/types";

import { roleAssignmentRepository } from "@/repositories";

export class RoleAssignmentService {
  async create(data: Partial<RoleAssignment>) {
    return roleAssignmentRepository.create(data);
  }

  async update(id: string, data: Partial<RoleAssignment>) {
    return roleAssignmentRepository.update(id, data);
  }

  async delete(id: string) {
    return roleAssignmentRepository.delete(id);
  }

  async getAll(params?: IQueryParams<RoleAssignment>) {
    return roleAssignmentRepository.getAll(params);
  }

  async getById(id: string, params?: IQueryParams<RoleAssignment>) {
    return roleAssignmentRepository.getById(id, params);
  }
}
