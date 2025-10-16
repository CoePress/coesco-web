import { Router } from "express";

import { auditController, employeeController, permissionController, roleController, sessionsController } from "@/controllers";

const router = Router();

router.get("/logs", auditController.getAuditLogs);
router.get("/logs/emails", auditController.getEmailLogs);
router.get("/logs/bugs", auditController.getBugReports);
router.get("/logs/login-attempts", auditController.getLoginAttempts);
router.get("/logs/files", auditController.getLogFiles);
router.get("/logs/files/:file", auditController.getLogFile);

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

// Permissions
router.post("/permissions", permissionController.createPermission);
router.get("/permissions", permissionController.getPermissions);
router.get("/permissions/:permissionId", permissionController.getPermission);
router.patch("/permissions/:permissionId", permissionController.updatePermission);
router.delete("/permissions/:permissionId", permissionController.deletePermission);

// Roles
router.post("/roles", roleController.createRole);
router.get("/roles", roleController.getRoles);
router.get("/roles/:roleId", roleController.getRole);
router.patch("/roles/:roleId", roleController.updateRole);
router.delete("/roles/:roleId", roleController.deleteRole);

export default router;
