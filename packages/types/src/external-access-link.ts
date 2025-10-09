// Auto-generated from Prisma schema
import { AccessPurpose } from './access-purpose';

export interface ExternalAccessLink {
  id?: string;
  token: string;
  purpose: AccessPurpose;
  resourceId?: string;
  resourceType?: string;
  expiresAt?: Date | string;
  usedAt?: Date | string;
  revokedAt?: Date | string;
  maxUses?: number;
  useCount?: number;
  metadata?: any;
  createdAt?: Date | string;
  updatedAt: Date | string;
  createdById?: string;
  updatedById?: string;
}

export type CreateExternalAccessLinkInput = Omit<ExternalAccessLink, "id" | "createdAt" | "updatedAt">;
export type UpdateExternalAccessLinkInput = Partial<CreateExternalAccessLinkInput>;
