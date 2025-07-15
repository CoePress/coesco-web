import { Router } from "express";

import { protect } from "@/middleware/auth.middleware";
import authRoutes from "./auth.routes";
import emailRoutes from "./email.routes";
import machineRoutes from "./machine.routes";
import employeeRoutes from "./employee.routes";
import companyRoutes from "./company.routes";
import addressRoutes from "./address.routes";
import contactRoutes from "./contact.router";
import journeyRoutes from "./journey.routes";
import quoteRoutes from "./quote.routes";
import itemRoutes from "./item.routes";
import configBuilderRoutes from "./config.routes";
import configurationRoutes from "./configuration.routes";
import classRoutes from "./class.routes";
import optionRoutes from "./option.routes";
import categoryRoutes from "./category.routes";
import systemRoutes from "./system.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/email", protect, emailRoutes);
router.use("/machines", protect, machineRoutes);
router.use("/employees", protect, employeeRoutes);
router.use("/companies", protect, companyRoutes);
router.use("/addresses", protect, addressRoutes);
router.use("/contacts", protect, contactRoutes);
router.use("/journeys", protect, journeyRoutes);
router.use("/quotes", protect, quoteRoutes);
router.use("/items", protect, itemRoutes);
router.use("/config", protect, configBuilderRoutes);
router.use("/configurations", protect, configurationRoutes);
router.use("/classes", protect, classRoutes);
router.use("/options", protect, optionRoutes);
router.use("/categories", protect, categoryRoutes);
router.use("/system", systemRoutes);

export default router;
