import { AuthController } from "./old/auth.controller";
import { ConfigController } from "./old/config.controller";
import { EmailController } from "./old/email.controller";
import { MachineController } from "./old/machine.controller";
import { MachineDataController } from "./old/machine-data.controller";
import { CompanyController } from "./company.controller";
import { AddressController } from "./address.controller";
import { ContactController } from "./contact.controller";
import { QuoteController } from "./quote.controller";
import { EmployeeController } from "./employee.controller";
import { JourneyController } from "./journey.controller";

export const authController = new AuthController();
export const configController = new ConfigController();
export const emailController = new EmailController();
export const machineController = new MachineController();
export const machineDataController = new MachineDataController();

export const employeeController = new EmployeeController();
export const companyController = new CompanyController();
export const addressController = new AddressController();
export const contactController = new ContactController();
export const journeyController = new JourneyController();
export const quoteController = new QuoteController();
