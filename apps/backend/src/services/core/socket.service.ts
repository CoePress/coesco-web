import type { Server, Socket } from "socket.io";

import { logger } from "@/utils/logger";

import { lockingService } from ".";

export class SocketService {
  private io: Server | null = null;

  public registerNamespaces(io: Server): void {
    this.io = io;
    if (!this.io) {
      throw new Error("Socket.IO instance not set");
    }

    this.registerIotNamespace();
    this.registerLockingNamespace();
    this.registerMetricsNamespace();
  }

  private registerIotNamespace() {
    const iot = this.getNamespace("iot");
    iot.on("connection", (socket: Socket) => {
      logger.info(`IOT client connected: ${socket.id}`);
    });
  }

  private registerLockingNamespace() {
    const locking = this.getNamespace("locking");
    locking.on("connection", (socket: Socket) => {
      logger.info(`Locking client connected: ${socket.id}`);

      socket.on("lock:request", async ({ resourceId }) => {
        logger.info(`[${socket.id}] Requested lock for ${resourceId}`);

        const success = await lockingService.acquireLock(resourceId, socket.id);

        if (!success) {
          socket.emit("lock:request:failed", { resourceId });
          return;
        }

        socket.emit("lock:granted", { resourceId });
      });

      socket.on("lock:release", async ({ resourceId }) => {
        logger.info(`[${socket.id}] Released lock for ${resourceId}`);

        const success = await lockingService.releaseLock(resourceId, socket.id);

        if (!success) {
          socket.emit("lock:release:failed", { resourceId });
          return;
        }

        socket.emit("lock:released", { resourceId });
      });

      socket.emit("lock:connected", { message: "Connected to locking namespace" });

      socket.on("disconnect", (reason) => {
        logger.info(`[${socket.id}] Locking client disconnected: ${reason}`);
      });
    });
  }

  private registerMetricsNamespace() {
    const metrics = this.getNamespace("metrics");
    metrics.on("connection", (socket: Socket) => {
      logger.info(`Metrics client connected: ${socket.id}`);
    });
  }

  private getNamespace(endpoint: string) {
    if (!this.io)
      throw new Error("Socket.IO instance not set");
    return this.io.of(`/${endpoint}`);
  }
}
