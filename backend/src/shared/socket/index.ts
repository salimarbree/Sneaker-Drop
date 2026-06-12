import type { PrismaClient } from "@prisma/client";
import type { Server as SocketIOServer } from "socket.io";

export function setupSocketHandlers(io: SocketIOServer, _prisma: PrismaClient): void {
  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}
