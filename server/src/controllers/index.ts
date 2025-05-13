import { AuthController } from "./auth.controller";
import { EmployeeController } from "./employee.controller";
import { MachineController } from "./machine.controller";
import { MachineDataController } from "./machine-data.controller";
import { ConfigController } from "./config.controller";

export const authController = new AuthController();
export const configController = new ConfigController();
export const employeeController = new EmployeeController();
export const machineDataController = new MachineDataController();
export const machineController = new MachineController();
