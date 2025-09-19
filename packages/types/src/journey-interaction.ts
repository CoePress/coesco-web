// Auto-generated from Prisma schema
import { JourneyInteractionType } from './journey-interaction-type';

export interface JourneyInteraction {
  id?: string;
  journeyId: string;
  interactionType: JourneyInteractionType;
  createdAt?: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
  createdById: string;
  updatedById: string;
}

export type CreateJourneyInteractionInput = Omit<JourneyInteraction, "id" | "createdAt" | "updatedAt">;
export type UpdateJourneyInteractionInput = Partial<CreateJourneyInteractionInput>;
