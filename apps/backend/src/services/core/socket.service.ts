import type { Server, Socket } from "socket.io";

import { logger } from "@/utils/logger";

import { agentService, lockingService } from ".";

export class SocketService {
  private io: Server | null = null;

  initialize(io: Server): void {
    this.io = io;
    if (!this.io) {
      throw new Error("Socket.IO instance not set");
    }

    this.registerIotNamespace();
    this.registerLockingNamespace();
    this.registerMetricsNamespace();
    this.registerChatNamespace();
  }

  public broadcastMachineStates(data: any): void {
    if (!this.io)
      return;
    this.io.of("/iot").to("machine_states").emit("machine_states", data);
  }

  private registerIotNamespace() {
    const iot = this.getNamespace("iot");

    iot.on("connection", (socket: Socket) => {
      logger.info(`IOT client connected: ${socket.id}`);

      socket.on("machine_states:subscribe", () => {
        socket.join("machine_states");
        socket.emit("machine_states:subscribed");
        logger.info(`[${socket.id}] subscribed to machine_states`);
      });

      socket.on("machine_states:unsubscribe", () => {
        socket.leave("machine_states");
        socket.emit("machine_states:unsubscribed");
        logger.info(`[${socket.id}] unsubscribed from machine_states`);
      });

      socket.on("disconnect", (reason) => {
        logger.info(`[${socket.id}] IOT client disconnected: ${reason}`);
      });
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

      socket.on("message:send", async (payload, ack?: any) => {
        try {
          const { chatId, text } = payload;
          if (!chatId || !text) {
            ack?.({ ok: false, error: "Invalid payload" });
            return;
          }

          const { userMsg, assistantMsg } = await agentService.processMessage(chatId, text);
          chat.to(chatId).emit("message:new", userMsg);
          chat.to(chatId).emit("message:new", assistantMsg);

          ack?.({ ok: true });
        }
        catch (err) {
          logger.error(`Error processing message for socket ${socket.id}`, err);
          ack?.({ ok: false, error: "Internal server error" });
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
