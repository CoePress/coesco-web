import { Configuration } from "@prisma/client";
import { BaseService } from "./_";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";

type ConfigurationAttributes = Omit<
  Configuration,
  "id" | "createdAt" | "updatedAt"
>;

export class ConfigurationService extends BaseService<Configuration> {
  protected model = prisma.configuration;
  protected entityName = "Configuration";

  protected async validate(
    configuration: ConfigurationAttributes
  ): Promise<void> {
    if (!configuration.name) {
      throw new BadRequestError("Name is required");
    }
  }
}
