import { Employee } from "@prisma/client";
import { prisma } from "@/utils/prisma";
import { BaseService } from "../repository/_";
import { BadRequestError } from "@/middleware/error.middleware";
import { userService } from '.';

type EmployeeAttributes = Omit<Employee, "id" | "createdAt" | "updatedAt">;

export class EmployeeService extends BaseService<Employee> {
  protected model = prisma.employee;
  protected entityName = "Employee";
  protected modelName = "employee";

  protected getOrganizationFilter(organizationId: string) {
    return { organizationId };
  }

  protected async validate(data: EmployeeAttributes): Promise<void> {
    if (!data.userId) {
      throw new BadRequestError("userId is required");
    }

    const user = await userService.getById(data.userId);
    if (!user.success || !user.data) {
      throw new BadRequestError("User not found");
    }

    if (!data.number) {
      throw new BadRequestError("number is required");
    }

    if (!data.firstName) {
      throw new BadRequestError("firstName is required");
    }

    if (!data.lastName) {
      throw new BadRequestError("lastName is required");
    }

    if (!data.isActive) {
      throw new BadRequestError("isActive is required");
    }

    if (!data.jobTitle) {
      throw new BadRequestError("jobTitle is required");
    }
  }
}
