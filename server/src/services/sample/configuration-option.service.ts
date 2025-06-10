import { ConfigurationOption } from "@prisma/client";
import { prisma } from "@/utils/prisma";
import { BaseService } from "../repository/_";
import { BadRequestError } from "@/middleware/error.middleware";
import { configurationService } from '.';
import { optionService } from '.';

type ConfigurationOptionAttributes = Omit<ConfigurationOption, "id" | "createdAt" | "updatedAt">;

export class ConfigurationOptionService extends BaseService<ConfigurationOption> {
  protected model = prisma.configurationOption;
  protected entityName = "ConfigurationOption";
  protected modelName = "configurationOption";

  protected getOrganizationFilter(organizationId: string) {
    return { organizationId };
  }

  protected async validate(data: ConfigurationOptionAttributes): Promise<void> {
    if (!data.configurationId) {
      throw new BadRequestError("configurationId is required");
    }

    const configuration = await configurationService.getById(data.configurationId);
    if (!configuration.success || !configuration.data) {
      throw new BadRequestError("Configuration not found");
    }

    if (!data.optionId) {
      throw new BadRequestError("optionId is required");
    }

    const option = await optionService.getById(data.optionId);
    if (!option.success || !option.data) {
      throw new BadRequestError("Option not found");
    }
  }
}
