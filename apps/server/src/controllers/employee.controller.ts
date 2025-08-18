import type { Employee } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

import { microsoftService } from "@/services";
import { employeeService } from "@/services/repository";
import { buildQueryParams } from "@/utils";

export class EmployeeController {
  async getEmployees(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buildQueryParams<Employee>(req.query);
      const result = await employeeService.getAll(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async syncEmployees(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await microsoftService.sync();
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }
}
