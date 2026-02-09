import type { Server as HttpServer } from "node:http";

import { Server } from "socket.io";

import env, { __dev__, __test__ } from "./lib/env";

export function createSocketServer(server: HttpServer) {
  const allowedOrigins = __dev__ || __test__
    ? ["http://localhost:5173", "http://localhost:3000"]
    : env.CORS_ORIGINS?.split(",").map(s => s.trim()) ?? [];

  return new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
    transports: ["polling", "websocket"],
    pingInterval: 5000,
    pingTimeout: 5000,
  });
}
