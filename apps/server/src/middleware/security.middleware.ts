import type { NextFunction, Request, Response } from "express";

import helmet from "helmet";

export const cspMiddleware = helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:"],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
  },
});

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload",
  );

  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader(
    "Feature-Policy",
    "camera 'none'; microphone 'none'; geolocation 'none'",
  );

  next();
}

export function preventDirectoryTraversal(req: Request, res: Response, next: NextFunction) {
  const dangerousPatterns = ["..", "~", "\\"];
  const path = decodeURIComponent(req.path);

  for (const pattern of dangerousPatterns) {
    if (path.includes(pattern)) {
      return res.status(400).json({
        error: "Invalid path",
        message: "Directory traversal attempts are not allowed",
      });
    }
  }

  next();
}

export function preventStaticFileServing(req: Request, res: Response, next: NextFunction) {
  const staticExtensions = [".html", ".htm", ".js", ".css", ".map", ".txt", ".xml"];
  const isStaticFileRequest = staticExtensions.some(ext => req.path.toLowerCase().endsWith(ext));
  const allowedPaths = ["/docs", "/openapi.json"];
  const isAllowedPath = allowedPaths.some(path => req.path.startsWith(path));

  if (isStaticFileRequest && !isAllowedPath) {
    return res.status(403).json({
      error: "Forbidden",
      message: "Static file serving is disabled",
    });
  }

  next();
}
