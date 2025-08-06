import fs from "node:fs";
import path from "node:path";
import { createLogger, format, transports } from "winston";

const logDir = path.resolve("logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
  ),
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
    new transports.File({ filename: path.join(logDir, "combined.log") }),
    new transports.File({ filename: path.join(logDir, "error.log"), level: "error" }),
  ],
});

export default logger;
