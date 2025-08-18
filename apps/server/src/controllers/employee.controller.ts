import type { Employee } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

import type { IQueryParams } from "@/types";

import { microsoftService } from "@/services";
import { employeeService } from "@/services/repository";

export class EmployeeController {
  async getEmployees(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, sort, order, search, filter, include } = req.query;
      const params: IQueryParams<Employee> = {
        page: page ? Number.parseInt(page as string) : 1,
        limit: limit ? Number.parseInt(limit as string) : undefined,
        sort: sort as string,
        order: order as "asc" | "desc",
        search: search as string,
        filter: filter as Partial<Employee>,
        include: include ? JSON.parse(include as string) : undefined,
      };
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
