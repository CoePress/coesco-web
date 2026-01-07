import { Router } from "express";

import { protect } from "@/middleware/auth.middleware";

import adminRoutes from "./admin.routes";
import authRoutes from "./auth.routes";
import catalogRoutes from "./catalog.routes";
import coreRoutes from "./core.routes";
import formRoutes from "./form.routes";
import legacyRoutes from "./legacy.routes";
import productionRoutes from "./production.routes";
import salesRoutes from "./sales.routes";
import sandboxRoutes from "./sandbox.routes";
import systemRoutes from "./system.routes";
import webhookRoutes from "./webhook.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/system", systemRoutes);
router.use("/webhooks", webhookRoutes);

router.use(protect);
router.use("/admin", adminRoutes);
router.use("/catalog", catalogRoutes);
router.use("/core", coreRoutes);
router.use("/forms", formRoutes);
router.use("/legacy", legacyRoutes);
router.use("/production", productionRoutes);
router.use("/sales", salesRoutes);
router.use("/sandbox", sandboxRoutes);
export default router;
