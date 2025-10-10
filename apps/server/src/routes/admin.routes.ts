import { auditController, employeeController } from "@/controllers";
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

export default router