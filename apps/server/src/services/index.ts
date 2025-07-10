import { io } from "@/app";
import { logger } from "@/utils/logger";
import { AuthService } from "./core/auth.service";
import { CacheService } from "./core/cache.service";
import { CronService } from "./core/cron.service";
import { EmailService } from "./core/email.service";
import { EmployeeService } from "./repository/employee.service";
import { MachineMonitorService } from "./domain/machine-monitor.service";
import { SocketService } from "./core/socket.service";
import { CompanyService } from "./repository/company.service";
import { AddressService } from "./repository/address.service";
import { ContactService } from "./repository/contact.service";
import { JourneyService } from "./repository/journey.service";
import { QuoteService } from "./repository/quote.service";
import { QuoteItemService } from "./repository/quote.-item.service";
import { ConfigService } from "./domain/config.service";
import { SalesService } from "./domain/sales.service";
import { ItemService } from "./repository/item.service";
import { MachineService } from "./repository/machine.service";
import { MachineStatusService } from "./repository/machine-status.service";
import { UserService } from "./repository/user.service";
import { QuotingService } from "./domain/quoting.service";
import { ConfigurationService } from "./repository/configuration.service";

export const machineService = new MachineService();
export const machineMonitorService = new MachineMonitorService();
export const machineStatusService = new MachineStatusService();

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
export const salesService = new SalesService();
export const itemService = new ItemService();
export const userService = new UserService();
export const configurationService = new ConfigurationService();

export const quotingService = new QuotingService();
export const configService = new ConfigService();

export const initializeServices = async () => {
  socketService.setIo(io);
  socketService.initialize();
  logger.info("Socket service initialized");

  await cronService.initialize();
  logger.info("Cron service initialized");

  await machineMonitorService.initialize();
  logger.info("Machine data service initialized");

  const employees = await employeeService.getAll();
  if (employees.data.length === 0) {
    await employeeService.sync();
    logger.info("Employees synced");
  }
};
