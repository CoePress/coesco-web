import { Router } from "express";

import { protect } from "@/middleware/auth.middleware";
import authRoutes from "./auth.routes";
import employeeRoutes from "./employee.routes";
import machineDataRoutes from "./machine-data.routes";
import machineRoutes from "./machine.routes";
import quoteRoutes from "./quote.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/employee", protect, employeeRoutes);
router.use("/machine-data", protect, machineDataRoutes);
router.use("/machine", protect, machineRoutes);
router.use("/quote", protect, quoteRoutes);

export default router;
