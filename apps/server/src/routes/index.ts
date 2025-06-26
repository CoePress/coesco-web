import { Router, RequestHandler } from "express";
import path from "path";
import fs from "fs";
import puppeteer from "puppeteer";

import { __dev__ } from "@/config/config";
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
import configBuilderRoutes from "./config-builder.routes";

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

// Widget
router.get("/widget.html", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "assets", "widgets", "widget.html"));
});

// System
router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

router.get("/templates/:slug", (async (req, res) => {
  const { slug } = req.params;
  const templatePath = path.join(
    __dirname,
    "..",
    "templates",
    "documents",
    `${slug}.html`
  );

  try {
    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({ error: "Template not found" });
    }

    const template = fs.readFileSync(templatePath, "utf-8");
    const tempHtmlPath = path.join(__dirname, "..", "templates", "temp.html");
    fs.writeFileSync(tempHtmlPath, template);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto(`file://${tempHtmlPath}`, {
      waitUntil: "networkidle0",
    });

    const pdf = await page.pdf({
      format: "Letter",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "1in",
        right: "1in",
        bottom: "1in",
        left: "1in",
      },
    });

    await browser.close();
    fs.unlinkSync(tempHtmlPath); // Clean up temp file

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${slug}.pdf`);
    res.send(Buffer.from(pdf));
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Error generating PDF" });
  }
}) as RequestHandler);

router.use("*", (req, res) => {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

export default router;
