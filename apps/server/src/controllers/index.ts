import { AuditController } from "./admin/audit.controller";
import { BugReportingController } from "./admin/bug-reporting.cotroller";
import { EmployeeController } from "./admin/employee.controller";
import { PermissionController } from "./admin/permission.controller";
import { RoleController } from "./admin/role.controller";
import { SessionsController } from "./admin/sessions.controller";
import { PerformanceSheetController } from "./artifact/performance-sheet.controller";
import { ServiceReportController } from "./artifact/service-report.controller";
import { ConfigurationController } from "./catalog/configuration.controller";
import { OptionController } from "./catalog/option.controller";
import { ProductController } from "./catalog/product.controller";
import { AuthController } from "./core/auth.controller";
import { ChatController } from "./core/chat.controller";
import { FormController } from "./core/form.controller";
import { ImageController } from "./core/image.controller";
import { LegacyController } from "./core/legacy.controller";
import { LockController } from "./core/lock.controller";
import { NoteController } from "./core/note.controller";
import { SearchController } from "./core/search.controller";
import { SettingsController } from "./core/settings.controller";
import { TagController } from "./core/tag.controller";
import { TeamsController } from "./core/teams.controller";
import { WebhookController } from "./core/webhook.controller";
import { ResourceMonitoringController } from "./production/resource-monitoring.controller";
import { ResourceController } from "./production/resource.controller";
import { CustomerController } from "./sales/customer.controller";
import { JourneyController } from "./sales/journey.controller";
import { PerformanceController } from "./sales/performance.controller";
import { QuoteController } from "./sales/quote.controller";

// Admin
export const auditController = new AuditController();
export const bugReportingController = new BugReportingController();
export const employeeController = new EmployeeController();
export const permissionController = new PermissionController();
export const roleController = new RoleController();
export const sessionsController = new SessionsController();

// Artifact
export const performanceSheetController = new PerformanceSheetController();
export const serviceReportController = new ServiceReportController();

// Catalog
export const configurationController = new ConfigurationController();
export const optionController = new OptionController();
export const productController = new ProductController();

// Core
export const authController = new AuthController();
export const chatController = new ChatController();
export const formController = new FormController();
export const imageController = new ImageController();
export const noteController = new NoteController();
export const legacyController = new LegacyController();
export const lockController = new LockController();
export const searchController = new SearchController();
export const settingsController = new SettingsController();
export const tagController = new TagController();
export const teamsController = new TeamsController();
export const webhookController = new WebhookController();

// Production
export const resourceMonitoringController = new ResourceMonitoringController();
export const resourceController = new ResourceController();

// Sales
export const customerController = new CustomerController();
export const journeyController = new JourneyController();
export const performanceController = new PerformanceController();
export const quoteController = new QuoteController();
