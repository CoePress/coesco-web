import type { NextFunction, Request, Response } from "express";

import {
  addMilliseconds,
  differenceInDays,
  differenceInMilliseconds,
  parse,
} from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { exec } from "node:child_process";
import { platform } from "node:os";
import { promisify } from "node:util";

import type { IDateRange, IQueryParams } from "@/types";

export function deriveTableNames(modelName: string): string[] {
  const snake = modelName.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();

  const plural = snake.replace(/([^_]+)$/, (w) => {
    if (w.endsWith("s"))
      return w;
    if (w.endsWith("y"))
      return `${w.slice(0, -1)}ies`;
    if (w.endsWith("ss"))
      return `${w}es`;
    if (/(?:x|ch|sh)$/.test(w))
      return `${w}es`;
    return `${w}s`;
  });

  return plural === snake ? [snake] : [snake, plural];
}

export function createDateRange(startDate: string, endDate: string): IDateRange {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(startDate)
    || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)
  ) {
    throw new Error("Invalid date format. Use YYYY-MM-DD");
  }

  if (startDate > endDate) {
    throw new Error("Start date must be before end date");
  }

  const timeZone = "America/New_York";

  const startDateEST = toZonedTime(
    parse(`${startDate} 00:00:00`, "yyyy-MM-dd HH:mm:ss", new Date()),
    timeZone,
  );

  const endDateEST = toZonedTime(
    parse(`${endDate} 23:59:59.999`, "yyyy-MM-dd HH:mm:ss.SSS", new Date()),
    timeZone,
  );

  const totalDuration = differenceInMilliseconds(endDateEST, startDateEST) + 1;
  const totalDays = differenceInDays(endDateEST, startDateEST) + 1;

  const previousStart = toZonedTime(
    addMilliseconds(startDateEST, -totalDuration),
    timeZone,
  );

  const previousEnd = toZonedTime(addMilliseconds(startDateEST, -1), timeZone);

  return {
    startDate: startDateEST,
    endDate: endDateEST,
    duration: totalDuration,
    totalDays,
    previousStartDate: previousStart,
    previousEndDate: previousEnd,
  };
}

export function buildDateRangeFilter(startDate: string, endDate: string) {
  return {
    OR: [
      {
        startTime: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      {
        endTime: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      {
        AND: [
          {
            startTime: {
              lte: new Date(startDate),
            },
          },
          {
            endTime: {
              gte: new Date(endDate),
            },
          },
        ],
      },
    ],
  };
}

export function getObjectDiff(before: Record<string, any> = {}, after: Record<string, any> = {}): Record<string, { before: any; after: any }> {
  const diff: Record<string, { before: any; after: any }> = {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of keys) {
    const a = normalizeValue(before?.[key]);
    const b = normalizeValue(after?.[key]);
    if (!isEqual(a, b)) {
      diff[key] = { before: before?.[key], after: after?.[key] };
    }
  }

  return diff;
}

export function normalizeValue(value: any) {
  if (value instanceof Date)
    return value.toISOString();
  return value;
}

export function isEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function buildQueryParams<T>(query: any): IQueryParams<T> {
  return {
    page: query.page ? Number.parseInt(query.page as string) : 1,
    limit: query.limit ? Number.parseInt(query.limit as string) : undefined,
    sort: query.sort as string,
    order: query.order as "asc" | "desc",
    search: query.search as string,
    filter: query.filter as Partial<T>,
    include: query.include ? JSON.parse(query.include as string) : undefined,
  };
}

type AsyncController = (req: Request, res: Response, next: NextFunction) => Promise<any>;

export function asyncWrapper(controller: AsyncController) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await controller(req, res, next);

      if (!res.headersSent && result !== undefined) {
        res.json(result);
      }
    }
    catch (error) {
      next(error);
    }
  };
}

const execAsync = promisify(exec);

interface PingResult {
  alive: boolean;
  time?: number;
}

export async function pingHost(host: string, timeoutSeconds: number = 5): Promise<PingResult> {
  try {
    const isWindows = platform() === "win32";
    const command = isWindows
      ? `ping -n 1 -w ${timeoutSeconds * 1000} ${host}`
      : `ping -c 1 -W ${timeoutSeconds} ${host}`;

    const { stdout } = await execAsync(command);
    const timeMatch = stdout.match(/time[<=](\d+(?:\.\d+)?)/i);
    const time = timeMatch ? Number.parseFloat(timeMatch[1]) : undefined;
    return { alive: true, time };
  }
  catch {
    return { alive: false };
  }
}
