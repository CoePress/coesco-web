import { employeeController } from "@/controllers";
import { Router } from "express";

const router = Router();

router.get("/", employeeController.getEmployees);
router.get("/:id", employeeController.getEmployee);
router.post("/", employeeController.createEmployee);
router.put("/:id", employeeController.updateEmployee);
router.delete("/:id", employeeController.deleteEmployee);
router.post("/sync", employeeController.syncEmployees);

export default router;
