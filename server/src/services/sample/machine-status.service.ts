import { MachineStatus } from "@prisma/client";
import { prisma } from "@/utils/prisma";
import { BaseService } from "../repository/_";
import { BadRequestError } from "@/middleware/error.middleware";
import { machineService } from '.';

type MachineStatusAttributes = Omit<MachineStatus, "id" | "createdAt" | "updatedAt">;

export class MachineStatusService extends BaseService<MachineStatus> {
  protected model = prisma.machineStatus;
  protected entityName = "MachineStatus";
  protected modelName = "machineStatus";

  protected getOrganizationFilter(organizationId: string) {
    return { organizationId };
  }

  protected async validate(data: MachineStatusAttributes): Promise<void> {
    if (!data.machineId) {
      throw new BadRequestError("machineId is required");
    }

    const machine = await machineService.getById(data.machineId);
    if (!machine.success || !machine.data) {
      throw new BadRequestError("Machine not found");
    }

    if (!data.state) {
      throw new BadRequestError("state is required");
    }

    if (!data.execution) {
      throw new BadRequestError("execution is required");
    }

    if (!data.controller) {
      throw new BadRequestError("controller is required");
    }

    if (!data.program) {
      throw new BadRequestError("program is required");
    }

    if (!data.tool) {
      throw new BadRequestError("tool is required");
    }

    if (!data.metrics) {
      throw new BadRequestError("metrics is required");
    }

    if (!data.alarmCode) {
      throw new BadRequestError("alarmCode is required");
    }

    if (!data.alarmMessage) {
      throw new BadRequestError("alarmMessage is required");
    }

    if (!data.startTime) {
      throw new BadRequestError("startTime is required");
    }

    if (!data.duration) {
      throw new BadRequestError("duration is required");
    }
  }
}
