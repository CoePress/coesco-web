// Auto-generated from Prisma schema
import { InvitationType } from './invitation-type';

export interface Invitation {
  id?: string;
  token: string;
  type: InvitationType;
  createdAt?: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
  createdById: string;
  updatedById: string;
}

export type CreateInvitationInput = Omit<Invitation, "id" | "createdAt" | "updatedAt">;
export type UpdateInvitationInput = Partial<CreateInvitationInput>;
