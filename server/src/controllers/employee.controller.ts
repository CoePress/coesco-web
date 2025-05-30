import { employeeService } from "@/services";
import { BaseController } from "./_";
import { Employee } from "@prisma/client";

export class EmployeeController extends BaseController<Employee> {
  protected service = employeeService;
  protected entityName = "Employee";
}
