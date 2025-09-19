// Auto-generated from Prisma schema
export interface Configuration {
  id?: string;
  productClassId: string;
  name: string;
  description?: string;
  isTemplate: boolean;
  isActive: boolean;
  createdAt?: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
  createdById: string;
  updatedById: string;
}

export type CreateConfigurationInput = Omit<Configuration, "id" | "createdAt" | "updatedAt">;
export type UpdateConfigurationInput = Partial<CreateConfigurationInput>;
