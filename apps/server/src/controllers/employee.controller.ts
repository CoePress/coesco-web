import { employeeService } from "@/services";
import { BaseController } from "./_base.controller";
import { Employee } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

export class EmployeeController extends BaseController<Employee> {
  protected service = employeeService;
  protected entityName = "Employee";

  async sync(req: Request, res: Response, next: NextFunction) {
    try {
      const employees = await employeeService.sync();
      res.status(200).json(employees);
    } catch (error) {
      next(error);
    }
  }
}
