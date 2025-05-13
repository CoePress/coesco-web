import { machineController } from "@/controllers";
import { Router } from "express";

const router = Router();

router.get("/", machineController.getMachines);
router.get("/:id", machineController.getMachine);
router.post("/", machineController.createMachine);
router.put("/:id", machineController.updateMachine);
router.delete("/:id", machineController.deleteMachine);
router.get("/:id/statuses", machineController.getMachineStatuses);

export default router;
