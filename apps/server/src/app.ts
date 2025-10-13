import type { NextFunction, Request, Response } from "express";

import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { Server } from "socket.io";
import swaggerUi from "swagger-ui-express";

import { __dev__, __prod__ } from "./config/env";
import { errorHandler, NotFoundError } from "./middleware/error.middleware";
import { preventDirectoryTraversal, preventStaticFileServing } from "./middleware/security.middleware";
import routes from "./routes";
import { logger } from "./utils/logger";

const app = express();
const server = createServer(app);

const origin = __dev__ ? ["http://localhost:5173", "http://192.231.64.54:5173"] : ["https://portal.cpec.com", "https://cpec-portal.netlify.app"];

const corsOptions = {
  origin,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-File-Name"],
  exposedHeaders: ["Content-Range", "X-Content-Range", "Content-Length", "Content-Disposition"],
};

const io = new Server(server, {
  cors: {
    origin,
    credentials: true,
  },
  transports: ["polling", "websocket"],
  pingInterval: 5000,
  pingTimeout: 5000,
});

const stream = {
  write: (message: string) => logger.http(message.trim()),
};

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: __prod__ ? 1000 : 100000,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// eslint-disable-next-line node/prefer-global/process
const swaggerPath = path.join(process.cwd(), "./src/config/swagger.json");
const swaggerDoc = JSON.parse(readFileSync(swaggerPath, "utf-8"));

app.set("trust proxy", __prod__ ? 1 : false);

app.use("/api", limiter);
app.use(morgan("dev", { stream }));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true,
}));

app.use(preventDirectoryTraversal);
app.use(preventStaticFileServing);
app.use(compression());
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use("/api/files/upload", express.raw({ type: "*/*", limit: "100mb" }));

app.get("/openapi.json", (_req, res) => {
  res.type("application/json").send(swaggerDoc);
});

app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDoc, {
    explorer: true,
    swaggerOptions: {
      tagsSorter: "alpha",
      operationsSorter: "alpha",
    },
  }),
);

app.use("/v1", routes);

app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
});

app.use(errorHandler);

export { io };
export { server };
export default app;
