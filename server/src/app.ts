import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";

import routes from "./routes";
import { config } from "./config/config";
import { errorHandler } from "./middleware/error.middleware";
import {
  cspMiddleware,
  securityHeaders,
} from "./middleware/security.middleware";
import { logger } from "./utils/logger";

const app = express();
app.set("trust proxy", ["loopback", "linklocal", "uniquelocal"]);

app.use(cspMiddleware);
app.use(securityHeaders);

app.use(
  cors({
    origin: config.cors.allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use(cookieParser());

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(compression());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false,
    xForwardedForHeader: true,
  },
});
app.use("/api", limiter);

app.use((req, res, next) => {
  logger.request(req, res);
  next();
});

app.use("/api", routes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(errorHandler);

export default app;
