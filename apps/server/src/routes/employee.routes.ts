import { Router } from "express";

import { employeeController } from "@/controllers";

const router = Router();

router.get("/", employeeController.getEmployees);
router.post("/sync", employeeController.syncEmployees);

export default router;
