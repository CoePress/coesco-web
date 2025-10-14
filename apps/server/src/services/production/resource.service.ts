import type { Machine } from "@prisma/client";
import type { IQueryParams } from "@/types";

import { machineRepository } from "@/repositories";

export class ResourceService {
  async createResource(data: any) {
    return machineRepository.create(data);
  }

  async updateResource(id: string, data: any) {
    return machineRepository.update(id, data);
  }

  async deleteResource(id: string) {
    return machineRepository.delete(id);
  }

  async getAllResources(params?: IQueryParams<Machine>) {
    return machineRepository.getAll(params);
  }

  async getResourceById(id: string) {
    return machineRepository.getById(id);
  }
}