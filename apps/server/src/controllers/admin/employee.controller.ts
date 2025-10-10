import { employeeService } from "@/services";
import { buildQueryParams } from "@/utils";
import { Employee } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

export class EmployeeController {
    async createEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await employeeService.create(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

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

  async getEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await employeeService.getById(req.params.employeeId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const { body } = req;
      const employeeData: any = {};
      const userData: any = {};

      Object.keys(body).forEach((key) => {
        if (key.startsWith("user.")) {
          const userField = key.replace("user.", "");
          userData[userField] = body[key];
        }
        else {
          employeeData[key] = body[key];
        }
      });

      const employee = await employeeService.getById(req.params.employeeId);
      if (!employee.data) {
        return res.status(404).json({ success: false, error: "Employee not found" });
      }

      if (Object.keys(userData).length > 0) {
        await userService.update(employee.data.userId, userData);
      }

      if (Object.keys(employeeData).length > 0) {
        await employeeService.update(req.params.employeeId, employeeData);
      }

      const result = await employeeService.getById(req.params.employeeId, { include: ["user"] });
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await employeeService.delete(req.params.employeeId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async syncEmployees(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await employeeSyncService.syncAll();
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async syncEmployeesFromLegacy(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await employeeSyncService.syncFromLegacy();
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async syncEmployeesFromMicrosoft(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await employeeSyncService.syncFromMicrosoft();
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }
}