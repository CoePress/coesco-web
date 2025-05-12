import app from "./app";

import { config } from "./config/config";
import { sequelize } from "./config/database";
import { initializeModels } from "./models";
import { logger } from "./utils/logger";

const server = app.listen(config.port, async () => {
  await initializeModels(sequelize);
  await sequelize.sync();
  logger.info("Database connected & synced");
  logger.info(
    `Server running in ${config.nodeEnv} mode on port ${config.port}`
  );
});

const gracefulShutdown = () => {
  logger.info("Shutting down gracefully...");
  server.close(async () => {
    logger.info("HTTP server closed");
    try {
      process.exit(0);
    } catch (err) {
      logger.error("Error during shutdown:", err);
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error("Forcing shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Rejection:", err);
  gracefulShutdown();
});

export default server;
