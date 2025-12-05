import { AuditController } from "./admin/audit.controller";
import { BugReportingController } from "./admin/bug-reporting.cotroller";
import { DeletedRecordsController } from "./admin/deleted-records.controller";
import { EmployeeController } from "./admin/employee.controller";
import { SessionsController } from "./admin/sessions.controller";
import { PerformanceSheetController } from "./artifact/performance-sheet.controller";
import { ServiceReportController } from "./artifact/service-report.controller";
import { AssetController } from "./core/asset.controller";
import { AuthController } from "./core/auth.controller";
import { ChatController } from "./core/chat.controller";
import { FormController } from "./core/form.controller";
import { ImageController } from "./core/image.controller";
import { LegacyController } from "./core/legacy.controller";
import { LockController } from "./core/lock.controller";
import { SearchController } from "./core/search.controller";
import { SettingsController } from "./core/settings.controller";
import { WebhookController } from "./core/webhook.controller";
import { ResourceMonitoringController } from "./production/resource-monitoring.controller";
import { ResourceController } from "./production/resource.controller";
import { PerformanceController } from "./sales/performance.controller";
import { QuoteController } from "./sales/quote.controller";

// Admin
export const auditController = new AuditController();
export const bugReportingController = new BugReportingController();
export const deletedRecordsController = new DeletedRecordsController();
export const employeeController = new EmployeeController();
export const sessionsController = new SessionsController();

// Artifact
export const performanceSheetController = new PerformanceSheetController();
export const serviceReportController = new ServiceReportController();

// Core
export const assetController = new AssetController();
export const authController = new AuthController();
export const chatController = new ChatController();
export const formController = new FormController();
export const imageController = new ImageController();
export const legacyController = new LegacyController();
export const lockController = new LockController();
export const searchController = new SearchController();
export const settingsController = new SettingsController();
export const webhookController = new WebhookController();

// Production
export const resourceMonitoringController = new ResourceMonitoringController();
export const resourceController = new ResourceController();

// Sales
export const performanceController = new PerformanceController();
export const quoteController = new QuoteController();
