// Auto-generated from Prisma schema
export interface QuoteItem {
  id?: string;
  quoteRevisionId: string;
  configurationId?: string;
  itemId?: string;
  model?: string;
  name?: string;
  description?: string;
  quantity?: number;
  unitPrice: number;
  lineNumber: number;
  isCustom?: boolean;
  createdAt?: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
  createdById: string;
  updatedById: string;
}

export type CreateQuoteItemInput = Omit<QuoteItem, "id" | "createdAt" | "updatedAt">;
export type UpdateQuoteItemInput = Partial<CreateQuoteItemInput>;
