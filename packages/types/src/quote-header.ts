// Auto-generated from Prisma schema
import { QuoteHeaderStatus } from './quote-header-status';

export interface QuoteHeader {
  id?: string;
  journeyId?: string;
  year: string;
  number: string;
  rsmId?: string;
  customerId?: string;
  customerContactId?: string;
  customerAddressId?: string;
  dealerId?: string;
  dealerContactId?: string;
  dealerAddressId?: string;
  priority?: string;
  confidence?: number;
  status?: QuoteHeaderStatus;
  createdAt?: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
  createdById: string;
  updatedById: string;
  legacy?: any;
}

export type CreateQuoteHeaderInput = Omit<QuoteHeader, "id" | "createdAt" | "updatedAt">;
export type UpdateQuoteHeaderInput = Partial<CreateQuoteHeaderInput>;
