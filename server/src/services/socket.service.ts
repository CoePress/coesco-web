import { Server, Socket } from "socket.io";
import { logger } from "@/utils/logger";
import { machineDataService } from ".";

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
    this.setupFanucNamespace();
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

  private setupFanucNamespace(): void {
    if (!this.io) {
      throw new Error("Socket.IO instance not set");
    }

    const fanucNS = this.io.of("/fanuc");

    fanucNS.on("connection", (socket: Socket) => {
      logger.info(`Fanuc adapter connected: ${socket.id}`);

      socket.on("data", async (data) => {
        logger.info(`Fanuc data received: ${JSON.stringify(data)}`);
        const processedData = await machineDataService.processFanucData(data);
        if (processedData) {
          this.broadcastDashboardMetrics(processedData);
          this.broadcastMachineStates(processedData);
        }
      });

      socket.on("disconnect", () => {
        logger.info(`Fanuc adapter disconnected: ${socket.id}`);
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

  public sendStartToFanuc(data: any): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.io) {
        return reject(new Error("Socket.IO instance not set"));
      }
      const fanucNamespace = this.io.of("/fanuc");
      const connectedSockets = fanucNamespace.sockets.size;

      if (connectedSockets === 0) {
        const msg = "No Fanuc adapters connected to send start command";
        logger.error(msg);
        reject(new Error(msg));
        return;
      }

      logger.info(`Sending start command to Fanuc adapters`);

      const timeout = setTimeout(() => {
        reject(new Error("Command status response timed out"));
      }, 5000);

      const onCommandStatus = (socket: Socket, statusMessage: string) => {
        clearTimeout(timeout);
        resolve(statusMessage);
        socket.off("command_status", () =>
          onCommandStatus(socket, statusMessage)
        );
      };

      fanucNamespace.sockets.forEach((socket) => {
        socket.once("command_status", (statusMessage) =>
          onCommandStatus(socket, statusMessage)
        );
      });

      fanucNamespace.emit("start", data);
    });
  }

  public sendStopToFanuc(data: any): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.io) {
        return reject(new Error("Socket.IO instance not set"));
      }
      const fanucNamespace = this.io.of("/fanuc");
      const connectedSockets = fanucNamespace.sockets.size;

      if (connectedSockets === 0) {
        const msg = "No Fanuc adapters connected to send stop command";
        logger.error(msg);
        reject(new Error(msg));
        return;
      }

      logger.info(`Sending stop command to Fanuc adapters`);

      const timeout = setTimeout(() => {
        reject(new Error("Command status response timed out"));
      }, 5000);

      const onCommandStatus = (socket: Socket, statusMessage: string) => {
        clearTimeout(timeout);
        resolve(statusMessage);
        socket.off("command_status", () =>
          onCommandStatus(socket, statusMessage)
        );
      };

      fanucNamespace.sockets.forEach((socket) => {
        socket.once("command_status", (statusMessage) =>
          onCommandStatus(socket, statusMessage)
        );
      });

      fanucNamespace.emit("stop", data);
    });
  }

  async stop() {
    if (!this.io) return;
    try {
      await this.io.close();
    } catch (err) {
      logger.error(`Socket.IO close error: ${err}`);
    }
  }
}
