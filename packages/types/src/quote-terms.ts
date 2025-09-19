// Auto-generated from Prisma schema
export interface QuoteTerms {
  id?: string;
  quoteDetailsId: string;
  percentage?: number;
  netDays?: number;
  amount?: number;
  verbiage?: string;
  dueOrder?: number;
  customTerms?: string;
  notToExceed?: number;
  createdAt?: Date | string;
  updatedAt: Date | string;
}

export type CreateQuoteTermsInput = Omit<QuoteTerms, "id" | "createdAt" | "updatedAt">;
export type UpdateQuoteTermsInput = Partial<CreateQuoteTermsInput>;
