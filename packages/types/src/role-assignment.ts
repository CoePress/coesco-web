// Auto-generated from Prisma schema
export interface RoleAssignment {
  id?: string;
  userId: string;
  roleId: string;
  scope: any;
  scopeKey: string;
  expiresAt?: Date | string;
  createdById?: string;
  createdAt?: Date | string;
  updatedAt: Date | string;
}

export type CreateRoleAssignmentInput = Omit<RoleAssignment, "id" | "createdAt" | "updatedAt">;
export type UpdateRoleAssignmentInput = Partial<CreateRoleAssignmentInput>;
