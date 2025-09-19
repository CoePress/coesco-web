// Auto-generated from Prisma schema
import { UserRole } from './user-role';

export interface User {
  id?: string;
  username: string;
  password?: string;
  microsoftId?: string;
  role?: UserRole;
  isActive?: boolean;
  lastLogin?: Date | string;
  createdAt?: Date | string;
  updatedAt: Date | string;
}

export type CreateUserInput = Omit<User, "id" | "createdAt" | "updatedAt">;
export type UpdateUserInput = Partial<CreateUserInput>;
