import { Router } from "express";

import { auditLogController } from "@/controllers";

const router = Router();

router.get("/", auditLogController.getAuditLogs);
router.get("/:auditLogId", auditLogController.getAuditLog);

export default router;
