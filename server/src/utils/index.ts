import ejs from "ejs";
import fs from "fs";
import nodemailer from "nodemailer";
import path from "path";

import { env } from "@/config/env";
import { error } from "./logger";
import {
  FanucControllerMode,
  FanucExecutionMode,
  IDateRange,
  IQueryBuilderResult,
  IQueryParams,
} from "./types";
import { NextFunction, Request, Response } from "express";
import { Op, fn, literal } from "sequelize";
import { toZonedTime } from "date-fns-tz";
import {
  addMilliseconds,
  differenceInMilliseconds,
  format,
  parse,
} from "date-fns";
import { sequelize } from "@/config/database";

const emailConfig = {
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  tls: { rejectUnauthorized: true },
};

export const sendEmail = async (
  to: string | string[],
  subject: string,
  html: string
) => {
  const transporter = nodemailer.createTransport(emailConfig);

  try {
    return await transporter.sendMail({
      from: '"CPEC" <cpec@cpec.com>',
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html,
    });
  } catch (err) {
    error(`Email error: ${err.message}`);
    throw err;
  }
};

export const sendTemplate = async (
  templateName: string,
  data: Record<string, any>,
  to: string | string[],
  subject: string
): Promise<nodemailer.SentMessageInfo> => {
  const templatePath = path.resolve("templates", `${templateName}.ejs`);
  const template = fs.readFileSync(templatePath, "utf-8");
  const html = ejs.render(template, data);

  return sendEmail(to, subject, html);
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

export const asyncHandler =
  (fn: any) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export const buildWhereClause = (
  params?: IQueryParams,
  searchableFields: string[] = [],
  additionalConditions: Record<string, any> = {}
): any => {
  if (!params && Object.keys(additionalConditions).length === 0) return {};

  const { search, startDate, endDate } = params || {};
  let whereClause: any = { ...additionalConditions };

  if (startDate && endDate) {
    whereClause.createdAt = { [Op.between]: [startDate, endDate] };
  }

  if (search && searchableFields.length > 0) {
    if (Object.keys(whereClause).length > 0) {
      return {
        [Op.and]: [
          whereClause,
          {
            [Op.or]: searchableFields.map((field) => ({
              [field]: { [Op.iLike]: `%${search}%` },
            })),
          },
        ],
      };
    } else {
      return {
        [Op.or]: searchableFields.map((field) => ({
          [field]: { [Op.iLike]: `%${search}%` },
        })),
      };
    }
  }

  return whereClause;
};

export const buildOrderClause = (params?: IQueryParams): any[] => {
  if (!params) return [["createdAt", "DESC"]];

  const { sortBy, sortOrder = "ASC" } = params;

  return sortBy ? [[sortBy, sortOrder.toUpperCase()]] : [["createdAt", "DESC"]];
};

export const buildPaginationOptions = (
  params?: IQueryParams
): { limit: number; offset: number } => {
  if (!params) return { limit: 10, offset: 0 };

  const { page = 1, limit = 10 } = params;

  return {
    limit,
    offset: (page - 1) * limit,
  };
};

// Utils
export const hasThisChanged = async (a: any, b: any): Promise<boolean> => {
  if (typeof a !== typeof b) return false;
  if (typeof a === "object") {
    return JSON.stringify(a) !== JSON.stringify(b);
  }
  return a !== b;
};

export const buildQuery = (params: IQueryParams): IQueryBuilderResult => {
  const {
    page,
    limit,
    sortBy = "createdAt",
    sortOrder = "desc",
    ...filters
  } = params;

  const whereClause = Object.entries(filters).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, any>);

  if (filters.startDate && filters.endDate) {
    whereClause.createdAt = {
      $gte: filters.startDate,
      $lte: filters.endDate,
    };
    delete whereClause.startDate;
    delete whereClause.endDate;
  }

  if (filters.search) {
    whereClause.$or = [
      { name: { $regex: filters.search, $options: "i" } },
      { description: { $regex: filters.search, $options: "i" } },
    ];
    delete whereClause.search;
  }

  const result: IQueryBuilderResult = {
    whereClause,
    orderClause: [[sortBy, sortOrder]],
    page,
  };

  if (page !== undefined && limit !== undefined) {
    result.offset = (page - 1) * limit;
    result.limit = limit;
  }

  return result;
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
  const totalDays = Math.ceil(totalDuration / (1000 * 60 * 60 * 24));

  const previousStart = toZonedTime(
    addMilliseconds(startDateEST, -totalDuration),
    timeZone
  );

  const previousEnd = toZonedTime(addMilliseconds(startDateEST, -1), timeZone);

  return {
    startDate: startDateEST,
    endDate: endDateEST,
    totalDuration,
    totalDays,
    previousStart,
    previousEnd,
  };
};

export const formatInEasternTime = (
  date: Date,
  formatStr = "yyyy-MM-dd"
): string => {
  const timeZone = "America/New_York";
  const dateInET = toZonedTime(date, timeZone);
  return format(dateInET, formatStr);
};

export const buildStateQuery = (params: IQueryParams): IQueryBuilderResult => {
  const {
    page,
    limit,
    sortBy = "startTime",
    sortOrder = "desc",
    ...filters
  } = params;

  const whereClause: any = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (
      value !== undefined &&
      key !== "startDate" &&
      key !== "endDate" &&
      key !== "search"
    ) {
      whereClause[key] = value;
    }
  });

  if (filters.startDate && filters.endDate) {
    whereClause[Op.and] = [
      // State starts before division ends
      { startTime: { [Op.lte]: filters.endDate } },
      // State either hasn't ended or ends after division starts
      {
        [Op.or]: [
          { endTime: null },
          { endTime: { [Op.gte]: filters.startDate } },
        ],
      },
    ];
  }

  if (filters.search) {
    const searchCondition = [
      { name: { [Op.iLike]: `%${filters.search}%` } },
      { description: { [Op.iLike]: `%${filters.search}%` } },
    ];

    if (whereClause[Op.or]) {
      const existingOr = whereClause[Op.or];
      whereClause[Op.and] = [
        { [Op.or]: existingOr },
        { [Op.or]: searchCondition },
      ];
      delete whereClause[Op.or];
    } else {
      whereClause[Op.or] = searchCondition;
    }
  }

  const result: IQueryBuilderResult = {
    whereClause,
    orderClause: [[sortBy, sortOrder]],
    page,
  };

  if (page !== undefined && limit !== undefined) {
    result.offset = (page - 1) * limit;
    result.limit = limit;
  }

  return result;
};
