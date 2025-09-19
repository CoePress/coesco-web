// Auto-generated from Prisma schema
export interface FormSubmission {
  id?: string;
  formId: string;
  status?: string;
  answers?: any;
  createdAt?: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
  createdById: string;
  updatedById: string;
}

export type CreateFormSubmissionInput = Omit<FormSubmission, "id" | "createdAt" | "updatedAt">;
export type UpdateFormSubmissionInput = Partial<CreateFormSubmissionInput>;
