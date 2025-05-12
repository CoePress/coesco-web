import ejs from "ejs";
import fs from "fs";
import nodemailer from "nodemailer";
import path from "path";

import {
  FanucControllerMode,
  FanucExecutionMode,
  IDateRange,
} from "@/types/schema.types";
import { NextFunction, Request, Response } from "express";
import { toZonedTime } from "date-fns-tz";
import { addMilliseconds, differenceInMilliseconds, parse } from "date-fns";
import { config } from "@/config/config";
import { logger } from "./logger";
import { IQueryBuilderResult, IQueryParams } from "@/types/api.types";

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

  const previousStart = toZonedTime(
    addMilliseconds(startDateEST, -totalDuration),
    timeZone
  );

  const previousEnd = toZonedTime(addMilliseconds(startDateEST, -1), timeZone);

  return {
    startDate: startDateEST,
    endDate: endDateEST,
    duration: totalDuration,
    previousStartDate: previousStart,
    previousEndDate: previousEnd,
  };
};

export const buildQuery = (params: IQueryParams): IQueryBuilderResult => {
  const result: IQueryBuilderResult = {
    whereClause: {},
    orderClause: [],
    page: params.page || 1,
  };

  // Pagination
  if (params.limit !== undefined) {
    result.limit = params.limit;
    result.offset = ((result.page || 1) - 1) * result.limit;
  }

  // Search
  if (params.search) {
    result.whereClause.$or = [
      { name: { $regex: params.search, $options: "i" } },
      { description: { $regex: params.search, $options: "i" } },
    ];
  }

  // Filter
  if (params.filter) {
    if (typeof params.filter === "string") {
      try {
        const parsedFilter = JSON.parse(params.filter);
        result.whereClause = { ...result.whereClause, ...parsedFilter };
      } catch (error) {
        console.error("Invalid filter format:", error);
      }
    } else if (typeof params.filter === "object") {
      result.whereClause = { ...result.whereClause, ...params.filter };
    }
  }

  // Date Range
  if (params.dateFrom || params.dateTo) {
    result.whereClause.createdAt = {};

    if (params.dateFrom) {
      const dateFrom =
        params.dateFrom instanceof Date
          ? params.dateFrom
          : new Date(params.dateFrom);
      result.whereClause.createdAt.$gte = dateFrom;
    }

    if (params.dateTo) {
      const dateTo =
        params.dateTo instanceof Date ? params.dateTo : new Date(params.dateTo);
      result.whereClause.createdAt.$lte = dateTo;
    }
  }

  // Sort
  const defaultSort = "createdAt";
  const defaultOrder = "desc";

  const sort = params.sort || defaultSort;
  const order = params.order || defaultOrder;

  result.orderClause = [[sort, order]];

  return result;
};
