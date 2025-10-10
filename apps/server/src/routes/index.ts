// import { Router } from "express";

// import { protect } from "@/middleware/auth.middleware";

// import adminRoutes from "./admin.routes";
// import auditLogRoutes from "./audit-log.routes";
// import authRoutes from "./auth.routes";
// import catalogRoutes from "./catalog.routes";
// import chatRoutes from "./chat.routes";
// import crmRoutes from "./crm.routes";
// import externalInvitationRoutes from "./external-invitation.routes";
// import fileRoutes from "./file.routes";
// import formRoutes from "./form.routes";
// import legacyRoutes from "./legacy.routes";
// import lockRoutes from "./lock.routes";
// import performanceRoutes from "./performance.routes";
// import permissionRoutes from "./permissions.routes";
// import postalCodeRoutes from "./postal-code.routes";
// import productionRoutes from "./production.routes";
// import quoteRoutes from "./quote.routes";
// import settingsRoutes from "./settings.routes";
// import systemRoutes from "./system.routes";
// import tagRoutes from "./tag.routes";
// import testRoutes from "./test.route";

// const router = Router();

// router.use("/auth", authRoutes);
// router.use("/system", systemRoutes);
// router.use("/test", testRoutes);
// router.use("/admin", adminRoutes);
// router.use("/audit", auditLogRoutes);
// router.use("/catalog", catalogRoutes);
// router.use("/external", externalInvitationRoutes);
// router.use("/files", fileRoutes);
// router.use("/forms", formRoutes);
// router.use("/chat", chatRoutes);
// router.use("/crm", crmRoutes);
// router.use("/legacy", legacyRoutes);
// router.use("/locks", lockRoutes);
// router.use("/performance", performanceRoutes);
// router.use("/postal-codes", postalCodeRoutes);
// router.use("/permissions", permissionRoutes);
// router.use("/production", productionRoutes);
// router.use("/quotes", quoteRoutes);
// router.use("/settings", settingsRoutes);
// router.use("/tags", tagRoutes);

// export default router;


import { protect } from "@/middleware/auth.middleware";
import { Router } from "express";

import adminRoutes from "./admin.routes"
import authRoutes from "./auth.routes"
import catalogRoutes from "./catalog.routes"
import coreRoutes from "./core.routes"
import legacyRoutes from "./legacy.routes"
import productionRoutes from "./production.routes"
import salesRoutes from "./sales.routes"
import sandboxRoutes from "./sandbox.routes"
import systemRoutes from "./system.routes"

const router = Router()

router.use("/auth", authRoutes)
router.use("/system", systemRoutes)

router.use(protect);
router.use("/admin", adminRoutes)
router.use("/catalog", catalogRoutes)
router.use("/core", coreRoutes)
router.use("/legacy", legacyRoutes)
router.use("/production", productionRoutes)
router.use("/sales", salesRoutes)
router.use("/sandbox", sandboxRoutes)
export default router