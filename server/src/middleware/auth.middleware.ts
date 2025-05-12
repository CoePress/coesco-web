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

    const decoded = decode(accessToken) as { oid: string };

    if (!decoded?.oid) {
      throw new UnauthorizedError(`Unauthorized`);
    }

    const user = { id: decoded.oid, email: "test@test.com", password: "test" };

    if (!user) {
      throw new UnauthorizedError("Unauthorized");
    }

    const { password, ...userWithoutPassword } = user;

    req.user = userWithoutPassword;
    next();
  }
);
