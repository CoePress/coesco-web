import { httpServer } from "./app";

import { __dev__, config } from "./config/config";
import { logger } from "./utils/logger";
import {
  machineMonitorService,
  cronService,
  cacheService,
  socketService,
  initializeServices,
} from "./services";

// Track active connections for forced shutdown
const activeConnections = new Set<any>();

httpServer.on("connection", (socket) => {
  activeConnections.add(socket);
  socket.on("close", () => {
    activeConnections.delete(socket);
  });
});

// Auto-cleanup function to kill any process holding the port
const autoCleanupPort = async () => {
  if (!__dev__) return; // Only in development

  try {
    const { exec } = require("child_process");
    const util = require("util");
    const execAsync = util.promisify(exec);

    // Find processes on the port
    const { stdout } = await execAsync(
      `netstat -aon | findstr :${config.port} | findstr LISTENING`
    );

    if (stdout.trim()) {
      const lines = stdout.trim().split("\n");
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];

        if (pid && pid !== process.pid.toString()) {
          logger.info(`Killing existing process ${pid} on port ${config.port}`);
          await execAsync(`taskkill /f /pid ${pid} 2>nul`);
        }
      }
    }
  } catch (err) {
    // Ignore errors - port might be free
  }
};

const startServer = async () => {
  // Auto-cleanup port before starting
  await autoCleanupPort();

  httpServer.listen(config.port, async () => {
    await initializeServices();

    logger.info(
      `Server running in ${config.nodeEnv} mode on port ${config.port}`
    );
  });
};

startServer();

const gracefulShutdown = async () => {
  logger.info("Shutting down gracefully...");

  // Set a timeout to force shutdown if graceful shutdown takes too long
  const forceShutdownTimeout = setTimeout(() => {
    logger.error("Forcing shutdown after timeout");
    process.exit(1);
  }, 10000); // Increased to 10 seconds

  try {
    // Stop machine monitoring first (has active polling)
    await machineMonitorService.stop();
    logger.info("Machine monitor service stopped");

    // Stop all other services
    await Promise.all([
      cronService.stop(),
      cacheService.stop(),
      socketService.stop(),
    ]);
    logger.info("All services stopped");

    // Close HTTP server and wait for it to complete
    await new Promise<void>((resolve, reject) => {
      const closeTimeout = setTimeout(() => {
        logger.info(
          `Forcing closure of ${activeConnections.size} active connections`
        );
        // Force close all active connections
        activeConnections.forEach((socket) => {
          socket.destroy();
        });
        activeConnections.clear();
      }, 5000); // Force close connections after 5 seconds

      httpServer.close((err) => {
        clearTimeout(closeTimeout);
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    logger.info("HTTP server closed");

    // Clear the force shutdown timeout since we completed gracefully
    clearTimeout(forceShutdownTimeout);

    logger.info("Graceful shutdown completed");
    process.exit(0);
  } catch (err) {
    logger.error("Error during shutdown:", err);
    clearTimeout(forceShutdownTimeout);
    process.exit(1);
  }
};

// Handle all possible exit scenarios
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
process.on("SIGHUP", gracefulShutdown);
process.on("SIGBREAK", gracefulShutdown); // Windows specific

process.on("unhandledRejection", (error: any) => {
  logger.error("Unhandled Rejection:", error.message);
  gracefulShutdown();
});

process.on("uncaughtException", (error: any) => {
  logger.error("Uncaught Exception:", error.message);
  gracefulShutdown();
});

// Ensure cleanup on process exit
process.on("exit", () => {
  logger.info("Process exiting...");
});

// Handle nodemon restart specifically
process.on("SIGUSR2", () => {
  logger.info("Nodemon restart detected, shutting down gracefully...");
  gracefulShutdown();
});

export default httpServer;
