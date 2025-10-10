import { resourceMonitoringService } from "@/services";
import { buildQueryParams } from "@/utils";
import { MachineStatus } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

export class ResourceMonitoringController {
    async getMachineStatuses(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buildQueryParams<MachineStatus>(req.query);
      const result = await machineStatusService.getAll(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getMachineStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await machineStatusService.getById(req.params.machineStatusId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, view = "all", timezoneOffset } = req.query;
      const result = await machiningService.getMachineOverview(
        startDate as string,
        endDate as string,
        view as string,
        timezoneOffset ? Number(timezoneOffset) : undefined,
      );
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getTimeline(req: Request, res: Response, next: NextFunction) {
    try {
      const result = {};
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async resetFanucAdapter(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await machiningService.resetFanucAdapter();
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }
}