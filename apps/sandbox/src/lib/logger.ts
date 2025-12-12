import winston from "winston";
import "winston-daily-rotate-file";
import env from "./env";
import fs from "node:fs";
import path from "node:path";

const { combine, timestamp, printf, colorize, align, errors } = winston.format;

const logsDir = path.resolve("logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const baseFormat = combine(
  errors({ stack: true }),
  timestamp({ format: "YYYY-MM-DD hh:mm:ss.SSS A" }),
  align(),
  printf((info) => {
    const msg = info.stack ?? info.message;
    return `[${info.timestamp}] ${info.level}: ${msg}`;
  }),
);

const consoleFormat = combine(colorize({ all: true }), baseFormat);

const fileFormat = baseFormat;

const rotate = (filename: string, level?: string) =>
  new winston.transports.DailyRotateFile({
    filename: path.join(logsDir, `${filename}-%DATE%.log`),
    datePattern: "YYYY-MM-DD",
    maxFiles: "14d",
    level,
    format: fileFormat,
  });

const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),

    rotate("app-combined"),
    rotate("app-error", "error"),
    rotate("app-warn", "warn"),
    rotate("app-info", "info"),
    rotate("app-debug", "debug"),
  ],
});

export default logger;
