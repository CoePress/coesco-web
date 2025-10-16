import type { MachineStatus } from "@prisma/client";

import type { IQueryParams } from "@/types";

import { machineStatusRepository } from "@/repositories";

import { MachineMonitorService } from "./machining.service";

export class ResourceMonitoringService {
  private machineMonitorService: MachineMonitorService;

  constructor() {
    this.machineMonitorService = new MachineMonitorService();
  }

  async getAllMachineStatuses(params?: IQueryParams<MachineStatus>) {
    return machineStatusRepository.getAll(params);
  }

  async getMachineStatusById(id: string, params?: IQueryParams<MachineStatus>) {
    return machineStatusRepository.getById(id, params);
  }

  async getMachineOverview(
    startDate: string,
    endDate: string,
    view: string,
    timezoneOffset?: number,
  ) {
    return this.machineMonitorService.getMachineOverview(startDate, endDate, view, timezoneOffset);
  }

  async getMachineTimeline(startDate?: string, endDate?: string) {
    return this.machineMonitorService.getMachineTimeline(startDate || "", endDate || "");
  }

  async resetFanucAdapter() {
    return this.machineMonitorService.resetFanucAdapter();
  }
}
