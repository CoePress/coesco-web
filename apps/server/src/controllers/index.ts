import { AuditController } from "./admin/audit.controller";
import { BugReportingController } from "./admin/bug-reporting.cotroller";
import { EmployeeController } from "./admin/employee.controller";
import { PermissionController } from "./admin/permission.controller";
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
import { TagController } from "./core/tag.controller";
import { AuthController } from "./core/auth.controller";

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
export const tagController = new TagController()

// Production
export const resourceMonitoringController = new ResourceMonitoringController()
export const resourceController = new ResourceController()

// Sales
export const customerController = new CustomerController()
export const journeyController = new JourneyController()
export const quoteController = new QuoteController()