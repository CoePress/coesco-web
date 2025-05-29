import { machineService } from "@/services";
import { IQueryParams } from "@/types/api.types";
import { NextFunction, Request, Response } from "express";
export class MachineController {
  async getMachines(req: Request, res: Response, next: NextFunction) {
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

      const machines = await machineService.getMachines(params);

      res.status(200).json(machines);
    } catch (error) {
      next(error);
    }
  }
  async getMachine() {}

  async createMachine() {}

  async updateMachine() {}

  async deleteMachine() {}

  async getMachineStatuses() {}
}
