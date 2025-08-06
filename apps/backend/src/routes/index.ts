import { Router } from "express";

import authRoutes from "./auth.routes";
import employeeRoutes from "./employee.routes";
import systemRoutes from "./system.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/employees", employeeRoutes);
router.use("/system", systemRoutes);

export default router;
