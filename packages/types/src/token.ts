// Auto-generated from Prisma schema
import { TokenType } from './token-type';

export interface Token {
  id?: string;
  userId: string;
  type: TokenType;
  token: string;
  expiresAt: Date | string;
  used?: boolean;
  createdAt?: Date | string;
  updatedAt: Date | string;
}

export type CreateTokenInput = Omit<Token, "id" | "createdAt" | "updatedAt">;
export type UpdateTokenInput = Partial<CreateTokenInput>;
