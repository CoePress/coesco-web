// Auto-generated from Prisma schema
import { LoginMethod } from './login-method';

export interface LoginHistory {
  id?: string;
  userId?: string;
  username?: string;
  loginMethod: LoginMethod;
  success: boolean;
  failureReason?: string;
  ipAddress?: string;
  userAgent?: string;
  location?: any;
  timestamp?: Date | string;
}

export type CreateLoginHistoryInput = Omit<LoginHistory, "id" | "createdAt" | "updatedAt">;
export type UpdateLoginHistoryInput = Partial<CreateLoginHistoryInput>;
