import type { NextFunction, Request, Response } from "express";

import crypto from "node:crypto";

export function requestId(req: Request, res: Response, next: NextFunction) {
  const incoming = req.header("x-request-id");
  const id = incoming && incoming.trim() ? incoming.trim() : crypto.randomUUID();

  (req as any).requestId = id;
  res.setHeader("x-request-id", id);

  next();
}
