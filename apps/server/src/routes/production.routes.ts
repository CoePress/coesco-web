import { Router } from "express";

import { productionController } from "@/controllers";

const router = Router();

// Machines
router.post("/machines", productionController.createMachine);
router.get("/machines", productionController.getMachines);
router.get("/machines/:machineId", productionController.getMachine);
router.patch("/machines/:machineId", productionController.updateMachine);
router.delete("/machines/:machineId", productionController.deleteMachine);

// Machine Statuses
router.get("/statuses", productionController.getMachineStatuses);
router.get("/statuses/:machineStatusId", productionController.getMachineStatus);

// Misc
router.get("/overview", productionController.getOverview);
router.get("/timeline", productionController.getTimeline);
router.post("/fanuc/reset", productionController.resetFanucAdapter);

export default router;
