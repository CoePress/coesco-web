import type { NextFunction, Request, Response } from "express";

import {
  addMilliseconds,
  differenceInDays,
  differenceInMilliseconds,
} from "date-fns";
import { exec } from "node:child_process";
import { platform } from "node:os";
import { promisify } from "node:util";

import type { IDateRange, IQueryParams } from "@/types";

import { __prod__ } from "@/config/env";

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

export function createDateRange(startDate: string, endDate: string, timezoneOffset?: number): IDateRange {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(startDate)
    || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)
  ) {
    throw new Error("Invalid date format. Use YYYY-MM-DD");
  }

  if (startDate > endDate) {
    throw new Error("Start date must be before end date");
  }

  let startDateLocal: Date;
  let endDateLocal: Date;

  if (__prod__) {
    // Production server is in UTC
    // Client sends timezone offset in minutes (240 for EDT = UTC-4)
    // getTimezoneOffset returns positive for west of UTC, so EDT = 240
    // To get midnight EDT in UTC time, we need to ADD 4 hours (240 minutes)
    const offsetMs = (timezoneOffset || 0) * 60 * 1000;

    const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
    const [endYear, endMonth, endDay] = endDate.split("-").map(Number);

    // Midnight EDT (00:00) is 04:00 UTC, so we ADD the offset
    startDateLocal = new Date(Date.UTC(startYear, startMonth - 1, startDay, 0, 0, 0, 0) + offsetMs);
    endDateLocal = new Date(Date.UTC(endYear, endMonth - 1, endDay, 23, 59, 59, 999) + offsetMs);
  }
  else {
    // Development server is in EDT/EST - just create local dates
    startDateLocal = new Date(`${startDate}T00:00:00`);
    endDateLocal = new Date(`${endDate}T23:59:59.999`);
  }

  const totalDuration = differenceInMilliseconds(endDateLocal, startDateLocal) + 1;
  const totalDays = differenceInDays(endDateLocal, startDateLocal) + 1;

  const previousStart = addMilliseconds(startDateLocal, -totalDuration);
  const previousEnd = addMilliseconds(startDateLocal, -1);

  return {
    startDate: startDateLocal,
    endDate: endDateLocal,
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
