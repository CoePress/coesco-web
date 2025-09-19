// Auto-generated from Prisma schema
export interface FormPage {
  id?: string;
  formId: string;
  title: string;
  sequence: number;
  createdAt?: Date | string;
  updatedAt: Date | string;
  createdById: string;
  updatedById: string;
}

export type CreateFormPageInput = Omit<FormPage, "id" | "createdAt" | "updatedAt">;
export type UpdateFormPageInput = Partial<CreateFormPageInput>;
