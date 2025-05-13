import { EmployeeService } from "@/services/employee.service";
import { IQueryParams } from "@/types/api.types";
import { NextFunction, Request, Response } from "express";

export class EmployeeController {
  async getEmployees(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, sort, order, search, filter } = req.query;

      const params: IQueryParams = {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : undefined,
        sort: sort as string,
        order: order as "asc" | "desc",
        search: search as string,
        filter: filter as Record<string, any>,
      };

      const employeeService = new EmployeeService();
      const employees = await employeeService.getEmployees(params);

      res.status(200).json(employees);
    } catch (error) {
      next(error);
    }
  }

  async getEmployee() {}

  async createEmployee() {}

  async updateEmployee() {}

  async deleteEmployee() {}
}
