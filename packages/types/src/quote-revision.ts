// Auto-generated from Prisma schema
import { QuoteRevisionStatus } from './quote-revision-status';

export interface QuoteRevision {
  id?: string;
  quoteHeaderId: string;
  revision?: string;
  quoteDate?: Date | string;
  status?: QuoteRevisionStatus;
  approvedById?: string;
  sentById?: string;
  createdAt?: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
  createdById: string;
  updatedById: string;
}

export type CreateQuoteRevisionInput = Omit<QuoteRevision, "id" | "createdAt" | "updatedAt">;
export type UpdateQuoteRevisionInput = Partial<CreateQuoteRevisionInput>;
