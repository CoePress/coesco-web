import { httpServer } from "./app";

import { __dev__, config } from "./config/config";
import { sequelize, quoteSequelize } from "./config/database";
import { initializeModels } from "./models";
import { logger } from "./utils/logger";
import {
  machineDataService,
  cronService,
  cacheService,
  socketService,
  initializeServices,
} from "./services";

httpServer.listen(config.port, async () => {
  await initializeModels(sequelize);

  await sequelize.sync();
  logger.info("Database connected");

  if (__dev__) {
    await quoteSequelize.sync();
    logger.info("Quote database connected");
  }

  await initializeServices();

  logger.info(
    `Server running in ${config.nodeEnv} mode on port ${config.port}`
  );
});

const gracefulShutdown = async () => {
  logger.info("Shutting down gracefully...");

  await machineDataService.stop();

  await Promise.all([
    cronService.stop(),
    cacheService.stop(),
    socketService.stop(),
  ]);

  httpServer.close(async () => {
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
  }, 5000);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

process.on("unhandledRejection", (error: any) => {
  logger.error("Unhandled Rejection:", error.message);
  gracefulShutdown();
});

export default httpServer;
