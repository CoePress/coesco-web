import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import cookie from "cookie";
import { verifyAccessToken } from "../lib/auth";
import { registerRooms } from "./rooms";
import { registerHandlers } from "./handlers";
import logger from "../lib/logger";

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: { origin: true, credentials: true },
  });

  logger.info("ws.started");

  io.use((socket, next) => {
    logger.info("ws.cookies", { cookie: socket.request.headers.cookie });

    try {
      const cookies = cookie.parse(socket.request.headers.cookie ?? "");
      const token = cookies.access;
      const claims = verifyAccessToken(token);
      socket.data.userId = claims.sub;
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    logger.info("ws.connected", { socketId: socket.id, userId: socket.data.userId });

    registerRooms(io, socket);
    registerHandlers(io, socket);

    socket.on("disconnect", (reason) => {
      logger.info("ws.disconnected", { socketId: socket.id, userId: socket.data.userId, reason });
    });
  });

  return io;
}

// io.to("project:123").emit("project.updated", { status: "done" });
// io.to("user:456").emit("notification", { msg: "hello" });
