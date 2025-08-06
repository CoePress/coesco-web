import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import logger from "../utils/logger";

const router = Router();

const LOGS_DIR = path.resolve("logs");

router.get("/logs", (_req, res) => {
  const files = fs.readdirSync(LOGS_DIR).filter(f => f.endsWith(".log") || f.endsWith(".gz"));
  res.json(files.sort().reverse());
});

router.get("/logs/:file", async (req, res) => {
  const { file } = req.params;
  const logPath = path.join(LOGS_DIR, file);

  if (!fs.existsSync(logPath)) {
    return res.status(404).json({ error: "Log not found" });
  }

  const isGzipped = logPath.endsWith(".gz");

  if (isGzipped) {
    const stream = fs.createReadStream(logPath).pipe(zlib.createGunzip());
    res.setHeader("Content-Type", "text/plain");
    return stream.pipe(res);
  }
  else {
    return fs.createReadStream(logPath).pipe(res);
  }
});

router.get("/", (_req, res) => {
  logger.info("Health check hit");
  res.send("OK");
});

export default router;
