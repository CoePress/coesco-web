import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "./error.middleware";
import { decode } from "jsonwebtoken";
import { asyncHandler } from "@/utils";

const API_KEYS = new Set(["fe2ac930-94d5-41a4-9ad3-1c1f5910391c"]);

export const protect = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers["x-api-key"];
    if (apiKey && API_KEYS.has(apiKey as string)) {
      req.user = {
        id: "system",
        email: "system@cpec.com",
        userType: "SYSTEM",
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

    const user = {
      id: decoded.userId,
      email: "test@test.com",
      userType: decoded.userType,
    };

    if (!user) {
      throw new UnauthorizedError("Unauthorized");
    }

    req.user = user;
    next();
  }
);
