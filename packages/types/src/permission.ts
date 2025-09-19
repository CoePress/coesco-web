// Auto-generated from Prisma schema
export interface Permission {
  id?: string;
  resource: string;
  action: string;
  description?: string;
  condition?: any;
  createdAt?: Date | string;
  updatedAt: Date | string;
}

export type CreatePermissionInput = Omit<Permission, "id" | "createdAt" | "updatedAt">;
export type UpdatePermissionInput = Partial<CreatePermissionInput>;
