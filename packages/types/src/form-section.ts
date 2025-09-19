// Auto-generated from Prisma schema
export interface FormSection {
  id?: string;
  pageId: string;
  title: string;
  description?: string;
  sequence: number;
  createdAt?: Date | string;
  updatedAt: Date | string;
  createdById: string;
  updatedById: string;
}

export type CreateFormSectionInput = Omit<FormSection, "id" | "createdAt" | "updatedAt">;
export type UpdateFormSectionInput = Partial<CreateFormSectionInput>;
