import { Router } from "express";

import { productionController } from "@/controllers";

const router = Router();

// Machines
router.post("/machines", productionController.createMachine);
router.get("/machines", productionController.getMachines);

// Machine Statuses
router.get("/machines/statuses", productionController.getMachineStatuses);
router.get("/machines/statuses/:machineStatusId", productionController.getMachineStatus);

// Machines Continued
router.get("/machines/:machineId", productionController.getMachine);
router.patch("/machines/:machineId", productionController.updateMachine);
router.delete("/machines/:machineId", productionController.deleteMachine);

// Misc
router.get("/overview", productionController.getOverview);
router.get("/timeline", productionController.getTimeline);
router.post("/fanuc/reset", productionController.resetFanucAdapter);

export default router;
