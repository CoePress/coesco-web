import { Router } from "express";

import { protect } from "@/middleware/auth.middleware";
import authRoutes from "./auth.routes";
import configRoutes from "./config.routes";
import employeeRoutes from "./employee.routes";
import machineDataRoutes from "./machine-data.routes";
import machineRoutes from "./machine.routes";
import quoteRoutes from "./quote.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/config", protect, configRoutes);
router.use("/employees", protect, employeeRoutes);
router.use("/machines/data", protect, machineDataRoutes);
router.use("/machines", protect, machineRoutes);
router.use("/quotes", protect, quoteRoutes);

export default router;
