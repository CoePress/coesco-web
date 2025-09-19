// Auto-generated from Prisma schema
export interface PermissionException {
  id?: string;
  userId: string;
  permissionId: string;
  scope: any;
  scopeKey: string;
  reason?: string;
  expiresAt?: Date | string;
  createdById?: string;
  createdAt?: Date | string;
}

export type CreatePermissionExceptionInput = Omit<PermissionException, "id" | "createdAt" | "updatedAt">;
export type UpdatePermissionExceptionInput = Partial<CreatePermissionExceptionInput>;
