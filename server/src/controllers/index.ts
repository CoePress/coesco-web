import { AuthController } from "./auth.controller";
import { EmployeeController } from "./employee.controller";
import { MachineController } from "./machine.controller";

export const authController = new AuthController();
export const employeeController = new EmployeeController();
export const machineController = new MachineController();
