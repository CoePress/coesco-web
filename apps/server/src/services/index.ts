import { io } from "@/app";
import { __prod__ } from "@/config/env";

import { AuditServicce } from "./admin/audit.service";
import { BugReportingService } from "./admin/bug-reporting.service";
import { EmployeeService } from "./admin/employee.service";
import { ConfigurationService } from "./catalog/configuration.service";
import { OptionService } from "./catalog/option.service";
import { ProductService } from "./catalog/product.service";
import { CacheService } from "./core/cache.service";
import { EmailService } from "./core/email.service";
import { LockingService } from "./core/locking.service";
import { PermissionService } from "./core/permission.service";
import { SocketService } from "./core/socket.service";
import { CustomerService } from "./sales/customer.service";
import { JourneyService } from "./sales/journey.service";
import { QuoteService } from "./sales/quote.service";
import { ResourceMonitoringSerivce } from "./production/resource-monitoring.service";
import { ResourceService } from "./production/resource.service";
import { AuthService } from "./core/auth.service";
import { LegacyService } from "./core/legacy.service";




// Admin
export const auditService = new AuditServicce()
export const bugReportingServie = new BugReportingService()
export const employeeService = new EmployeeService()
export const permissionService = new PermissionService()

// Catalog
export const configurationService = new ConfigurationService()
export const optionService = new OptionService()
export const productService = new ProductService()

// Core
export const authService = new AuthService()
export const cacheService = new CacheService()
export const emailServicce = new EmailService()
export const legacyService = new LegacyService()
export const lockingService = new LockingService()
export const socketService = new SocketService()

// Production
export const resourceMonitoringService = new ResourceMonitoringSerivce()
export const resourceService = new ResourceService()

// Sales
export const customerService = new CustomerService()
export const journeyService = new JourneyService()
export const quoteService = new QuoteService()

export async function initializeServices() {
  // await deviceService.initialize();
  // await legacyService.initialize();
  // await mcpService.initialize();
  await socketService.initialize(io);
  await authService.initializeDefaultUser();

  const collectMachineData = false;

  if (__prod__ || collectMachineData) {
    // await machiningService.initialize();
  }
}