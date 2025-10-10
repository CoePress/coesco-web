// import { AdminController } from "./admin.controller";
// import { AuditLogController } from "./audit-log.controller";
// import { AuthController } from "./auth.controller";
// import { ChatController } from "./chat.controller";
// import { ConfigurationController } from "./configuration.controller";
// import { CRMController } from "./crm.controller";
// import { ExternalInvitationController } from "./external-invitation.controller";
// import { FormController } from "./form.controller";
// import { LegacyController } from "./legacy.controller";
// import { LockController } from "./lock.controller";
// import { PerformanceController } from "./performance.controller";
// import { PostalCodeController } from "./postal-code.controller";
// import { ProductionController } from "./production.controller";
// import { QuoteController } from "./quote.controller";
// import { SettingsController } from "./settings.controller";
// import { SystemController } from "./system.controller";
// import { TagController } from "./tag.controller";

import { AuditController } from "./admin/audit.controller";
import { BugReportingController } from "./admin/bug-reporting.cotroller";
import { EmployeeController } from "./admin/employee.controller";
import { PermissionController } from "./admin/permission.controller";
import { AuthController } from "./auth.controller";
import { LegacyController } from "./core/legacy.controller";
import { LockController } from "./core/lock.controller";
import { CustomerController } from "./sales/customer.controller";
import { JourneyController } from "./sales/journey.controller";
import { QuoteController } from "./sales/quote.controller";
import { ResourceMonitoringController } from "./production/resource-monitoring.controller";
import { ResourceController } from "./production/resource.controller";
import { SettingsController } from "./core/settings.controller";
import { PerformanceSheetController } from "./artifact/performance-sheet.controller";
import { ServiceReportController } from "./artifact/service-report.controller";
import { ConfigurationController } from "./catalog/configuration.controller";
import { ProductController } from "./catalog/product.controller";
import { OptionController } from "./catalog/option.controller";

// export const adminController = new AdminController();
// export const chatController = new ChatController();
// export const crmController = new CRMController();
// export const externalInvitationController = new ExternalInvitationController();
// export const formController = new FormController();
// export const legacyController = new LegacyController();
// export const performanceController = new PerformanceController();
// export const postalCodeController = new PostalCodeController();
// export const productionController = new ProductionController();
// export const quoteController = new QuoteController();
// export const settingsController = new SettingsController();
// export const systemController = new SystemController();
// export const tagController = new TagController();

// Admin
export const auditController = new AuditController()
export const bugReportingController = new BugReportingController()
export const employeeController = new EmployeeController()
export const permissionController = new PermissionController()

// Artifact
export const performanceSheetController = new PerformanceSheetController()
export const serviceReportController = new ServiceReportController()

// Catalog
export const configurationController = new ConfigurationController()
export const optionController = new OptionController()
export const productController = new ProductController()

// Core
export const authController = new AuthController()
export const legacyController = new LegacyController()
export const lockController = new LockController()
export const settingsController = new SettingsController()

// Production
export const resourceMonitoringController = new ResourceMonitoringController()
export const resourceController = new ResourceController()

// Sales
export const customerController = new CustomerController()
export const journeyController = new JourneyController()
export const quoteController = new QuoteController()