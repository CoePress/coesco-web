import { AuthController } from "./auth.controller";
import { ConfigController } from "./config.controller";
import { EmailController } from "./email.controller";
import { EmployeeController } from "./employee.controller";
import { MachineController } from "./machine.controller";
import { MachineDataController } from "./machine-data.controller";
import { CustomerController } from "./customer.controller";

export const authController = new AuthController();
export const configController = new ConfigController();
export const emailController = new EmailController();
export const employeeController = new EmployeeController();
export const machineController = new MachineController();
export const machineDataController = new MachineDataController();
export const customerController = new CustomerController();
