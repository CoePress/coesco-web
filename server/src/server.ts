import { httpServer } from "./app";

import { config } from "./config/config";
import { sequelize } from "./config/database";
import { initializeModels } from "./models";
import { logger } from "./utils/logger";
import {
  initializeSocketService,
  machineDataService,
  cronService,
  cacheService,
  getSocketService,
} from "./services";

httpServer.listen(config.port, async () => {
  await initializeModels(sequelize);
  await sequelize.sync();
  logger.info("Database connected & synced");
  logger.info(
    `Server running in ${config.nodeEnv} mode on port ${config.port}`
  );

  initializeSocketService();
  logger.info("Socket.IO server initialized");
});

const gracefulShutdown = async () => {
  logger.info("Shutting down gracefully...");

  await Promise.all([
    machineDataService.stop(),
    cronService.stop(),
    cacheService.stop(),
    getSocketService().stop(),
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
