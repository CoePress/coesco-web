import type { NextFunction, Request, Response } from "express";

import { verify } from "jsonwebtoken";

import type { EmployeeContext } from "@/utils/context";

import { cookieOptions, env } from "@/config/env";
import { contextStorage } from "@/utils/context";
import { prisma } from "@/utils/prisma";

import { UnauthorizedError } from "./error.middleware";

const API_KEYS = new Set(["fe2ac930-94d5-41a4-9ad3-1c1f5910391c"]);

export function asyncHandler(fn: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: string;
  };
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    title: string;
    number: string;
    initials?: string;
  };
}

export const protect = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const apiKey = req.headers["x-api-key"];
    if (apiKey && API_KEYS.has(apiKey as string)) {
      req.user = { id: "system", role: "SYSTEM" };
      contextStorage.run(
        {
          id: "00000000-0000-0000-0000-000000000000",
          number: "0",
          firstName: "System",
          lastName: "Account",
          title: "System",
          email: "system@cpec.com",
          initials: "sys"
        },
        () => next(),
      );
      return;
    }

    const { accessToken, refreshToken } = req.cookies;
    if (!accessToken && !refreshToken) {
      throw new UnauthorizedError("Unauthorized");
    }

    try {
      const decoded = verify(accessToken, env.JWT_SECRET) as {
        userId: string;
        role: string;
      };

      if (!decoded?.userId)
        throw new UnauthorizedError("Unauthorized");

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { employee: true },
      });

      if (!user || !user.employee) {
        throw new UnauthorizedError("Unauthorized");
      }

      const emp = user.employee;

      const context: EmployeeContext = {
        id: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email!,
        title: emp.title,
        number: emp.number,
        initials: emp.initials
      };

      req.user = { id: user.id, role: user.role };
      req.employee = {
        id: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email ?? undefined,
        title: emp.title,
        number: emp.number,
        initials: emp.initials ?? undefined,
      };

      contextStorage.run(context, () => next());
    }
    // eslint-disable-next-line unused-imports/no-unused-vars
    catch (error) {
      res.clearCookie("accessToken", cookieOptions);
      res.clearCookie("refreshToken", cookieOptions);
      throw new UnauthorizedError("Invalid session");
    }
  },
);
