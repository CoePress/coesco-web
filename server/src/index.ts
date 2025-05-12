import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Express, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { createServer } from "http";

import { sequelize } from "@/config/database";
import { __prod__, env } from "@/config/env";
import { errorHandler } from "@/middleware/error-handler";
import { initializeModels } from "@/models";
import { routes } from "@/routes";
import Services from "@/services";
import { error, info, logRequest } from "@/utils/logger";

const port = env.PORT || 8080;

const app: Express = express();
const httpServer = createServer(app);
const services = Services.getInstance(httpServer);

const allowedOrigins = __prod__
  ? [env.ALLOWED_ORIGIN]
  : [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://coesco-web.vercel.app",
    ];

const limiterOptions = {
  windowMs: 60 * 1000, // 1 minute
  max: __prod__ ? 100 : 1000,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  validate: {
    trustProxy: false,
    xForwardedForHeader: true,
  },
};

const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow: boolean) => void
  ) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not Allowed: ${origin}`), false);
    }
  },
  methods: ["GET", "POST", "PATCH", "DELETE"],
  credentials: true,
};

app.set("trust proxy", ["loopback", "linklocal", "uniquelocal"]);

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(env.COOKIE_SECRET));
app.use(compression());
app.use(rateLimit(limiterOptions));

app.use((req, res, next) => {
  logRequest(req, res);
  next();
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  error(err.stack);
  res.status(500).send("Something went wrong!");
});

app.use(errorHandler);
app.use("/", routes(services));

const startServer = async () => {
  try {
    await initializeModels(sequelize);
    await sequelize.sync();
    info("Database initialized & synced");

    await services.initialize();
    // await services.seedSampleData();
    info("Sample data seeded");

    httpServer.listen(port, () => {
      info(`Server is running on port ${port}`);
    });
  } catch (err) {
    error("Failed to start server:", err);
  }
};

startServer();

// process.on("SIGTERM", shutdown);
// process.on("SIGINT", shutdown);

// process.on("uncaughtException", (err) => {
//   error(`Uncaught Exception: ${err}`);
//   logUptime("Server crashed", { error: err.stack });
//   shutdown();
// });

// process.on("unhandledRejection", (reason) => {
//   error(`Unhandled Rejection: ${reason}`);
//   logUptime("Server crashed", { reason });
//   shutdown();
// });
