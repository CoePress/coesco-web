import { Router } from "express";

import authRoutes from "./auth.routes";
import catalogRoutes from "./catalog.routes";
import chatRoutes from "./chat.routes";
import employeeRoutes from "./employee.routes";
import machiningRoutes from "./machining.routes";
import salesRoutes from "./sales.routes";
import systemRoutes from "./system.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/catalog", catalogRoutes);
router.use("/chat", chatRoutes);
router.use("/employees", employeeRoutes);
router.use("/machining", machiningRoutes);
router.use("/sales", salesRoutes);
router.use("/system", systemRoutes);

export default router;
