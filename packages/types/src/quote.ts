// Auto-generated from Prisma schema
import { QuoteStatus } from './quote-status';

export interface Quote {
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
  status?: QuoteStatus;
  createdAt?: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
  createdById: string;
  updatedById: string;
  legacy?: any;
}

export type CreateQuoteInput = Omit<Quote, "id" | "createdAt" | "updatedAt">;
export type UpdateQuoteInput = Partial<CreateQuoteInput>;
