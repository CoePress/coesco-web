import type { NextFunction, Request, Response } from "express";

import { verifyAccessToken } from "../lib/auth";
import { prisma } from "../lib/prisma";

type Role = "ADMIN" | "USER";

export function protect(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.access;
  if (!token)
    return res.status(401).json({ error: { message: "Unauthorized" } });

  try {
    const claims = verifyAccessToken(token);
    (req as any).userId = claims.sub;
    next();
  }
  catch {
    return res.status(401).json({ error: { message: "Unauthorized" } });
  }
}

export function requireRole(role: Role) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId as string | undefined;
      if (!userId)
        return res.status(401).json({ error: { message: "Unauthorized" } });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, isActive: true },
      });

      if (!user || user.isActive === false) {
        return res.status(401).json({ error: { message: "Unauthorized" } });
      }

      if (user.role !== role) {
        return res.status(403).json({ error: { message: "Forbidden" } });
      }

      next();
    }
    catch (err) {
      next(err);
    }
  };
}
