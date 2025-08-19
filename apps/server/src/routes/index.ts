import { Router } from "express";

import { protect } from "@/middleware/auth.middleware";

import authRoutes from "./auth.routes";
import catalogRoutes from "./catalog.routes";
import chatRoutes from "./chat.routes";
import crmRoutes from "./crm.routes";
import employeeRoutes from "./employee.routes";
import performanceRoutes from "./performance.routes";
import productionRoutes from "./production.routes";
import quoteRoutes from "./quote.routes";
import systemRoutes from "./system.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/system", systemRoutes);
router.use(protect);
router.use("/catalog", catalogRoutes);
router.use("/chat", chatRoutes);
router.use("/crm", crmRoutes);
router.use("/employees", employeeRoutes);
router.use("/performance", performanceRoutes);
router.use("/production", productionRoutes);
router.use("/quotes", quoteRoutes);

export default router;
