import { machineController } from "@/controllers";
import { Router } from "express";

const router = Router();

router.get("/", machineController.getAll);
router.get("/statuses", machineController.getMachineStatuses);
router.get("/overview", machineController.getMachinesOverview);
router.get("/timeline", machineController.getMachinesTimeline);
router.get("/:id", machineController.getById);
router.get("/:id/statuses", machineController.getMachineStatuses);

router.post("/", machineController.create);

router.put("/:id", machineController.update);

router.delete("/:id", machineController.delete);

export default router;
