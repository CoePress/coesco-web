// Auto-generated from Prisma schema
export interface CoilType {
  id?: string;
  description?: string;
  multiplier?: number;
  sortOrder?: number;
  isArchived?: boolean;
  legacyId?: string;
}

export type CreateCoilTypeInput = Omit<CoilType, "id" | "createdAt" | "updatedAt">;
export type UpdateCoilTypeInput = Partial<CreateCoilTypeInput>;
