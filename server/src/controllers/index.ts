import { AuthController } from "./old/auth.controller";
import { ConfigController } from "./old/config.controller";
import { EmailController } from "./old/email.controller";
import { EmployeeController } from "./old/employee.controller";
import { MachineController } from "./old/machine.controller";
import { MachineDataController } from "./old/machine-data.controller";
import { CustomerController } from "./customer.controller";
import { DealerController } from "./dealer.controller";
import { AddressController } from "./address.controller";

export const authController = new AuthController();
export const configController = new ConfigController();
export const emailController = new EmailController();
export const employeeController = new EmployeeController();
export const machineController = new MachineController();
export const machineDataController = new MachineDataController();

export const customerController = new CustomerController();
export const dealerController = new DealerController();
export const addressController = new AddressController();
