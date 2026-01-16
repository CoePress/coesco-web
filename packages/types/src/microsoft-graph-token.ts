// Auto-generated from Prisma schema
export interface MicrosoftGraphToken {
  id?: string;
  employeeId: string;
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  scope: string;
  expiresAt: Date | string;
  lastRefreshedAt?: Date | string;
  createdAt?: Date | string;
  updatedAt: Date | string;
}

export type CreateMicrosoftGraphTokenInput = Omit<MicrosoftGraphToken, "id" | "createdAt" | "updatedAt">;
export type UpdateMicrosoftGraphTokenInput = Partial<CreateMicrosoftGraphTokenInput>;
