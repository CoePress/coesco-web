// Auto-generated from Prisma schema
export interface Form {
  id?: string;
  name: string;
  description?: string;
  status?: string;
  createdAt?: Date | string;
  updatedAt: Date | string;
  createdById: string;
  updatedById: string;
}

export type CreateFormInput = Omit<Form, "id" | "createdAt" | "updatedAt">;
export type UpdateFormInput = Partial<CreateFormInput>;
