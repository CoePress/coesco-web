// Auto-generated from Prisma schema
export interface OptionDetails {
  id?: string;
  optionHeaderId: string;
  productClassId?: string;
  itemId?: string;
  price: number;
  isActive?: boolean;
  createdAt?: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
  createdById: string;
  updatedById: string;
}

export type CreateOptionDetailsInput = Omit<OptionDetails, "id" | "createdAt" | "updatedAt">;
export type UpdateOptionDetailsInput = Partial<CreateOptionDetailsInput>;
