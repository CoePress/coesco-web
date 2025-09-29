// Auto-generated from Prisma schema
export interface Tag {
  id?: string;
  description: string;
  parentTable: string;
  parentId: string;
  createdBy: string;
  createdAt?: Date | string;
  updatedAt: Date | string;
}

export type CreateTagInput = Omit<Tag, "id" | "createdAt" | "updatedAt">;
export type UpdateTagInput = Partial<CreateTagInput>;
