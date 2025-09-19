// Auto-generated from Prisma schema
import { JourneyStatus } from './journey-status';
import { JourneyType } from './journey-type';
import { JourneySource } from './journey-source';
import { JourneyPriority } from './journey-priority';

export interface Journey {
  id?: string;
  name?: string;
  rsmId?: string;
  customerId?: string;
  customerAddressId?: string;
  customerContactId?: string;
  dealerId?: string;
  dealerAddressId?: string;
  dealerContactId?: string;
  startDate?: Date | string;
  status?: JourneyStatus;
  type?: JourneyType;
  source?: JourneySource;
  priority?: JourneyPriority;
  confidence?: number;
  notes?: string;
  createdAt?: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
  createdById: string;
  updatedById: string;
}

export type CreateJourneyInput = Omit<Journey, "id" | "createdAt" | "updatedAt">;
export type UpdateJourneyInput = Partial<CreateJourneyInput>;
