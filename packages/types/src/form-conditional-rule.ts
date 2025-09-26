// Auto-generated from Prisma schema
import { ConditionalTarget } from './conditional-target';
import { ConditionalAction } from './conditional-action';
import { ConditionalOperator } from './conditional-operator';

export interface FormConditionalRule {
  id?: string;
  formId: string;
  name?: string;
  targetType: ConditionalTarget;
  targetId: string;
  action: ConditionalAction;
  conditions: any;
  operator?: ConditionalOperator;
  priority?: number;
  isActive?: boolean;
  createdAt?: Date | string;
  updatedAt: Date | string;
  createdById: string;
  updatedById: string;
}

export type CreateFormConditionalRuleInput = Omit<FormConditionalRule, "id" | "createdAt" | "updatedAt">;
export type UpdateFormConditionalRuleInput = Partial<CreateFormConditionalRuleInput>;
