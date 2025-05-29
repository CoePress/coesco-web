import { Employee } from "@prisma/client";
import { BaseService } from "./_";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";

type EmployeeAttributes = Omit<Employee, "id" | "createdAt" | "updatedAt">;

export class EmployeeService extends BaseService<Employee> {
  protected model = prisma.employee;
  protected entityName = "Employee";

  protected async validate(employee: EmployeeAttributes): Promise<void> {
    if (!employee.firstName) {
      throw new BadRequestError("First name is required");
    }
  }
}
