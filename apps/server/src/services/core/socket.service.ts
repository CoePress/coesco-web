import { Server, Socket } from "socket.io";
import { logger } from "@/utils/logger";

export class SocketService {
  private io: Server | null = null;

  public setIo(io: Server) {
    this.io = io;
  }

  public initialize(): void {
    if (!this.io) {
      throw new Error("Socket.IO instance not set");
    }
    this.setupClientNamespace();
  }

  private setupClientNamespace(): void {
    if (!this.io) {
      throw new Error("Socket.IO instance not set");
    }
    const clientNS = this.io.of("/client");

    clientNS.on("connection", (socket: Socket) => {
      logger.info(`Client connected: ${socket.id}`);

      socket.join("dashboard_metrics");
      socket.join("machine_states");

      logger.info(
        `Client ${socket.id} subscribed to dashboard_metrics and machine_states`
      );

      socket.on("lock:acquire", async (payload, cb) => {
        try {
          const { recordType, recordId, userId, ttl, username } = payload || {};
          if (!recordType || !recordId || !userId) {
            const error = {
              success: false,
              error: "recordType, recordId, and userId are required",
            };
            cb ? cb(error) : socket.emit("lock:acquire:result", error);
            return;
          }
          const result = await require("@/services").lockingService.acquireLock(
            recordType,
            recordId,
            userId,
            ttl,
            username
          );
          cb ? cb(result) : socket.emit("lock:acquire:result", result);
        } catch (err) {
          const error = {
            success: false,
            error: (err as any)?.message || "Unknown error",
          };
          cb ? cb(error) : socket.emit("lock:acquire:result", error);
        }
      });

      socket.on("lock:release", async (payload, cb) => {
        try {
          const { recordType, recordId, userId } = payload || {};
          if (!recordType || !recordId || !userId) {
            const error = {
              success: false,
              error: "recordType, recordId, and userId are required",
            };
            cb ? cb(error) : socket.emit("lock:release:result", error);
            return;
          }
          const result = await require("@/services").lockingService.releaseLock(
            recordType,
            recordId,
            userId
          );
          cb ? cb(result) : socket.emit("lock:release:result", result);
        } catch (err) {
          const error = {
            success: false,
            error: (err as any)?.message || "Unknown error",
          };
          cb ? cb(error) : socket.emit("lock:release:result", error);
        }
      });

      socket.on("lock:extend", async (payload, cb) => {
        try {
          const { recordType, recordId, userId, ttl } = payload || {};
          if (!recordType || !recordId || !userId) {
            const error = {
              success: false,
              error: "recordType, recordId, and userId are required",
            };
            cb ? cb(error) : socket.emit("lock:extend:result", error);
            return;
          }
          const result = await require("@/services").lockingService.extendLock(
            recordType,
            recordId,
            userId,
            ttl
          );
          cb ? cb(result) : socket.emit("lock:extend:result", result);
        } catch (err) {
          const error = {
            success: false,
            error: (err as any)?.message || "Unknown error",
          };
          cb ? cb(error) : socket.emit("lock:extend:result", error);
        }
      });

      socket.on("lock:status", async (payload, cb) => {
        try {
          const { recordType, recordId } = payload || {};
          if (!recordType || !recordId) {
            const error = {
              success: false,
              error: "recordType and recordId are required",
            };
            cb ? cb(error) : socket.emit("lock:status:result", error);
            return;
          }
          const lockingService = require("@/services").lockingService;
          const lockInfo = await lockingService.getLockInfo(
            recordType,
            recordId
          );
          const isLocked = await lockingService.isLocked(recordType, recordId);
          const result = {
            success: true,
            isLocked,
            lockInfo: lockInfo || null,
          };
          cb ? cb(result) : socket.emit("lock:status:result", result);
        } catch (err) {
          const error = {
            success: false,
            error: (err as any)?.message || "Unknown error",
          };
          cb ? cb(error) : socket.emit("lock:status:result", error);
        }
      });

      socket.on("disconnect", () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
  }

  public broadcastDashboardMetrics(data: any): void {
    if (!this.io) return;
    this.io
      .of("/client")
      .to("dashboard_metrics")
      .emit("dashboard_metrics", data);
  }

  public broadcastMachineStates(data: any): void {
    if (!this.io) return;
    this.io.of("/client").to("machine_states").emit("machine_states", data);
  }

  async stop() {
    if (!this.io) return;
    try {
      logger.info("Closing Socket.IO server...");

      this.io.of("/client").disconnectSockets(true);

      await new Promise<void>((resolve, reject) => {
        this.io!.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      logger.info("Socket.IO server closed");
    } catch (err) {
      logger.error(`Socket.IO close error: ${err}`);
    }
  }
}
