import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";

import { error, info } from "@/utils/logger";
import Services from ".";

class SocketService {
  public io: Server;
  private readonly PING_INTERVAL = 5000;

  constructor(httpServer: HttpServer, private services: Services) {
    this.io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
      pingInterval: this.PING_INTERVAL,
      pingTimeout: this.PING_INTERVAL,
    });

    this.setupClientNamespace();
    this.setupFanucNamespace();
  }

  private setupClientNamespace(): void {
    const clientNS = this.io.of("/client");

    clientNS.on("connection", (socket: Socket) => {
      info(`Client connected: ${socket.id}`);

      socket.join("dashboard_metrics");
      socket.join("machine_states");

      info(
        `Client ${socket.id} subscribed to dashboard_metrics and machine_states`
      );

      socket.on("disconnect", () => {
        info(`Client disconnected: ${socket.id}`);
      });
    });
  }

  private setupFanucNamespace(): void {
    const fanucNS = this.io.of("/fanuc");

    fanucNS.on("connection", (socket: Socket) => {
      info(`Fanuc adapter connected: ${socket.id}`);

      socket.on("data", async (data) => {
        info(`Fanuc data received: ${JSON.stringify(data)}`);
        const processData =
          await this.services.dataCollectorService.processFanucData(data);
        if (processData) {
          this.broadcastDashboardMetrics(processData);
          this.broadcastMachineStates(processData);
        }
      });

      socket.on("disconnect", () => {
        info(`Fanuc adapter disconnected: ${socket.id}`);
      });
    });
  }

  public broadcastDashboardMetrics(data: any): void {
    this.io
      .of("/client")
      .to("dashboard_metrics")
      .emit("dashboard_metrics", data);
  }

  public broadcastMachineStates(data: any): void {
    this.io.of("/client").to("machine_states").emit("machine_states", data);
  }

  public sendStartToFanuc(data: any): Promise<string> {
    return new Promise((resolve, reject) => {
      const fanucNamespace = this.io.of("/fanuc");
      const connectedSockets = fanucNamespace.sockets.size;

      if (connectedSockets === 0) {
        const msg = "No Fanuc adapters connected to send start command";
        error(msg);
        reject(new Error(msg));
        return;
      }

      info(`Sending start command to Fanuc adapters`);

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
      const fanucNamespace = this.io.of("/fanuc");
      const connectedSockets = fanucNamespace.sockets.size;

      if (connectedSockets === 0) {
        const msg = "No Fanuc adapters connected to send stop command";
        error(msg);
        reject(new Error(msg));
        return;
      }

      info(`Sending stop command to Fanuc adapters`);

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
}

export default SocketService;
