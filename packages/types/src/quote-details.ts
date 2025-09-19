// Auto-generated from Prisma schema
import { QuoteStatus } from './quote-status';

export interface QuoteDetails {
  id?: string;
  quoteHeaderId: string;
  revision?: string;
  quoteDate?: Date | string;
  status?: QuoteStatus;
  approvedById?: string;
  sentById?: string;
  createdAt?: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
  createdById: string;
  updatedById: string;
}

export type CreateQuoteDetailsInput = Omit<QuoteDetails, "id" | "createdAt" | "updatedAt">;
export type UpdateQuoteDetailsInput = Partial<CreateQuoteDetailsInput>;
