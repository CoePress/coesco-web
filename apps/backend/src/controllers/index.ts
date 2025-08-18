import { AuthController } from "./auth.controller";
import { ChatController } from "./chat.controller";
import { ConfigurationController } from "./configuration.controller";
import { CRMController } from "./crm.controller";
import { EmployeeController } from "./employee.controller";
import { ProductionController } from "./production.controller";
import { QuoteController } from "./quote.controller";
import { SystemController } from "./system.controller";

export const authController = new AuthController();
export const chatController = new ChatController();
export const configurationController = new ConfigurationController();
export const crmController = new CRMController();
export const employeeController = new EmployeeController();
export const productionController = new ProductionController();
export const quoteController = new QuoteController();
export const systemController = new SystemController();
