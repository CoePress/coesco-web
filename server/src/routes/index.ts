import { Router, Request, Response, RequestHandler } from "express";
import path from "path";
import fs from "fs";

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

router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

router.get("/templates/:slug", (async (req, res) => {
  const { slug } = req.params;
  const templatePath = path.join(
    __dirname,
    "..",
    "templates",
    "emails",
    `${slug}.html`
  );

  console.log(templatePath);

  try {
    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({ error: "Template not found" });
    }

    const template = fs.readFileSync(templatePath, "utf-8");
    res.status(200).send(template);
  } catch (error) {
    console.error("Error reading template:", error);
    res.status(500).json({ error: "Error reading template" });
  }
}) as RequestHandler);

router.use("*", (req, res) => {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

export default router;
