import { Router } from "express";

import { adminController } from "@/controllers";

const router = Router();

// Devices
router.post("/devices", adminController.createDevice);
router.get("/devices", adminController.getDevices);
router.get("/devices/:deviceId", adminController.getDevice);
router.patch("/devices/:deviceId", adminController.updateDevice);
router.delete("/devices/:deviceId", adminController.deleteDevice);

// Employees
router.post("/employees", adminController.createEmployee);
router.post("/employees/sync", adminController.syncEmployees);
router.post("/employees/sync/legacy", adminController.syncEmployeesFromLegacy);
router.post("/employees/sync/microsoft", adminController.syncEmployeesFromMicrosoft);
router.get("/employees/sync/stats", adminController.getEmployeeSyncStats);
router.get("/employees", adminController.getEmployees);
router.get("/employees/:employeeId", adminController.getEmployee);
router.patch("/employees/:employeeId", adminController.updateEmployee);
router.delete("/employees/:employeeId", adminController.deleteEmployee);

// Permissions
router.post("/permissions", adminController.createPermission);
router.get("/permissions", adminController.getPermissions);
router.get("/permissions/:permissionId", adminController.getPermission);
router.patch("/permissions/:permissionId", adminController.updatePermission);
router.delete("/permissions/:permissionId", adminController.deletePermission);

// Roles
router.post("/roles", adminController.createRole);
router.get("/roles", adminController.getRoles);
router.get("/roles/:roleId", adminController.getRole);
router.patch("/roles/:roleId", adminController.updateRole);
router.delete("/roles/:roleId", adminController.deleteRole);

// Role Permissions
router.post("/role-permissions", adminController.createRolePermission);
router.get("/role-permissions", adminController.getRolePermissions);
router.get("/role-permissions/:rolePermissionId", adminController.getRolePermission);
router.patch("/role-permissions/:rolePermissionId", adminController.updateRolePermission);
router.delete("/role-permissions/:rolePermissionId", adminController.deleteRolePermission);

// Role Assignments
router.post("/role-assignments", adminController.createRoleAssignment);
router.get("/role-assignments", adminController.getRoleAssignments);
router.get("/role-assignments/:roleAssignmentId", adminController.getRoleAssignment);
router.patch("/role-assignments/:roleAssignmentId", adminController.updateRoleAssignment);
router.delete("/role-assignments/:roleAssignmentId", adminController.deleteRoleAssignment);

// Permission Exceptions
router.post("/permission-exceptions", adminController.createPermissionException);
router.get("/permission-exceptions", adminController.getPermissionExceptions);
router.get("/permission-exceptions/:permissionExceptionId", adminController.getPermissionException);
router.patch("/permission-exceptions/:permissionExceptionId", adminController.updatePermissionException);
router.delete("/permission-exceptions/:permissionExceptionId", adminController.deletePermissionException);

export default router;
