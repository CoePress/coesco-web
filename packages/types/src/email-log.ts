// Auto-generated from Prisma schema
import { EmailStatus } from './email-status';

export interface EmailLog {
  id?: string;
  to: string;
  subject: string;
  template?: string;
  status?: EmailStatus;
  sentAt?: Date | string;
  error?: string;
  createdAt?: Date | string;
  updatedAt: Date | string;
}

export type CreateEmailLogInput = Omit<EmailLog, "id" | "createdAt" | "updatedAt">;
export type UpdateEmailLogInput = Partial<CreateEmailLogInput>;
