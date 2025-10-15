import type { Configuration } from "@prisma/client";

import type { IQueryParams } from "@/types";

import { configurationRepository } from "@/repositories";

export class ConfigurationService {
  async createConfiguration(data: Partial<Configuration>) {
    return configurationRepository.create(data);
  }

  async updateConfiguration(id: string, data: Partial<Configuration>) {
    return configurationRepository.update(id, data);
  }

  async deleteConfiguration(id: string) {
    return configurationRepository.delete(id);
  }

  async getAllConfigurations(params?: IQueryParams<Configuration>) {
    return configurationRepository.getAll(params);
  }

  async getConfigurationById(id: string, params?: IQueryParams<Configuration>) {
    return configurationRepository.getById(id, params);
  }
}
