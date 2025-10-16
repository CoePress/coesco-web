// Auto-generated from Prisma schema
import { LoginMethod } from './login-method';

export interface Session {
  id?: string;
  userId: string;
  token: string;
  refreshToken?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
  deviceName?: string;
  location?: any;
  loginMethod: LoginMethod;
  loginAt?: Date | string;
  lastActivityAt?: Date | string;
  expiresAt: Date | string;
  revokedAt?: Date | string;
  revokedReason?: string;
  logoutAt?: Date | string;
  isActive?: boolean;
  isSuspicious?: boolean;
  suspiciousReason?: string;
  metadata?: any;
  createdAt?: Date | string;
  updatedAt: Date | string;
}

export type CreateSessionInput = Omit<Session, "id" | "createdAt" | "updatedAt">;
export type UpdateSessionInput = Partial<CreateSessionInput>;
