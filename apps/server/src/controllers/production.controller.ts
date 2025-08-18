import type { Machine } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

import type { IQueryParams } from "@/types";

import { machiningService } from "@/services";
import { machineService } from "@/services/repository";

export class ProductionController {
  // Machines
  async createMachine(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await machineService.create(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getMachines(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, sort, order, search, filter, include } = req.query;
      const params: IQueryParams<Machine> = {
        page: page ? Number.parseInt(page as string) : 1,
        limit: limit ? Number.parseInt(limit as string) : undefined,
        sort: sort as string,
        order: order as "asc" | "desc",
        search: search as string,
        filter: filter as Partial<Machine>,
        include: include ? JSON.parse(include as string) : undefined,
      };
      const result = await machineService.getAll(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getMachine(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await machineService.getById(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateMachine(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await machineService.update(req.params.companyId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteMachine(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await machineService.delete(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  // Misc
  async getMachineStatuses() { }
  async getMachineStatus() { }

  async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, view = "all" } = req.query;
      const result = await machiningService.getMachineOverview(
        startDate as string,
        endDate as string,
        view as string,
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
