import { buildQuery } from "@/utils";
import { IQueryParams } from "@/types/api.types";
import { IMachineStatus } from "@/types/schema.types";
import MachineStatus from "@/models/machine-status";

export class MachineDataService {
  async getMachineStatuses(params: IQueryParams) {
    const { whereClause, orderClause, page, limit, offset } = buildQuery(
      params,
      ["status"]
    );

    const machineStatuses = await MachineStatus.findAll({
      where: whereClause,
      order: Object.entries(orderClause).map(([key, value]) => [key, value]),
      limit,
      offset,
    });

    const total = await MachineStatus.count({ where: whereClause });
    const totalPages = limit ? Math.ceil(total / limit) : 1;

    return {
      success: true,
      data: machineStatuses.map(
        (machineStatus) => machineStatus.toJSON() as IMachineStatus
      ),
      total,
      totalPages,
      page,
      limit,
    };
  }

  async getMachineOverview(startDate: string, endDate: string) {}

  async getMachineTimeline(startDate: string, endDate: string) {}

  async processFanucData(data: any) {
    return data;
  }
}
