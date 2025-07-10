import { BaseService } from "./_base.service";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";
import { OptionHeader } from "@prisma/client";

type OptionHeaderAttributes = Omit<
  OptionHeader,
  "id" | "createdAt" | "updatedAt"
>;

export class OptionHeaderService extends BaseService<OptionHeader> {
  protected model = prisma.optionHeader;
  protected entityName = "OptionHeader";
  protected modelName = "optionHeader";

  async getConfigurationsWithOptions(productClassId?: string) {}

  protected async validate(
    optionHeader: OptionHeaderAttributes
  ): Promise<void> {
    if (!optionHeader.name) {
      throw new BadRequestError("Option header name is required");
    }
  }
}
