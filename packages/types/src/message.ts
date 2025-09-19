// Auto-generated from Prisma schema
export interface Message {
  id?: string;
  chatId: string;
  role: string;
  content: string;
  createdAt?: Date | string;
  updatedAt: Date | string;
  fileUrl?: string;
}

export type CreateMessageInput = Omit<Message, "id" | "createdAt" | "updatedAt">;
export type UpdateMessageInput = Partial<CreateMessageInput>;
