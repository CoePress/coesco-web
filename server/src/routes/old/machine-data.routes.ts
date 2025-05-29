import { machineDataController } from "@/controllers";
import { Router } from "express";

const router = Router();

router.get("/", machineDataController.getMachineStatuses);
router.get("/overview", machineDataController.getMachineOverview);
router.get("/timeline", machineDataController.getMachineTimeline);

export default router;
