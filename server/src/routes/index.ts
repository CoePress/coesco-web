import { Router } from "express";

import authRoutes from "./auth.routes";
import employeeRoutes from "./employee.routes";
import { protect } from "@/middleware/auth.middleware";

const router = Router();

router.use("/auth", authRoutes);
router.use("/employee", protect, employeeRoutes);

export default router;
