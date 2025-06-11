import ejs from "ejs";
import fs from "fs";
import nodemailer from "nodemailer";
import path from "path";

import { IDateRange } from "@/types/schema.types";
import { NextFunction, Request, Response } from "express";
import { toZonedTime } from "date-fns-tz";
import {
  addMilliseconds,
  differenceInDays,
  differenceInMilliseconds,
  parse,
} from "date-fns";
import { config } from "@/config/config";
import { logger } from "./logger";
import { FanucControllerMode, FanucExecutionMode } from "@/types/enum.types";

export const asyncHandler =
  (fn: any) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export const send = async (
  to: string | string[],
  subject: string,
  html: string
) => {
  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    tls: { rejectUnauthorized: true },
  });

  try {
    return await transporter.sendMail({
      from: '"CPEC" <cpec@cpec.com>',
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html,
    });
  } catch (err: any) {
    logger.error(`Email error: ${err.message}`);
    throw err;
  }
};

export const sendEmail = async (
  templateName: string,
  data: Record<string, any>,
  to: string | string[],
  subject: string
): Promise<nodemailer.SentMessageInfo> => {
  const templatePath = path.resolve("templates", `${templateName}.ejs`);
  const template = fs.readFileSync(templatePath, "utf-8");
  const html = ejs.render(template, data);

  return send(to, subject, html);
};

export const getBlockedIps = (): string[] => {
  const blockedIps = fs.readFileSync(
    path.resolve(__dirname, "../config/blocked.txt"),
    "utf-8"
  );

  return blockedIps.split("\n");
};

export const isBlockedIp = (ip: string): boolean => {
  const blockedIps = getBlockedIps();
  return blockedIps.includes(ip);
};

export const addBlockedIp = (ip: string): void => {
  const blockedIps = getBlockedIps();
  blockedIps.push(ip);
  fs.writeFileSync(
    path.resolve(__dirname, "../config/blocked.txt"),
    blockedIps.join("\n")
  );
};

export const expandFanucControllerMode = (
  mode: FanucControllerMode
): string => {
  switch (mode) {
    case FanucControllerMode.MDI:
      return "Manual Data Input";
    case FanucControllerMode.MEM:
      return "Memory";
    case FanucControllerMode.UNDEFINED:
      return "Undefined";
    case FanucControllerMode.EDIT:
      return "Edit";
    case FanucControllerMode.HND:
      return "Handle";
    case FanucControllerMode.JOG:
      return "Jog";
    case FanucControllerMode.T_JOG:
      return "Tool Jog";
    case FanucControllerMode.T_HND:
      return "Tool Handle";
    case FanucControllerMode.INC:
      return "Increment";
    case FanucControllerMode.REF:
      return "Reference";
    case FanucControllerMode.RMT:
      return "Remote";
    case FanucControllerMode.UNAVAILABLE:
      return "Unavailable";
    default:
      return "Unknown";
  }
};

export const expandFanucExecutionMode = (mode: FanucExecutionMode): string => {
  switch (mode) {
    case FanucExecutionMode.UNDEFINED:
      return "Undefined";
    case FanucExecutionMode.STOP:
      return "Stop";
    case FanucExecutionMode.HOLD:
      return "Hold";
    case FanucExecutionMode.STRT:
      return "Start";
    case FanucExecutionMode.MSTR:
      return "Master";
    case FanucExecutionMode.UNAVAILABLE:
      return "Unavailable";
    default:
      return "Unknown";
  }
};

export const hasThisChanged = async (a: any, b: any): Promise<boolean> => {
  if (typeof a !== typeof b) return false;
  if (typeof a === "object") {
    return JSON.stringify(a) !== JSON.stringify(b);
  }
  return a !== b;
};

export const createDateRange = (
  startDate: string,
  endDate: string
): IDateRange => {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(endDate)
  ) {
    throw new Error("Invalid date format. Use YYYY-MM-DD");
  }

  if (startDate > endDate) {
    throw new Error("Start date must be before end date");
  }

  const timeZone = "America/New_York";

  const startDateEST = toZonedTime(
    parse(`${startDate} 00:00:00`, "yyyy-MM-dd HH:mm:ss", new Date()),
    timeZone
  );

  const endDateEST = toZonedTime(
    parse(`${endDate} 23:59:59.999`, "yyyy-MM-dd HH:mm:ss.SSS", new Date()),
    timeZone
  );

  const totalDuration = differenceInMilliseconds(endDateEST, startDateEST) + 1;
  const totalDays = differenceInDays(endDateEST, startDateEST) + 1;

  const previousStart = toZonedTime(
    addMilliseconds(startDateEST, -totalDuration),
    timeZone
  );

  const previousEnd = toZonedTime(addMilliseconds(startDateEST, -1), timeZone);

  return {
    startDate: startDateEST,
    endDate: endDateEST,
    duration: totalDuration,
    totalDays: totalDays,
    previousStartDate: previousStart,
    previousEndDate: previousEnd,
  };
};

export const validateUuid = (uuid: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    uuid
  );
};

export const generateApiKey = ({
  length = 32,
  prefix = "",
  segments = 4,
  segmentLength = 8,
  encoding = "base64",
} = {}) => {
  const crypto = require("crypto");

  const bytesNeeded = Math.ceil((length * 3) / 4);
  const randomBytes = crypto.randomBytes(bytesNeeded);

  let randomString;
  switch (encoding.toLowerCase()) {
    case "hex":
      randomString = randomBytes.toString("hex");
      break;
    case "url-safe":
      randomString = randomBytes
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
      break;
    case "base64":
    default:
      randomString = randomBytes.toString("base64");
      break;
  }

  randomString = randomString.slice(0, length);

  if (segments > 1 && segmentLength > 0) {
    const formattedSegments = [];
    for (
      let i = 0;
      i < segments && i * segmentLength < randomString.length;
      i++
    ) {
      formattedSegments.push(
        randomString.slice(i * segmentLength, (i + 1) * segmentLength)
      );
    }
    randomString = formattedSegments.join("-");
  }

  return prefix ? `${prefix}-${randomString}` : randomString;
};
