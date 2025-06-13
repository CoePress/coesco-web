import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import { createServer } from "http";
import routes from "./routes";
import { __dev__, __prod__, config } from "./config/config";
import { errorHandler } from "./middleware/error.middleware";
import {
  cspMiddleware,
  securityHeaders,
} from "./middleware/security.middleware";
import { logger } from "./utils/logger";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);

const corsOptions = {
  origin: __dev__
    ? "http://localhost:5173"
    : ["https://portal.cpec.com", "https://api.oee.cpec.com"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
};

const io = new Server(httpServer, {
  cors: corsOptions,
  pingInterval: 5000,
  pingTimeout: 5000,
});

app.set("trust proxy", ["loopback", "linklocal", "uniquelocal"]);

app.use(cors(corsOptions));

app.use(cspMiddleware);
app.use(securityHeaders);

app.use(cookieParser());

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(compression());

const limiter = rateLimit({
  windowMs: __prod__ ? 15 * 60 * 1000 : 60 * 1000,
  max: __prod__ ? 1000 : 10000,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false,
    xForwardedForHeader: true,
  },
  skip: (req, res) => __dev__,
});
app.use("/api", limiter);

app.use((req, res, next) => {
  logger.request(req, res);
  next();
});

app.use("/api", routes);

app.use(errorHandler);

export { io };
export { httpServer };
export default app;
