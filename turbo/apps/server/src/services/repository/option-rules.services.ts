import { OptionRule } from "@prisma/client";
import { BaseService } from "./_";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";

type OptionRuleAttributes = Omit<OptionRule, "id" | "createdAt" | "updatedAt">;

export class OptionRulesService extends BaseService<OptionRule> {
  protected model = prisma.optionRule;
  protected entityName = "OptionRule";
  protected modelName = "optionRule";

  protected async validate(optionRule: OptionRuleAttributes): Promise<void> {
    if (!optionRule.ruleType) {
      throw new BadRequestError("Rule type is required");
    }
  }
}
