import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "./error.middleware";
import { decode } from "jsonwebtoken";
import { asyncHandler } from "@/utils";

export const protect = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { accessToken, refreshToken } = req.cookies;

    if (!accessToken && !refreshToken) {
      res.status(401).json({ error: "Unauthorized - No tokens" });
      return;
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
