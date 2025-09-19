// Auto-generated from Prisma schema
export interface OptionHeader {
  id?: string;
  optionCategoryId: string;
  name: string;
  description?: string;
  legacyId?: string;
  displayOrder?: number;
  isActive?: boolean;
  createdAt?: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
  createdById: string;
  updatedById: string;
}

export type CreateOptionHeaderInput = Omit<OptionHeader, "id" | "createdAt" | "updatedAt">;
export type UpdateOptionHeaderInput = Partial<CreateOptionHeaderInput>;
