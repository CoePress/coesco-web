// Auto-generated from Prisma schema
export interface Department {
  id?: string;
  name: string;
  description?: string;
  code: string;
  createdAt?: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
  createdById: string;
  updatedById: string;
}

export type CreateDepartmentInput = Omit<Department, "id" | "createdAt" | "updatedAt">;
export type UpdateDepartmentInput = Partial<CreateDepartmentInput>;
