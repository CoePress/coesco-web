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

      // Close all client connections first
      this.io.of("/client").disconnectSockets(true);

      // Then close the server
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
