import { BaseService } from "./_base.service";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";
import { Configuration } from "@prisma/client";

type ConfigurationAttributes = Omit<
  Configuration,
  "id" | "createdAt" | "updatedAt"
>;

export class ConfigurationService extends BaseService<Configuration> {
  protected model = prisma.configuration;
  protected entityName = "Configuration";
  protected modelName = "configuration";

  protected async validate(
    configuration: ConfigurationAttributes
  ): Promise<void> {
    if (!configuration.name) {
      throw new BadRequestError("Configuration name is required");
    }
  }
}
