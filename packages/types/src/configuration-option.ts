// Auto-generated from Prisma schema
export interface ConfigurationOption {
  configurationId: string;
  optionId: string;
  createdAt?: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
  createdById: string;
  updatedById: string;
}

export type CreateConfigurationOptionInput = Omit<ConfigurationOption, "id" | "createdAt" | "updatedAt">;
export type UpdateConfigurationOptionInput = Partial<CreateConfigurationOptionInput>;
