import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { createServer } from "node:http";
import { Server } from "socket.io";

import { __dev__, __prod__ } from "./config/env";
import routes from "./routes";
import { logger } from "./utils/logger";

const app = express();
const server = createServer(app);

const corsOptions = {
  origin: __dev__ ? "http://localhost:5173" : "https://portal.cpec.com",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
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

app.use("/api", limiter);
app.use(morgan("dev", { stream }));

app.use(helmet());
app.use(compression());
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("trust proxy", false);

app.use("/api", routes);

export { io };
export { server };
export default app;
