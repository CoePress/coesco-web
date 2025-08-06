import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import logger from "./utils/logger";

const app = express();

const stream = {
  write: (message: string) => logger.http(message.trim()),
};

app.use(morgan("dev", { stream }));

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("trust proxy", true);

app.get("/", (_req, res) => {
  logger.info("Health check hit");
  res.send("OK");
});

export default app;
