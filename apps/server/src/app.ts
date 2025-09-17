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
import routes from "./routes";
import { logger } from "./utils/logger";

const app = express();
const server = createServer(app);

app.set("trust proxy", 1);

const corsOptions = {
  origin: __dev__ ? "http://localhost:5173" : "https://portal.cpec.com",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-File-Name"],
  exposedHeaders: ["Content-Range", "X-Content-Range", "Content-Length", "Content-Disposition"],
};

const io = new Server(server, {
  cors: corsOptions,
  pingInterval: 5000,
  pingTimeout: 5000,
});

const stream = {
  write: (message: string) => logger.http(message.trim()),
};

const limiter = rateLimit({
  windowMs: __prod__ ? 15 * 60 * 1000 : 60 * 1000, // 15 min vs 1 min
  max: __prod__ ? 1000 : 10000,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// eslint-disable-next-line node/prefer-global/process
const swaggerPath = path.join(process.cwd(), "./src/config/swagger.json");
const swaggerDoc = JSON.parse(readFileSync(swaggerPath, "utf-8"));

app.use("/api", limiter);
app.use(morgan("dev", { stream }));

app.use(helmet());
app.use(compression());
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Raw body parsing for file uploads
app.use("/api/files/upload", express.raw({ type: "*/*", limit: "100mb" }));
app.set("trust proxy", false);

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

app.use("/api", routes);

app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
});

app.use(errorHandler);

export { io };
export { server };
export default app;
