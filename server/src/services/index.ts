import { AuthService } from "./auth.service";
import { EmployeeService } from "./employee.service";
import { MachineDataService } from "./machine-data.service";
import { MachineService } from "./machine.service";
import { QuoteService } from "./quote.service";

export const authService = new AuthService();
export const employeeService = new EmployeeService();
export const machineDataService = new MachineDataService();
export const machineService = new MachineService();
export const quoteService = new QuoteService();
