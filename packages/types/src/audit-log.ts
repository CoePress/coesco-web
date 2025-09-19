// Auto-generated from Prisma schema
import { AuditAction } from './audit-action';

export interface AuditLog {
  id?: string;
  action: AuditAction;
  model: string;
  recordId: string;
  changedBy: string;
  diff: any;
  createdAt?: Date | string;
}

export type CreateAuditLogInput = Omit<AuditLog, "id" | "createdAt" | "updatedAt">;
export type UpdateAuditLogInput = Partial<CreateAuditLogInput>;
