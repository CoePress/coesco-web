// Auto-generated from Prisma schema
export interface TeamsChatCache {
  id?: string;
  employeeId: string;
  recipientUserId: string;
  chatId: string;
  createdAt?: Date | string;
  lastUsedAt?: Date | string;
}

export type CreateTeamsChatCacheInput = Omit<TeamsChatCache, "id" | "createdAt" | "updatedAt">;
export type UpdateTeamsChatCacheInput = Partial<CreateTeamsChatCacheInput>;
