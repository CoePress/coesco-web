import type { Request, Response } from "express";
import { z } from "zod";

import { employeeService, employeeSyncService } from "@/services";
import { asyncWrapper, buildQueryParams } from "@/utils";
import { HTTP_STATUS } from "@/utils/constants";
import { Employee } from "@prisma/client";

const CreateEmployeeSchema = z.object({
  userId: z.string().uuid("Invalid user ID").optional(),
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional(),
  title: z.string().optional(),
  department: z.string().optional(),
  legacy: z.record(z.any()).optional(),
});

const UpdateEmployeeSchema = z.object({
  userId: z.string().uuid("Invalid user ID").optional(),
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional(),
  title: z.string().optional(),
  department: z.string().optional(),
  legacy: z.record(z.any()).optional(),
});

export class EmployeeController {
  createEmployee = asyncWrapper(async (req: Request, res: Response) => {
    const validData = CreateEmployeeSchema.parse(req.body);
    const result = await employeeService.createEmployee(validData);
    res.status(HTTP_STATUS.CREATED).json(result);
  });

  getEmployees = asyncWrapper(async (req: Request, res: Response) => {
    const params = buildQueryParams<Employee>(req.query);
    const result = await employeeService.getAllEmployees(params);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getEmployee = asyncWrapper(async (req: Request, res: Response) => {
    const result = await employeeService.getEmployeeById(req.params.employeeId);
    res.status(HTTP_STATUS.OK).json(result);
  });

  updateEmployee = asyncWrapper(async (req: Request, res: Response) => {
    const validData = UpdateEmployeeSchema.parse(req.body);
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

    const employee = await employeeService.getEmployeeById(req.params.employeeId);
    if (!employee.data) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, error: "Employee not found" });
    }

    if (Object.keys(userData).length > 0) {
      await employeeService.updateUser(employee.data.userId, userData);
    }

    if (Object.keys(employeeData).length > 0) {
      await employeeService.updateEmployee(req.params.employeeId, employeeData);
    }

    const result = await employeeService.getEmployeeById(req.params.employeeId, { include: ["user"] });
    res.status(HTTP_STATUS.OK).json(result);
  });

  deleteEmployee = asyncWrapper(async (req: Request, res: Response) => {
    await employeeService.deleteEmployee(req.params.employeeId);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  });

  syncEmployees = asyncWrapper(async (req: Request, res: Response) => {
    const result = await employeeSyncService.syncAll();
    res.status(HTTP_STATUS.OK).json(result);
  });

  syncEmployeesFromLegacy = asyncWrapper(async (req: Request, res: Response) => {
    const result = await employeeSyncService.syncFromLegacy();
    res.status(HTTP_STATUS.OK).json(result);
  });

  syncEmployeesFromMicrosoft = asyncWrapper(async (req: Request, res: Response) => {
    const result = await employeeSyncService.syncFromMicrosoft();
    res.status(HTTP_STATUS.OK).json(result);
  });
}