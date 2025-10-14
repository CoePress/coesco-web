import type { UserSettings } from "@prisma/client";

import type { IQueryParams } from "@/types";

import { userSettingsRepository } from "@/repositories";

export class UserSettingsService {
  async createUserSettings(data: Partial<UserSettings>) {
    return userSettingsRepository.create(data);
  }

  async updateUserSettings(id: string, data: Partial<UserSettings>) {
    return userSettingsRepository.update(id, data);
  }

  async deleteUserSettings(id: string) {
    return userSettingsRepository.delete(id);
  }

  async getAllUserSettings(params?: IQueryParams<UserSettings>) {
    return userSettingsRepository.getAll(params);
  }

  async getUserSettingsById(id: string, params?: IQueryParams<UserSettings>) {
    return userSettingsRepository.getById(id, params);
  }
}
