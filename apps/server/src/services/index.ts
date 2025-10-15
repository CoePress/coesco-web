import { io } from "@/app";
import { __prod__ } from "@/config/env";

import { AuditService } from "./admin/audit.service";
import { BugReportingService } from "./admin/bug-reporting.service";
import { EmployeeSyncService } from "./admin/employee-sync.service";
import { EmployeeService } from "./admin/employee.service";
import { MicrosoftService } from "./admin/microsoft.service";
import { PermissionService } from "./admin/permission.service";
import { RoleAssignmentService } from "./admin/role-assignment.service";
import { RolePermissionService } from "./admin/role-permission.service";
import { RoleService } from "./admin/role.service";
import { ConfigurationService } from "./catalog/configuration.service";
import { OptionService } from "./catalog/option.service";
import { ProductService } from "./catalog/product.service";
import { AuthService } from "./core/auth.service";
import { CacheService } from "./core/cache.service";
import { ChatService } from "./core/chat.service";
import { EmailLogService } from "./core/email-log.service";
import { EmailService } from "./core/email.service";
import { LegacyService } from "./core/legacy.service";
import { LockingService } from "./core/locking.service";
import { MessageService } from "./core/message.service";
import { SocketService } from "./core/socket.service";
import { TagService } from "./core/tag.service";
import { ResourceMonitoringService } from "./production/resource-monitoring.service";
import { ResourceService } from "./production/resource.service";
import { AddressService } from "./sales/address.service";
import { ContactService } from "./sales/contact.service";
import { CustomerService } from "./sales/customer.service";
import { JourneyService } from "./sales/journey.service";
import { QuoteService } from "./sales/quote.service";

// Admin
export const auditService = new AuditService();
export const bugReportingService = new BugReportingService();
export const employeeService = new EmployeeService();
export const employeeSyncService = new EmployeeSyncService();
export const microsoftService = new MicrosoftService();
export const permissionService = new PermissionService();
export const roleService = new RoleService();
export const roleAssignmentService = new RoleAssignmentService();
export const rolePermissionService = new RolePermissionService();

// Catalog
export const configurationService = new ConfigurationService();
export const optionService = new OptionService();
export const productService = new ProductService();

// Core
export const authService = new AuthService();
export const cacheService = new CacheService();
export const chatService = new ChatService();
export const emailLogService = new EmailLogService();
export const emailService = new EmailService();
export const legacyService = new LegacyService();
export const lockingService = new LockingService();
export const messageService = new MessageService();
export const socketService = new SocketService();
export const tagService = new TagService();

// Production
export const resourceMonitoringService = new ResourceMonitoringService();
export const resourceService = new ResourceService();

// Sales
export const addressService = new AddressService();
export const contactService = new ContactService();
export const customerService = new CustomerService();
export const journeyService = new JourneyService();
export const quoteService = new QuoteService();

export async function initializeServices() {
  // await deviceService.initialize();
  await legacyService.initialize();
  // await mcpService.initialize();
  await socketService.initialize(io);
  await authService.initializeDefaultUser();

  const collectMachineData = false;

  if (__prod__ || collectMachineData) {
    // await machiningService.initialize();
  }
}
