import { Request, Response } from "express";
import { appendFile, mkdir } from "fs/promises";
import { join } from "path";

const colors = {
  info: (text: string) => `\x1b[36m${text}\x1b[0m`, // cyan
  success: (text: string) => `\x1b[32m${text}\x1b[0m`, // green
  warn: (text: string) => `\x1b[33m${text}\x1b[0m`, // yellow
  error: (text: string) => `\x1b[31m${text}\x1b[0m`, // red
  debug: (text: string) => `\x1b[35m${text}\x1b[0m`, // magenta
};

const getTimestamp = () => {
  return new Date().toISOString().replace("T", " ").split(".")[0];
};

const getDateString = () => {
  return new Date().toISOString().split("T")[0];
};

class Logger {
  private async logToFile(message: string, isError = false) {
    const date = getDateString();
    const logDir = join("logs");

    try {
      await mkdir(logDir, { recursive: true });

      await appendFile(join(logDir, `combined-${date}.log`), message + "\n");

      if (isError) {
        await appendFile(join(logDir, `error-${date}.log`), message + "\n");
      }
    } catch (err) {
      console.error("Failed to write to log file:", err);
    }
  }

  private log(
    level: keyof typeof colors,
    message: string,
    metaData?: any
  ): void {
    const timestamp = getTimestamp();
    const formattedMessage = `[${level.toUpperCase()}] [${timestamp}] ${message} ${
      metaData ? JSON.stringify(metaData) : ""
    }`;

    console.log(colors[level](formattedMessage));

    this.logToFile(formattedMessage, level === "error").catch(console.error);
  }

  info(message: string, metaData?: any): void {
    this.log("info", message, metaData);
  }

  success(message: string, metaData?: any): void {
    this.log("success", message, metaData);
  }

  warn(message: string, metaData?: any): void {
    this.log("warn", message, metaData);
  }

  error(message: string, metaData?: any): void {
    this.log("error", message, metaData);
  }

  debug(message: string, metaData?: any): void {
    this.log("debug", message, metaData);
  }

  request(req: Request, res: Response): void {
    const { method, url } = req;
    const startTime = Date.now();

    this.info(`${method} ${url}`);

    res.on("finish", () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;
      const errorMessage = res.locals.errorMessage;
      const message = `${method} ${url} ${statusCode} ${duration}ms${
        errorMessage ? ` - ${errorMessage}` : ""
      }`;

      if (statusCode >= 500 || statusCode === 401 || statusCode === 404) {
        this.error(message);
      } else if (statusCode >= 400 || statusCode === 304) {
        this.warn(message);
      } else if (statusCode >= 300) {
        this.info(message);
      } else {
        this.success(message);
      }
    });
  }
}

export const logger = new Logger();
