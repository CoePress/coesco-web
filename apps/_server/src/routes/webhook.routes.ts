import { Router } from "express";

import { webhookController } from "@/controllers";

const router = Router();

router.post("/:event", webhookController.handleWebhook);
router.get("/events", webhookController.getRegisteredEvents);

export default router;
