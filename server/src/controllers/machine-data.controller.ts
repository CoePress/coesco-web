import { machineDataService } from "@/services";
import { IQueryParams } from "@/types/api.types";
import { NextFunction, Request, Response } from "express";

export class MachineDataController {
  async getMachineStatuses(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, sort, order, search, filter, dateFrom, dateTo } =
        req.query;

      const params: IQueryParams = {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : undefined,
        sort: sort as string,
        order: order as "asc" | "desc",
        search: search as string,
        filter: filter as Record<string, any>,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
      };

      const machineStatuses = await machineDataService.getMachineStatuses(
        params
      );

      res.status(200).json(machineStatuses);
    } catch (error) {
      next(error);
    }
  }

  async getMachineOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
    } catch (error) {
      next(error);
    }
  }

  async getMachineTimeline(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
    } catch (error) {
      next(error);
    }
  }
}
