import { io } from "@/app";
import { logger } from "@/utils/logger";
import { AuthService } from "./core/auth.service";
import { CacheService } from "./core/cache.service";
import { CronService } from "./core/cron.service";
import { EmailService } from "./core/email.service";
import { MachineMonitorService } from "./domain/machine-monitor.service";
import { SocketService } from "./core/socket.service";
import { SalesService } from "./domain/sales.service";
import { SystemService } from "./core/system.service";
import { MicrosoftService } from "./domain/microsoft.service";
import { QuoteBuilderService } from "./domain/quote-builder.service";
import { ConfigBuilderService } from "./domain/config-builder.service";

// Core
export const authService = new AuthService();
export const cacheService = new CacheService();
export const cronService = new CronService();
export const emailService = new EmailService();
export const socketService = new SocketService();
export const systemService = new SystemService();

// Domain
export const configBuilderService = new ConfigBuilderService();
export const machineMonitorService = new MachineMonitorService();
export const microsoftService = new MicrosoftService();
export const quoteBuilderService = new QuoteBuilderService();
export const salesService = new SalesService();

export const initializeServices = async () => {
  socketService.setIo(io);
  socketService.initialize();
  logger.info("Socket service initialized");

  await cronService.initialize();
  logger.info("Cron service initialized");

  await machineMonitorService.initialize();
  logger.info("Machine data service initialized");

  await microsoftService.sync();
  logger.info("Microsoft service initialized");
};
