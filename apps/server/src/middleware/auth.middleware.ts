import { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";
import { UnauthorizedError } from "./error.middleware";
import { asyncHandler } from "@/utils";
import { prisma } from "@/utils/prisma";
import { config } from "@/config/config";
import { contextStorage, RequestContext } from "@/main/context";

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
    email?: string;
    jobTitle: string;
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
          userId: "system",
          employeeId: "system",
          number: "SYS",
          email: undefined,
          firstName: "System",
          lastName: "Account",
          jobTitle: "System",
          roles: ["SYSTEM"],
          isActive: true,
        },
        () => next()
      );
      return;
    }

    const { accessToken, refreshToken } = req.cookies;
    if (!accessToken && !refreshToken) {
      throw new UnauthorizedError("Unauthorized");
    }

    try {
      const decoded = verify(accessToken, config.jwtSecret) as {
        userId: string;
        role: string;
      };

      if (!decoded?.userId) throw new UnauthorizedError("Unauthorized");

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { employee: true },
      });

      if (!user || !user.employee) {
        throw new UnauthorizedError("Unauthorized");
      }

      const emp = user.employee;

      const context: RequestContext = {
        userId: user.id,
        employeeId: emp.id,
        number: emp.number,
        email: emp.email ?? undefined,
        firstName: emp.firstName,
        lastName: emp.lastName,
        jobTitle: emp.jobTitle,
        initials: emp.initials ?? undefined,
        roles: [user.role],
        isActive: user.isActive && emp.isActive,
      };

      req.user = { id: user.id, role: user.role };
      req.employee = {
        id: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email ?? undefined,
        jobTitle: emp.jobTitle,
        number: emp.number,
        initials: emp.initials ?? undefined,
      };

      contextStorage.run(context, () => next());
    } catch (error) {
      res.clearCookie("accessToken", config.cookieOptions);
      res.clearCookie("refreshToken", config.cookieOptions);
      throw new UnauthorizedError("Invalid session");
    }
  }
);
