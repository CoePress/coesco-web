import { Machine } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { BaseController } from "./_";
import { machineMonitorService, machineService } from "@/services";

export class MachineController extends BaseController<Machine> {
  protected service = machineService;
  protected entityName = "Machine";

  async getMachinesOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, view = "all" } = req.query;
      const result = await machineMonitorService.getMachineOverview(
        startDate as string,
        endDate as string,
        view as string
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getMachinesTimeline(req: Request, res: Response, next: NextFunction) {
    try {
      const result = {};
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
