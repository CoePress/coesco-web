import { Router } from "express";

import { auditController, deletedRecordsController, employeeController, sessionsController } from "@/controllers";
import { createCrudEntity } from "@/factories";
import { permissionRepository, roleRepository } from "@/repositories";
import {
  CreatePermissionSchema,
  CreateRoleSchema,
  UpdatePermissionSchema,
  UpdateRoleSchema,
} from "@/schemas";

const router = Router();

router.get("/logs", auditController.getAuditLogs);
router.get("/logs/emails", auditController.getEmailLogs);
router.get("/logs/bugs", auditController.getBugReports);
router.get("/logs/login-attempts", auditController.getLoginAttempts);
router.get("/logs/files", auditController.getLogFiles);
router.get("/logs/files/:file", auditController.getLogFile);

router.get("/backups", auditController.getBackupFiles);
router.get("/backups/:file", auditController.getBackupFile);

// Sessions
router.get("/sessions/dashboard-metrics", sessionsController.getDashboardMetrics);
router.get("/sessions", sessionsController.getSessions);
router.get("/sessions/login-history", sessionsController.getLoginHistory);
router.post("/sessions/:id/revoke", sessionsController.revokeSession);
router.post("/sessions/users/:userId/revoke-all", sessionsController.revokeUserSessions);

// Employees
router.post("/employees", employeeController.createEmployee);
router.post("/employees/sync", employeeController.syncEmployees);
router.post("/employees/sync/legacy", employeeController.syncEmployeesFromLegacy);
router.post("/employees/sync/microsoft", employeeController.syncEmployeesFromMicrosoft);
router.get("/employees", employeeController.getEmployees);
router.get("/employees/:employeeId", employeeController.getEmployee);
router.patch("/employees/:employeeId", employeeController.updateEmployee);
router.delete("/employees/:employeeId", employeeController.deleteEmployee);

// Permissions - using CRUD factory
createCrudEntity(router, {
  repository: permissionRepository,
  entityName: "Permission",
  basePath: "/permissions",
  idParam: "permissionId",
  createSchema: CreatePermissionSchema,
  updateSchema: UpdatePermissionSchema,
});

// Roles - using CRUD factory
createCrudEntity(router, {
  repository: roleRepository,
  entityName: "Role",
  basePath: "/roles",
  idParam: "roleId",
  createSchema: CreateRoleSchema,
  updateSchema: UpdateRoleSchema,
});

// Deleted Records
router.get("/deleted-records", deletedRecordsController.getDeletedRecords);
router.get("/deleted-records/models", deletedRecordsController.getModelNames);
router.post("/deleted-records/:modelName/:id/restore", deletedRecordsController.restoreRecord);
router.delete("/deleted-records/:modelName/:id", deletedRecordsController.hardDeleteRecord);

export default router;
