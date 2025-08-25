import { Router } from "express";

import { deviceController } from "@/controllers";

const router = Router();

// Devices
router.post("/devices", deviceController.createDevice);
router.get("/devices", deviceController.getDevices);
router.get("/devices/:deviceId", deviceController.getDevice);
router.patch("/devices/:deviceId", deviceController.updateDevice);
router.delete("/devices/:deviceId", deviceController.deleteDevice);

// Testing
router.post("/test-ntfy", deviceController.sendTestNotification);

export default router;
