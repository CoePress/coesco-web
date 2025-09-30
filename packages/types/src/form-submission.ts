// Auto-generated from Prisma schema
import { FormSubmissionStatus } from './form-submission-status';

export interface FormSubmission {
  id?: string;
  formId: string;
  status?: FormSubmissionStatus;
  answers?: any;
  createdAt?: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
  createdById: string;
  updatedById: string;
}

export type CreateFormSubmissionInput = Omit<FormSubmission, "id" | "createdAt" | "updatedAt">;
export type UpdateFormSubmissionInput = Partial<CreateFormSubmissionInput>;
