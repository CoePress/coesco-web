import { io } from "@/app";
import { __prod__ } from "@/config/env";

import { AuditService } from "./admin/audit.service";
import { BugReportingService } from "./admin/bug-reporting.service";
import { DeletedRecordsService } from "./admin/deleted-records.service";
import { EmployeeSyncService } from "./admin/employee-sync.service";
import { EmployeeService } from "./admin/employee.service";
import { MicrosoftService } from "./admin/microsoft.service";
import { RoleAssignmentService } from "./admin/role-assignment.service";
import { RolePermissionService } from "./admin/role-permission.service";
import { assetService } from "./core/asset.service";
import { AuthService } from "./core/auth.service";
import { BackupService } from "./core/backup.service";
import { CacheService } from "./core/cache.service";
import { ChatService } from "./core/chat.service";
import { CronService } from "./core/cron.service";
import { EmailLogService } from "./core/email-log.service";
import { EmailService } from "./core/email.service";
import { HealthService } from "./core/health.service";
import { ImageService } from "./core/image.service";
import { LegacyService } from "./core/legacy.service";
import { LockingService } from "./core/locking.service";
import { LoginHistoryService } from "./core/login-history.service";
import { MessageService } from "./core/message.service";
import { SessionService } from "./core/session.service";
import { SocketService } from "./core/socket.service";
import { WebhookService } from "./core/webhook.service";
import { MachineMonitorService } from "./production/machining.service";
import { ResourceMonitoringService } from "./production/resource-monitoring.service";
import { ResourceService } from "./production/resource.service";
import { JourneyContactService } from "./sales/journey-contact.service";
import { PerformanceService } from "./sales/performance.service";
import { QuoteService } from "./sales/quote.service";

// Admin
export const auditService = new AuditService();
export const bugReportingService = new BugReportingService();
export const deletedRecordsService = new DeletedRecordsService();
export const employeeService = new EmployeeService();
export const employeeSyncService = new EmployeeSyncService();
export const microsoftService = new MicrosoftService();
export const roleAssignmentService = new RoleAssignmentService();
export const rolePermissionService = new RolePermissionService();

// Core
export { assetService };
export const authService = new AuthService();
export const cacheService = new CacheService();
export const chatService = new ChatService();
export const emailLogService = new EmailLogService();
export const emailService = new EmailService();
export const healthService = new HealthService();
export const imageService = new ImageService();
export const legacyService = new LegacyService({ enableReconnect: false });
export const lockingService = new LockingService();
export const loginHistoryService = new LoginHistoryService();
export const messageService = new MessageService();
export const sessionService = new SessionService();
export const socketService = new SocketService();
export const webhookService = new WebhookService();
export const backupService = new BackupService();

// Production
export const machiningService = new MachineMonitorService();
export const resourceMonitoringService = new ResourceMonitoringService();
export const resourceService = new ResourceService();

// Sales
export const journeyContactService = new JourneyContactService();
export const performanceService = new PerformanceService();
export const quoteService = new QuoteService();

export const cronService = new CronService();

export async function initializeServices() {
  // await deviceService.initialize();
  await legacyService.initialize();
  // await mcpService.initialize();
  await socketService.initialize(io);
  await authService.initializeDefaultUser();
  await webhookService.initialize();
  await backupService.initialize();
  await cronService.initialize();

  const collectMachineData = true;

  if (__prod__ || collectMachineData) {
    await machiningService.initialize();
  }
}
