import type { Request, Response } from "express";
import type { MachineStatus } from "@prisma/client";
import { z } from "zod";

import { resourceMonitoringService } from "@/services";
import { asyncWrapper, buildQueryParams } from "@/utils";
import { HTTP_STATUS } from "@/utils/constants";

const GetOverviewSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  view: z.string().default("all"),
  timezoneOffset: z.coerce.number().optional(),
});

export class ResourceMonitoringController {
  getMachineStatuses = asyncWrapper(async (req: Request, res: Response) => {
    const params = buildQueryParams<MachineStatus>(req.query);
    const result = await resourceMonitoringService.getAllMachineStatuses(params);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getMachineStatus = asyncWrapper(async (req: Request, res: Response) => {
    const result = await resourceMonitoringService.getMachineStatusById(req.params.machineStatusId);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getOverview = asyncWrapper(async (req: Request, res: Response) => {
    const { startDate, endDate, view, timezoneOffset } = GetOverviewSchema.parse(req.query);
    const result = await resourceMonitoringService.getMachineOverview(
      startDate,
      endDate,
      view,
      timezoneOffset,
    );
    res.status(HTTP_STATUS.OK).json(result);
  });

  getTimeline = asyncWrapper(async (req: Request, res: Response) => {
    const result = await resourceMonitoringService.getMachineTimeline();
    res.status(HTTP_STATUS.OK).json(result);
  });

  resetFanucAdapter = asyncWrapper(async (req: Request, res: Response) => {
    const result = await resourceMonitoringService.resetFanucAdapter();
    res.status(HTTP_STATUS.OK).json(result);
  });
}
