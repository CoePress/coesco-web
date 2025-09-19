import { Router } from "express";

import { protect } from "@/middleware/auth.middleware";

import adminRoutes from "./admin.routes";
import auditLogRoutes from "./audit-log.routes";
import authRoutes from "./auth.routes";
import catalogRoutes from "./catalog.routes";
import chatRoutes from "./chat.routes";
import crmRoutes from "./crm.routes";
import fileStoreRoutes from "./file-store.routes";
import formRoutes from "./form.routes";
import legacyRoutes from "./legacy.routes";
import lockRoutes from "./lock.routes";
import performanceRoutes from "./performance.routes";
import postalCodeRoutes from "./postal-code.routes";
import permissionRoutes from "./permissions.routes";
import productionRoutes from "./production.routes";
import quoteRoutes from "./quote.routes";
import systemRoutes from "./system.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/system", systemRoutes);
router.use(protect); // all routes below this are protected
router.use("/admin", adminRoutes);
router.use("/audit", auditLogRoutes);
router.use("/catalog", catalogRoutes);
router.use("/files", fileStoreRoutes);
router.use("/forms", formRoutes);
router.use("/chat", chatRoutes);
router.use("/crm", crmRoutes);
router.use("/legacy", legacyRoutes);
router.use("/locks", lockRoutes);
router.use("/performance", performanceRoutes);
router.use("/postal-codes", postalCodeRoutes);
router.use("/permissions", permissionRoutes);
router.use("/production", productionRoutes);
router.use("/quotes", quoteRoutes);

export default router;
