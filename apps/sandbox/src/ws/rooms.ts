import type { Server, Socket } from "socket.io";

export function registerRooms(io: Server, socket: Socket) {
  socket.join(`user:${socket.data.userId}`);

  socket.on("account:join", ({ accountId }: { accountId: string }) => {
    socket.join(`account:${accountId}`);
  });

  socket.on("deal:join", ({ dealId }: { dealId: string }) => {
    socket.join(`deal:${dealId}`);
  });
}
