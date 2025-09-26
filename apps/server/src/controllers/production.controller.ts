import type { Machine, MachineStatus } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

import { machiningService } from "@/services";
import { machineService, machineStatusService } from "@/services/repository";
import { buildQueryParams } from "@/utils";

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
      const params = buildQueryParams<Machine>(req.query);
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
      const result = await machineStatusService.getById(req.params.companyId);
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
