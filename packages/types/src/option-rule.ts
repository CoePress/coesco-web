// Auto-generated from Prisma schema
import { OptionRuleAction } from './option-rule-action';

export interface OptionRule {
  id?: string;
  name: string;
  description?: string;
  action: OptionRuleAction;
  priority?: number;
  isActive?: boolean;
  condition: any;
  createdAt?: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
  createdById: string;
  updatedById: string;
}

export type CreateOptionRuleInput = Omit<OptionRule, "id" | "createdAt" | "updatedAt">;
export type UpdateOptionRuleInput = Partial<CreateOptionRuleInput>;
