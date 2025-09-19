// Auto-generated from Prisma schema
export interface PerformanceSheetLink {
  id?: string;
  performanceSheetId: string;
  entityType: string;
  entityId: string;
  createdAt?: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
  createdById: string;
  updatedById: string;
}

export type CreatePerformanceSheetLinkInput = Omit<PerformanceSheetLink, "id" | "createdAt" | "updatedAt">;
export type UpdatePerformanceSheetLinkInput = Partial<CreatePerformanceSheetLinkInput>;
