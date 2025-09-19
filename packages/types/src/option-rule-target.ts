// Auto-generated from Prisma schema
export interface OptionRuleTarget {
  ruleId: string;
  optionId: string;
  createdAt?: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
  createdById: string;
  updatedById: string;
}

export type CreateOptionRuleTargetInput = Omit<OptionRuleTarget, "id" | "createdAt" | "updatedAt">;
export type UpdateOptionRuleTargetInput = Partial<CreateOptionRuleTargetInput>;
