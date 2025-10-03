// Auto-generated from Prisma schema
export interface Employee {
  id?: string;
  userId: string;
  number: string;
  firstName: string;
  lastName: string;
  initials: string;
  email?: string;
  phoneNumber?: string;
  title: string;
  hireDate?: Date | string;
  startDate?: Date | string;
  terminationDate?: Date | string;
  departmentId?: string;
  managerId?: string;
  isSalaried?: boolean;
  isActive?: boolean;
  createdAt?: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
  createdById: string;
  updatedById: string;
}

export type CreateEmployeeInput = Omit<Employee, "id" | "createdAt" | "updatedAt">;
export type UpdateEmployeeInput = Partial<CreateEmployeeInput>;
