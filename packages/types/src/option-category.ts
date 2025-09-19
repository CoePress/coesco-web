// Auto-generated from Prisma schema
export interface OptionCategory {
  id?: string;
  name: string;
  description?: string;
  multiple?: boolean;
  mandatory?: boolean;
  standard?: boolean;
  displayOrder: number;
  legacyId?: string;
}

export type CreateOptionCategoryInput = Omit<OptionCategory, "id" | "createdAt" | "updatedAt">;
export type UpdateOptionCategoryInput = Partial<CreateOptionCategoryInput>;
