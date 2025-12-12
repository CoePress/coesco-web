import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/auth";

export function protect(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.access;
  if (!token) return res.status(401).json({ error: { message: "Unauthorized" } });

  try {
    const claims = verifyAccessToken(token);
    (req as any).userId = claims.sub;
    next();
  } catch {
    return res.status(401).json({ error: { message: "Unauthorized" } });
  }
}
