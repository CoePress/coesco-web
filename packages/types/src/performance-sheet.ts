// Auto-generated from Prisma schema
export interface PerformanceSheet {
  id?: string;
  versionId: string;
  name?: string;
  data?: any;
  createdAt?: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
  createdById: string;
  updatedById: string;
}

export type CreatePerformanceSheetInput = Omit<PerformanceSheet, "id" | "createdAt" | "updatedAt">;
export type UpdatePerformanceSheetInput = Partial<CreatePerformanceSheetInput>;
