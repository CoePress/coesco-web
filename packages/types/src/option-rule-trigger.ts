// Auto-generated from Prisma schema
export interface OptionRuleTrigger {
  ruleId: string;
  optionId: string;
  createdAt?: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
  createdById: string;
  updatedById: string;
}

export type CreateOptionRuleTriggerInput = Omit<OptionRuleTrigger, "id" | "createdAt" | "updatedAt">;
export type UpdateOptionRuleTriggerInput = Partial<CreateOptionRuleTriggerInput>;
