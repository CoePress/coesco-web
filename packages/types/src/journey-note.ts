// Auto-generated from Prisma schema
export interface JourneyNote {
  id?: string;
  journeyId: string;
  type?: string;
  body: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
}

export type CreateJourneyNoteInput = Omit<JourneyNote, "id" | "createdAt" | "updatedAt">;
export type UpdateJourneyNoteInput = Partial<CreateJourneyNoteInput>;
