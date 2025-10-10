import type { Configuration } from "@prisma/client";

import { configurationRepository } from "@/repositories";

export class ConfigurationService {
  async createConfiguration(data: Omit<Configuration, "id" | "createdAt" | "updatedAt">) {
    return configurationRepository.create(data);
  }

  async updateConfiguration(id: string, data: Partial<Omit<Configuration, "id" | "createdAt" | "updatedAt">>) {
    return configurationRepository.update(id, data);
  }

  async deleteConfiguration(id: string) {
    return configurationRepository.delete(id);
  }

  async getAllConfigurations() {
    return configurationRepository.getAll();
  }

  async getConfigurationById(id: string) {
    return configurationRepository.getById(id);
  }
}