import { Router } from "express";
import { systemController } from "@/controllers";
import { protect } from "@/middleware/auth.middleware";

const router = Router();

router.get("/health", systemController.health);
router.get("/entities", protect, systemController.getEntityTypes);
router.get("/entities/:entityType", protect, systemController.getEntityFields);

router.use("*", systemController.notFound);

export default router;
