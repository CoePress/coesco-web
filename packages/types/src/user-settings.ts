// Auto-generated from Prisma schema
export interface UserSettings {
  id?: string;
  userId: string;
  settings?: any;
  createdAt?: Date | string;
  updatedAt: Date | string;
}

export type CreateUserSettingsInput = Omit<UserSettings, "id" | "createdAt" | "updatedAt">;
export type UpdateUserSettingsInput = Partial<CreateUserSettingsInput>;
