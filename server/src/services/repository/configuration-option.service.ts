import { ConfigurationOption } from "@prisma/client";
import { BaseService } from "./_";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";

type ConfigurationOptionAttributes = Omit<
  ConfigurationOption,
  "id" | "createdAt" | "updatedAt"
>;

export class ConfigurationOptionService extends BaseService<ConfigurationOption> {
  protected model = prisma.configurationOption;
  protected entityName = "ConfigurationOption";
  protected modelName = "configurationOption";

  protected async validate(
    configurationOption: ConfigurationOptionAttributes
  ): Promise<void> {
    if (!configurationOption.configurationId) {
      throw new BadRequestError("Configuration ID is required");
    }
    if (!configurationOption.optionId) {
      throw new BadRequestError("Option ID is required");
    }
  }
}
