import { OptionRule } from "@prisma/client";
import { prisma } from "@/utils/prisma";
import { BaseService } from "../repository/_";
import { BadRequestError } from "@/middleware/error.middleware";


type OptionRuleAttributes = Omit<OptionRule, "id" | "createdAt" | "updatedAt">;

export class OptionRuleService extends BaseService<OptionRule> {
  protected model = prisma.optionRule;
  protected entityName = "OptionRule";
  protected modelName = "optionRule";

  protected getOrganizationFilter(organizationId: string) {
    return { organizationId };
  }

  protected async validate(data: OptionRuleAttributes): Promise<void> {
    if (!data.ruleType) {
      throw new BadRequestError("ruleType is required");
    }

    if (!data.triggerOptionId) {
      throw new BadRequestError("triggerOptionId is required");
    }

    if (!data.targetOptionId) {
      throw new BadRequestError("targetOptionId is required");
    }
  }
}
