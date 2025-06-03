import { AuthController } from "./core/auth.controller";
import { ConfigController } from "./old/config.controller";
import { EmailController } from "./old/email.controller";
import { MachineController } from "./old/machine.controller";
import { MachineDataController } from "./old/machine-data.controller";
import { CompanyController } from "./repository/company.controller";
import { AddressController } from "./repository/address.controller";
import { ContactController } from "./repository/contact.controller";
import { QuoteController } from "./repository/quote.controller";
import { EmployeeController } from "./repository/employee.controller";
import { JourneyController } from "./repository/journey.controller";
import { SalesController } from "./domain/sales.controller";
import { ItemController } from "./repository/item.controller";

// Core
export const authController = new AuthController();
export const configController = new ConfigController();
export const emailController = new EmailController();
export const machineController = new MachineController();
export const machineDataController = new MachineDataController();

// Domain
export const salesController = new SalesController();

// Repository
export const employeeController = new EmployeeController();
export const companyController = new CompanyController();
export const addressController = new AddressController();
export const contactController = new ContactController();
export const journeyController = new JourneyController();
export const quoteController = new QuoteController();

export const itemController = new ItemController();
