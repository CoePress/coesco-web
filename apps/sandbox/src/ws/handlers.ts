import type { Server, Socket } from "socket.io";

export function registerHandlers(io: Server, socket: Socket) {
  socket.on("ping", () => {
    socket.emit("pong");
  });

  socket.on("notify:user", ({ userId, data }) => {
    io.to(`user:${userId}`).emit("notification", data);
  });
}
