import { Option } from "@prisma/client";
import { BaseService } from "./_";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";

type OptionAttributes = Omit<Option, "id" | "createdAt" | "updatedAt">;

export class OptionService extends BaseService<Option> {
  protected model = prisma.option;
  protected entityName = "Option";

  protected async validate(option: OptionAttributes): Promise<void> {
    if (!option.name) {
      throw new BadRequestError("Name is required");
    }
  }
}
