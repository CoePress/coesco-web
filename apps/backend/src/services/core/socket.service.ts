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
    this.registerChatNamespace();
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

  private registerChatNamespace() {
    const chat = this.getNamespace("chat");

    chat.on("connection", (socket: Socket) => {
      logger.info(`Chat client connected: ${socket.id}`);

      if (socket.handshake.query && Object.keys(socket.handshake.query).length > 0) {
        logger.info(`Query params for ${socket.id}:`, socket.handshake.query);
      }

      socket.on("room:join", ({ chatId }) => {
        logger.info(`[${socket.id}] Joining room ${chatId}`);
        socket.join(chatId);
      });

      socket.on("room:leave", ({ chatId }) => {
        logger.info(`[${socket.id}] Leaving room ${chatId}`);
        socket.leave(chatId);
      });

      socket.on("message:send", (payload, ack?: any) => {
        logger.info(`[${socket.id}] Message send event`, payload);

        const { chatId, text } = payload;
        if (chatId && text) {
          chat.to(chatId).emit("message:new", {
            chatId,
            text,
            fromSocket: socket.id,
            createdAt: new Date().toISOString(),
          });
          ack?.({ ok: true });
        }
        else {
          ack?.({ ok: false, error: "Invalid payload" });
        }
      });

      socket.on("disconnect", (reason) => {
        logger.info(`[${socket.id}] Chat client disconnected: ${reason}`);
      });
    });
  }

  private getNamespace(endpoint: string) {
    if (!this.io)
      throw new Error("Socket.IO instance not set");
    return this.io.of(`/${endpoint}`);
  }
}
