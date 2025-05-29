import { io } from "@/app";
import { AuthService } from "./core/auth.service";
import { CacheService } from "./core/cache.service";
import { CronService } from "./core/cron.service";
import { EmailService } from "./core/email.service";
import { EmployeeService } from "./employee.service";
import { MachineService } from "./machine.service";
import { MachineDataService } from "./machine-data.service";
import { QuoteService } from "./repository/quote.service";
import { SocketService } from "./core/socket.service";
import { logger } from "@/utils/logger";
import { CustomerService } from "./repository/customer.service";
import { CustomerAddressService } from "./repository/customer-address.service";
import { CustomerContactService } from "./repository/customer-contact.service";
import { DealerService } from "./repository/dealer.service";
import { DealerAddressService } from "./repository/dealer-address.service";
import { DealerContactService } from "./repository/dealer-contact.service";
import { QuoteRevisionService } from "./repository/quote-revision.service";
import { QuoteItemService } from "./repository/quote.-item.service";
import { ProductClassService } from "./repository/product-class.service";
import { OptionCategoryService } from "./repository/option-category.service";
import { OptionService } from "./repository/option.service";
import { ConfigurationService } from "./repository/configuration.service";
import { OptionRulesService } from "./repository/option-rules.services";
import { ConfigurationOptionService } from "./repository/configuration-option.service";

export const machineService = new MachineService();
export const machineDataService = new MachineDataService();

export const initializeServices = async () => {
  socketService.setIo(io);
  socketService.initialize();
  logger.info("Socket service initialized");

  await cronService.initialize();
  logger.info("Cron service initialized");

  await machineDataService.initialize();
  logger.info("Machine data service initialized");
};

// Core Services
export const authService = new AuthService();
export const cacheService = new CacheService();
export const cronService = new CronService();
export const emailService = new EmailService();
export const socketService = new SocketService();

// Logic Services

// Repository Services
// Organization
export const employeeService = new EmployeeService();

// Sales
export const customerService = new CustomerService();
export const customerAddressService = new CustomerAddressService();
export const customerContactService = new CustomerContactService();
export const dealerService = new DealerService();
export const dealerAddressService = new DealerAddressService();
export const dealerContactService = new DealerContactService();
export const quoteService = new QuoteService();
export const quoteRevisionService = new QuoteRevisionService();
export const quoteItemService = new QuoteItemService();

// Product
export const productClassService = new ProductClassService();
export const optionCategoryService = new OptionCategoryService();
export const optionService = new OptionService();
export const optionRulesService = new OptionRulesService();
export const configurationService = new ConfigurationService();
export const configurationOptionService = new ConfigurationOptionService();
