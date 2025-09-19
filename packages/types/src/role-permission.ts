// Auto-generated from Prisma schema
export interface RolePermission {
  id?: string;
  roleId: string;
  permissionId: string;
  condition?: any;
  createdAt?: Date | string;
}

export type CreateRolePermissionInput = Omit<RolePermission, "id" | "createdAt" | "updatedAt">;
export type UpdateRolePermissionInput = Partial<CreateRolePermissionInput>;
