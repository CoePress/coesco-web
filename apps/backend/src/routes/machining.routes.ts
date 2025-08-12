import { Router } from "express";

const router = Router();

// Machines
router.post("/machines", () => { });
router.get("/machines", () => { });
router.get("/machines/:machineId", () => { });
router.patch("/machines/:machineId", () => { });
router.delete("/machines/:machineId", () => { });

// Machine Statuses
router.post("/machines/:machineId/statuses", () => { });
router.get("/machines/:machineId/statuses", () => { });
router.get("/statuses", () => { });
router.get("/statuses/:statusId", () => { });

export default router;
