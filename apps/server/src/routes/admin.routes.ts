import { auditController, employeeController, permissionController, roleController } from "@/controllers";
import { Router } from "express";

const router = Router()

router.get("/logs", auditController.getAuditLogs);

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

export default router