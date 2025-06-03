import { io } from "@/app";
import { logger } from "@/utils/logger";
import { AuthService } from "./core/auth.service";
import { CacheService } from "./core/cache.service";
import { CronService } from "./core/cron.service";
import { EmailService } from "./core/email.service";
import { EmployeeService } from "./repository/employee.service";
import { MachineDataService } from "./domain/machine-monitor.service";
import { SocketService } from "./core/socket.service";
import { CompanyService } from "./repository/company.service";
import { AddressService } from "./repository/address.service";
import { ContactService } from "./repository/contact.service";
import { JourneyService } from "./repository/journey.service";
import { QuoteService } from "./repository/quote.service";
import { QuoteItemService } from "./repository/quote.-item.service";
import { ProductClassService } from "./repository/product-class.service";
import { OptionCategoryService } from "./repository/option-category.service";
import { OptionService } from "./repository/option.service";
import { ConfigurationService } from "./repository/configuration.service";
import { OptionRulesService } from "./repository/option-rules.services";
import { ConfigurationOptionService } from "./repository/configuration-option.service";
import { SalesService } from "./domain/sales.service";
import { ItemService } from "./repository/item.service";
import { MachineService } from "./repository/machine.service";
import { MachineStatusService } from "./repository/machine-status.service";

export const machineService = new MachineService();
export const machineDataService = new MachineDataService();
export const machineStatusService = new MachineStatusService();

export const initializeServices = async () => {
  socketService.setIo(io);
  socketService.initialize();
  logger.info("Socket service initialized");

  await cronService.initialize();
  logger.info("Cron service initialized");

  await machineDataService.initialize();
  logger.info("Machine data service initialized");
};

export const authService = new AuthService();
export const cacheService = new CacheService();
export const cronService = new CronService();
export const emailService = new EmailService();
export const socketService = new SocketService();
export const employeeService = new EmployeeService();
export const companyService = new CompanyService();
export const addressService = new AddressService();
export const contactService = new ContactService();
export const journeyService = new JourneyService();
export const quoteService = new QuoteService();
export const quoteItemService = new QuoteItemService();
export const productClassService = new ProductClassService();
export const optionCategoryService = new OptionCategoryService();
export const optionService = new OptionService();
export const optionRulesService = new OptionRulesService();
export const configurationService = new ConfigurationService();
export const configurationOptionService = new ConfigurationOptionService();
export const salesService = new SalesService();
export const itemService = new ItemService();
