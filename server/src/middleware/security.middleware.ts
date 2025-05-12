import { Request, Response, NextFunction } from "express";
import helmet from "helmet";

// Content Security Policy setup
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

// Add more advanced security headers
export const securityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // HTTP Strict Transport Security
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );

  // X-Content-Type-Options
  res.setHeader("X-Content-Type-Options", "nosniff");

  // X-Frame-Options
  res.setHeader("X-Frame-Options", "DENY");

  // X-XSS-Protection
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Referrer-Policy
  res.setHeader("Referrer-Policy", "no-referrer");

  // Feature-Policy
  res.setHeader(
    "Feature-Policy",
    "camera 'none'; microphone 'none'; geolocation 'none'"
  );

  next();
};
