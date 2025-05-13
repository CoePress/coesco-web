import { machineDataController } from "@/controllers";
import { Router } from "express";

const router = Router();

router.get("/", machineDataController.getMachineStatuses);

export default router;
