import { Machine } from "@prisma/client";
import { BaseService } from "./_base.service";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";

type MachineAttributes = Omit<Machine, "id" | "createdAt" | "updatedAt">;

export class MachineService extends BaseService<Machine> {
  protected model = prisma.machine;
  protected entityName = "Machine";
  protected modelName = "machine";

  protected async validate(machine: MachineAttributes): Promise<void> {
    if (!machine.name) {
      throw new Error("Machine name is required");
    }

    if (!machine.slug) {
      throw new Error("Machine slug is required");
    }

    if (!machine.type) {
      throw new Error("Machine type is required");
    }

    if (!machine.controllerType) {
      throw new Error("Machine controller type is required");
    }

    if (!machine.connectionType) {
      throw new Error("Machine connection type is required");
    }

    if (!machine.connectionHost) {
      throw new Error("Machine connection host is required");
    }

    if (!machine.connectionPort) {
      throw new Error("Machine connection port is required");
    }

    const existingMachine = await this.model.findUnique({
      where: { slug: machine.slug },
    });

    if (existingMachine) {
      throw new Error("Machine already exists");
    }
  }
}
