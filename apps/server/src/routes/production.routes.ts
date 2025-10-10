import { resourceController, resourceMonitoringController } from "@/controllers";
import { Router } from "express";

const router = Router()

// Machines
router.post("/machines", resourceController.createResource);
router.get("/machines", resourceController.getAllResources);
router.get("/machines/:machineId", resourceController.getResourceById);
router.patch("/machines/:machineId", resourceController.updateResource);
router.delete("/machines/:machineId", resourceController.deleteResource);

// Machine Statuses
router.get("/machine-statuses", resourceMonitoringController.getMachineStatuses);
router.get("/machine-statuses/:machineStatusId", resourceMonitoringController.getMachineStatus);

// Misc
router.get("/overview", resourceMonitoringController.getOverview);
router.get("/timeline", resourceMonitoringController.getTimeline);
router.post("/fanuc/reset", resourceMonitoringController.resetFanucAdapter);

export default router