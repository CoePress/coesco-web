// Auto-generated from Prisma schema
export interface Chat {
  id?: string;
  employeeId: string;
  name?: string;
  createdAt?: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
  createdById: string;
  updatedById: string;
}

export type CreateChatInput = Omit<Chat, "id" | "createdAt" | "updatedAt">;
export type UpdateChatInput = Partial<CreateChatInput>;
