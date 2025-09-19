// Auto-generated from Prisma schema
import { FormFieldControlType } from './form-field-control-type';
import { FormFieldDataType } from './form-field-data-type';

export interface FormField {
  id?: string;
  sectionId: string;
  label: string;
  variable: string;
  controlType: FormFieldControlType;
  dataType: FormFieldDataType;
  isRequired?: boolean;
  isReadOnly?: boolean;
  isHiddenOnDevice?: boolean;
  isHiddenOnReport?: boolean;
  sequence: number;
  createdAt?: Date | string;
  updatedAt: Date | string;
  createdById: string;
  updatedById: string;
}

export type CreateFormFieldInput = Omit<FormField, "id" | "createdAt" | "updatedAt">;
export type UpdateFormFieldInput = Partial<CreateFormFieldInput>;
