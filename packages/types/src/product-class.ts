// Auto-generated from Prisma schema
export interface ProductClass {
  id?: string;
  code: string;
  name: string;
  description?: string;
  parentId?: string;
  depth?: number;
  isActive?: boolean;
}

export type CreateProductClassInput = Omit<ProductClass, "id" | "createdAt" | "updatedAt">;
export type UpdateProductClassInput = Partial<CreateProductClassInput>;
