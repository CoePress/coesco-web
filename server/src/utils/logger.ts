import { Request, Response } from "express";
import winston, { Logger } from "winston";

const colors = {
  reset: (text: string): string => `\x1b[0m${text}`,
  cyan: (text: string): string => `\x1b[36m${text}\x1b[0m`,
  green: (text: string): string => `\x1b[32m${text}\x1b[0m`,
  yellow: (text: string): string => `\x1b[33m${text}\x1b[0m`,
  red: (text: string): string => `\x1b[31m${text}\x1b[0m`,
  magenta: (text: string): string => `\x1b[35m${text}\x1b[0m`,
  blue: (text: string): string => `\x1b[34m${text}\x1b[0m`,
  white: (text: string): string => `\x1b[37m${text}\x1b[0m`,
  gray: (text: string): string => `\x1b[90m${text}\x1b[0m`,
};

const winstonLogger: Logger = winston.createLogger({
  format: winston.format.printf(({ message }) => message as string),
  transports: [
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      format: winston.format.printf(({ message }) =>
        (message as string).replace(/\u001b\[\d+m/g, "")
      ),
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
      format: winston.format.printf(({ message }) =>
        (message as string).replace(/\u001b\[\d+m/g, "")
      ),
    }),
    new winston.transports.Console({
      format: winston.format.printf(({ message }) => message as string),
    }),
  ],
});

const uptimeLogger: Logger = winston.createLogger({
  format: winston.format.printf(({ message }) => message as string),
  transports: [
    new winston.transports.File({
      filename: "logs/uptime.log",
      format: winston.format.printf(({ message }) =>
        (message as string).replace(/\u001b\[\d+m/g, "")
      ),
    }),
  ],
});

const formatMessage = (level: string, message: string): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  const timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  return `[${level}] [${timestamp}] ${message}`;
};

const log = (
  level: "info" | "warn" | "error" | "debug",
  colorFunc: (text: string) => string,
  message: string,
  metaData?: any
): void => {
  const formattedMessage = formatMessage(level.toUpperCase(), message);
  const metaStr = metaData ? `\n${JSON.stringify(metaData, null, 2)}` : "";

  winstonLogger.log({
    level,
    message: colorFunc(formattedMessage + metaStr),
  });
};

export const info = (message: string, metaData?: any): void => {
  log("info", colors.cyan, message, metaData);
};

export const success = (message: string, metaData?: any): void => {
  log("info", colors.green, message, metaData);
};

export const warn = (message: string, metaData?: any): void => {
  log("warn", colors.yellow, message, metaData);
};

export const error = (message: string, metaData?: any): void => {
  log("error", colors.red, message, metaData);
};

export const debug = (message: string, metaData?: any): void => {
  log("debug", colors.magenta, message, metaData);
};

export const logRequest = (req: Request, res: Response): void => {
  const { method, url } = req;
  info(`[${method}] [${url}]`);

  res.on("finish", () => {
    const { statusCode } = res;

    if (statusCode >= 400) return;

    const logFn = statusCode >= 300 ? warn : statusCode >= 200 ? success : info;

    logFn(`[${method}] [${url}] [${statusCode}]`);
  });
};

export const startedAt = new Date();

export const logUptime = (message: string, metaData?: any): void => {
  const uptimeData = {
    ...metaData,
    uptime: `${(new Date().getTime() - startedAt.getTime()) / 1000}s`,
  };
  const formattedMessage = formatMessage("UPTIME", message);
  const metaStr = uptimeData ? `\n${JSON.stringify(uptimeData, null, 2)}` : "";

  uptimeLogger.info(colors.blue(formattedMessage + metaStr));
};
