import type { NextFunction, Request, Response } from "express";

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import { env } from "@/config/env";

export class SystemController {
  async getLogFiles(req: Request, res: Response, next: NextFunction) {
    try {
      const files = fs.readdirSync(env.LOGS_DIR).filter(f => f.endsWith(".log") || f.endsWith(".gz"));
      const result = files.sort().reverse();
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getLogFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { file } = req.params;
      const logPath = path.join(env.LOGS_DIR, file);

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
    }
    catch (error) {
      next(error);
    }
  }
}
