// Auto-generated from Prisma schema
export interface Role {
  id?: string;
  name: string;
  description?: string;
  isSystem?: boolean;
  createdAt?: Date | string;
  updatedAt: Date | string;
}

export type CreateRoleInput = Omit<Role, "id" | "createdAt" | "updatedAt">;
export type UpdateRoleInput = Partial<CreateRoleInput>;
