import { io } from "@/app";
import { AuthService } from "./auth.service";
import { CacheService } from "./cache.service";
import { CronService } from "./cron.service";
import { EmailService } from "./email.service";
import { EmployeeService } from "./employee.service";
import { MachineService } from "./machine.service";
import { MachineDataService } from "./machine-data.service";
import { QuoteService } from "./quote.service";
import { SocketService } from "./socket.service";
import { logger } from "@/utils/logger";

export const authService = new AuthService();
export const cacheService = new CacheService();
export const cronService = new CronService();
export const emailService = new EmailService();
export const employeeService = new EmployeeService();
export const machineService = new MachineService();
export const machineDataService = new MachineDataService();
export const quoteService = new QuoteService();
export const socketService = new SocketService();

export const initializeServices = async () => {
  socketService.setIo(io);
  socketService.initialize();
  logger.info("Socket service initialized");

  await cronService.initialize();
  logger.info("Cron service initialized");

  await machineDataService.initialize();
  logger.info("Machine data service initialized");
};
