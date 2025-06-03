import { BaseService } from "./_";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";
import { MachineStatus } from "@prisma/client";
import { IQueryParams } from "@/types/api.types";

type MachineStatusAttributes = Omit<
  MachineStatus,
  "id" | "createdAt" | "updatedAt"
>;

export class MachineStatusService extends BaseService<MachineStatus> {
  protected model = prisma.machineStatus;
  protected entityName = "MachineStatus";

  public async getByDateRange(
    params: IQueryParams<MachineStatus> & { startDate: string; endDate: string }
  ) {
    const dateFilter = {
      OR: [
        {
          startTime: {
            gte: new Date(params.startDate),
            lte: new Date(params.endDate),
          },
        },
        {
          endTime: {
            gte: new Date(params.startDate),
            lte: new Date(params.endDate),
          },
        },
        {
          AND: [
            {
              startTime: {
                lte: new Date(params.startDate),
              },
            },
            {
              endTime: {
                gte: new Date(params.endDate),
              },
            },
          ],
        },
      ],
    };

    const queryParams: IQueryParams<MachineStatus> = {
      ...params,
      filter: {
        ...(params.filter || {}),
        ...dateFilter,
      },
    };

    const result = await this.getAll(queryParams);

    return {
      success: true,
      data: result.data,
    };
  }

  protected async validate(
    machineStatus: MachineStatusAttributes
  ): Promise<void> {
    if (!machineStatus.machineId) {
      throw new BadRequestError("MachineId is required");
    }

    const machine = await prisma.machine.findUnique({
      where: { id: machineStatus.machineId },
    });

    if (!machine) {
      throw new BadRequestError("Machine not found");
    }

    if (!machineStatus.state) {
      throw new BadRequestError("State is required");
    }

    if (!machineStatus.startTime) {
      throw new BadRequestError("Start time is required");
    }

    if (
      machineStatus.endTime &&
      machineStatus.endTime < machineStatus.startTime
    ) {
      throw new BadRequestError("End time cannot be before start time");
    }
  }
}
