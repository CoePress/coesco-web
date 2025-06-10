import { Machine } from "@prisma/client";
import { prisma } from "@/utils/prisma";
import { BaseService } from "../repository/_";
import { BadRequestError } from "@/middleware/error.middleware";


type MachineAttributes = Omit<Machine, "id" | "createdAt" | "updatedAt">;

export class MachineService extends BaseService<Machine> {
  protected model = prisma.machine;
  protected entityName = "Machine";
  protected modelName = "machine";

  protected getOrganizationFilter(organizationId: string) {
    return { organizationId };
  }

  protected async validate(data: MachineAttributes): Promise<void> {
    if (!data.slug) {
      throw new BadRequestError("slug is required");
    }

    if (!data.name) {
      throw new BadRequestError("name is required");
    }

    if (!data.type) {
      throw new BadRequestError("type is required");
    }

    if (!data.controllerType) {
      throw new BadRequestError("controllerType is required");
    }

    if (!data.connectionType) {
      throw new BadRequestError("connectionType is required");
    }
  }
}
