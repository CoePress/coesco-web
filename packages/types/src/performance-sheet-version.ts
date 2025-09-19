// Auto-generated from Prisma schema
export interface PerformanceSheetVersion {
  id?: string;
  sections?: any;
  createdAt?: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
  createdById: string;
  updatedById: string;
}

export type CreatePerformanceSheetVersionInput = Omit<PerformanceSheetVersion, "id" | "createdAt" | "updatedAt">;
export type UpdatePerformanceSheetVersionInput = Partial<CreatePerformanceSheetVersionInput>;
