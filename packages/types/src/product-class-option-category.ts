// Auto-generated from Prisma schema
export interface ProductClassOptionCategory {
  productClassId: string;
  optionCategoryId: string;
  displayOrder?: number;
  isRequired?: boolean;
  createdAt?: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
  createdById: string;
  updatedById: string;
}

export type CreateProductClassOptionCategoryInput = Omit<ProductClassOptionCategory, "id" | "createdAt" | "updatedAt">;
export type UpdateProductClassOptionCategoryInput = Partial<CreateProductClassOptionCategoryInput>;
