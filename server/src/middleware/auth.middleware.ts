import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "./error.middleware";
import { decode } from "jsonwebtoken";
import { asyncHandler } from "@/utils";
import { prisma } from "@/utils/prisma";
import { contextStorage } from "@/utils/context";

const API_KEYS = new Set(["fe2ac930-94d5-41a4-9ad3-1c1f5910391c"]);

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: string;
  };
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    jobTitle: string;
    number: string;
  };
}

export const protect = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const apiKey = req.headers["x-api-key"];
    if (apiKey && API_KEYS.has(apiKey as string)) {
      req.user = {
        id: "system",
        role: "SYSTEM",
      };
      return next();
    }

    const { accessToken, refreshToken } = req.cookies;

    if (!accessToken && !refreshToken) {
      throw new UnauthorizedError("Unauthorized");
    }

    const decoded = decode(accessToken) as { userId: string; userType: string };

    if (!decoded?.userId) {
      throw new UnauthorizedError(`Unauthorized`);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { employee: true },
    });

    if (!user || !user.employee) {
      throw new UnauthorizedError("Unauthorized");
    }

    const employee = {
      id: user.employee.id,
      firstName: user.employee.firstName,
      lastName: user.employee.lastName,
      email: user.employee.email || "",
      jobTitle: user.employee.jobTitle,
      number: user.employee.number,
    };

    req.user = {
      id: user.id,
      role: user.userType,
    };
    req.employee = employee;

    contextStorage.run(employee, () => next());
  }
);
