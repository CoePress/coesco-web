// Auto-generated from Prisma schema
export interface JourneyContact {
  id?: string;
  journeyId: string;
  contactId: string;
  isPrimary?: boolean;
  createdAt?: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
  createdById: string;
  updatedById: string;
}

export type CreateJourneyContactInput = Omit<JourneyContact, "id" | "createdAt" | "updatedAt">;
export type UpdateJourneyContactInput = Partial<CreateJourneyContactInput>;
