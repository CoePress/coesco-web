// Auto-generated from Prisma schema
export interface QuoteNote {
  id?: string;
  quoteRevisionId: string;
  body: string;
  createdAt?: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
  createdById: string;
  updatedById: string;
}

export type CreateQuoteNoteInput = Omit<QuoteNote, "id" | "createdAt" | "updatedAt">;
export type UpdateQuoteNoteInput = Partial<CreateQuoteNoteInput>;
