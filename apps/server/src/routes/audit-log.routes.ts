import { Router } from "express";

import { auditLogController } from "@/controllers";

const router = Router();

router.post("/audit-logs", auditLogController.createAuditLog);
router.get("/audit-logs", auditLogController.getAuditLogs);
router.get("/audit-logs/:auditLogId", auditLogController.getAuditLog);
router.patch("/audit-logs/:auditLogId", auditLogController.updateAuditLog);
router.delete("/audit-logs/:auditLogId", auditLogController.deleteAuditLog);

export default router;
