// Auto-generated from Prisma schema
export interface Note {
  id?: string;
  entityId: string;
  entityType: string;
  type?: string;
  body: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
}

export type CreateNoteInput = Omit<Note, "id" | "createdAt" | "updatedAt">;
export type UpdateNoteInput = Partial<CreateNoteInput>;
