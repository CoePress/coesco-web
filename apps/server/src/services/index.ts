// import { io } from "@/app";
// import { __prod__ } from "@/config/env";

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

// import { AgentService } from "./business/agent.service";
// import { AuditLogBusinessService } from "./business/audit-log.service";
// import { DeviceService } from "./business/device.service";
// import { EmployeeSyncService } from "./business/employee-sync.service";
// import { FormManagerService } from "./business/form-manager.service";
// import { LegacyService } from "./business/legacy.service";
// import { LocationService } from "./business/location.service";
// import { MachineMonitorService } from "./business/machining.service";
// import { MicrosoftService } from "./business/microsoft.service";
// import { QuotingService } from "./business/quoting.service";
// import { SettingsService } from "./business/settings.service";
// import { AuthService } from "./core/auth.service";
// import { CacheService } from "./core/cache.service";
// import { EmailService } from "./core/email.service";
// import { ExternalInvitationService } from "./core/external-invitation.service";
// import { FileStorageService } from "./core/file-storage.service";
// import { JiraService } from "./core/jira.service";
// import { LockingService } from "./core/locking.service";
// import { MCPService } from "./core/mcp.service";
// import { PermissionService } from "./core/permission.service";
// import { SocketService } from "./core/socket.service";

// // Business
// export const agentService = new AgentService();
// export const auditLogBusinessService = new AuditLogBusinessService();
// export const deviceService = new DeviceService();
// export const employeeSyncService = new EmployeeSyncService();
// export const formManagerService = new FormManagerService();
// export const legacyService = new LegacyService();
// export const locationService = new LocationService();
// export const machiningService = new MachineMonitorService();
// export const microsoftService = new MicrosoftService();
// export const quotingService = new QuotingService();
// export const settingsService = new SettingsService();

// // Core
// export const authService = new AuthService();
// export const cacheService = new CacheService();
// export const emailService = new EmailService();
// export const externalInvitationService = new ExternalInvitationService();
// export const fileStorageService = new FileStorageService();
// export const jiraService = new JiraService();
// export const lockingService = new LockingService();
// export const mcpService = new MCPService();
// export const permissionService = new PermissionService();
// export const socketService = new SocketService();

// export async function initializeServices() {
//   await deviceService.initialize();
//   await legacyService.initialize();
//   await mcpService.initialize();
//   await socketService.initialize(io);
//   await authService.initializeDefaultUser();

//   const collectMachineData = false;

//   if (__prod__ || collectMachineData) {
//     await machiningService.initialize();
//   }
// }


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
export const cacheService = new CacheService()
export const emailServicce = new EmailService()
export const lockingService = new LockingService()
export const socketService = new SocketService()

// Production
export const resourceMonitoringService = new ResourceMonitoringSerivce()
export const resourceService = new ResourceService()

// Sales
export const customerService = new CustomerService()
export const journeyService = new JourneyService()
export const quoteService = new QuoteService()

// Time Clock