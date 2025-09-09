import type { Server, Socket } from "socket.io";

import { agentService } from "@/services";
import { logger } from "@/utils/logger";

export class SocketService {
  private io: Server | null = null;

  async initialize(io: Server): Promise<void> {
    this.io = io;
    if (!this.io) {
      throw new Error("Socket.IO instance not set");
    }

    this.registerIotNamespace();
    this.registerMetricsNamespace();
    this.registerChatNamespace();
    this.registerSystemNamespace();
  }

  public broadcastMachineStates(data: any): void {
    if (!this.io)
      return;
    this.io.of("/iot").to("machine_states").emit("machine_states", data);
  }

  public broadcastSystemHealth(data: any): void {
    if (!this.io)
      return;
    this.io.of("/system").to("health").emit("health", data);
  }

  public broadcastSystemUpdate(data: any): void {
    if (!this.io)
      return;
    this.io.of("/system").to("updates").emit("update", data);
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

      socket.on("message:user", async (payload, ack?: any) => {
        try {
          const { employeeId, chatId, message } = payload;
          if (!message || !employeeId) {
            ack?.({ ok: false, error: "Missing required fields: message, employeeId" });
            return;
          }

          if (!chatId) {
            const newChatId = "17af62b0-4ed7-4a74-9cb8-e9b0cd846aa8";

            socket.emit("chat:url-update", { chatId: newChatId });

            ack?.({ ok: true, chatId: newChatId, message: "New chat created" });
            return;
          }

          const systemMessage = await agentService.processMessage(employeeId, chatId, message);

          chat.to(chatId).emit("message:system", systemMessage);

          ack?.({ ok: true, message: systemMessage });
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

  private registerSystemNamespace() {
    const system = this.getNamespace("system");

    system.on("connection", (socket: Socket) => {
      logger.info(`System client connected: ${socket.id}`);

      socket.on("health:subscribe", () => {
        socket.join("health");
        socket.emit("health:subscribed");
        logger.info(`[${socket.id}] subscribed to system health`);
      });

      socket.on("health:unsubscribe", () => {
        socket.leave("health");
        socket.emit("health:unsubscribed");
        logger.info(`[${socket.id}] unsubscribed from system health`);
      });

      socket.on("updates:subscribe", () => {
        socket.join("updates");
        socket.emit("updates:subscribed");
        logger.info(`[${socket.id}] subscribed to system updates`);
      });

      socket.on("updates:unsubscribe", () => {
        socket.leave("updates");
        socket.emit("updates:unsubscribed");
        logger.info(`[${socket.id}] unsubscribed from system updates`);
      });

      socket.on("disconnect", (reason) => {
        logger.info(`[${socket.id}] System client disconnected: ${reason}`);
      });
    });
  }

  private getNamespace(endpoint: string) {
    if (!this.io)
      throw new Error("Socket.IO instance not set");
    return this.io.of(`/${endpoint}`);
  }

  async stop() {
    if (!this.io)
      return;
    try {
      logger.info("Closing Socket.IO server...");
      this.io.of("/client").disconnectSockets(true);
      await new Promise<void>((resolve, reject) => {
        this.io!.close((err) => {
          if (err) {
            reject(err);
          }
          else {
            resolve();
          }
        });
      });

      logger.info("Socket.IO server closed");
    }
    catch (err) {
      logger.error(`Socket.IO close error: ${err}`);
    }
  }
}
