// Auto-generated from Prisma schema
export interface Draft {
  id?: string;
  entityType: string;
  entityId?: string;
  data: any;
  createdById: string;
  createdAt?: Date | string;
  updatedAt: Date | string;
}

export type CreateDraftInput = Omit<Draft, "id" | "createdAt" | "updatedAt">;
export type UpdateDraftInput = Partial<CreateDraftInput>;
