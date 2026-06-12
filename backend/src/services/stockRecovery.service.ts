import type { PrismaClient } from "@prisma/client";
import type { Server as SocketIOServer } from "socket.io";

const RECOVERY_INTERVAL_MS = 5_000;

export function startStockRecovery(prisma: PrismaClient, io: SocketIOServer): void {
  async function recoverExpiredReservations(): Promise<void> {
    try {
      const expiredReservations = await prisma.reservation.findMany({
        where: {
          status: "active",
          expiresAt: { lte: new Date() },
        },
      });

      for (const reservation of expiredReservations) {
        await prisma.$transaction(async (tx) => {
          const current = await tx.reservation.findUnique({
            where: { id: reservation.id },
          });

          if (!current || current.status !== "active") return;

          await tx.reservation.update({
            where: { id: reservation.id },
            data: { status: "expired" },
          });

          await tx.drop.update({
            where: { id: reservation.dropId },
            data: { availableStock: { increment: 1 } },
          });
        });

        const updatedDrop = await prisma.drop.findUnique({
          where: { id: reservation.dropId },
        });

        if (updatedDrop) {
          io.emit("stock:updated", {
            dropId: reservation.dropId,
            availableStock: updatedDrop.availableStock,
            totalStock: updatedDrop.totalStock,
          });

          io.emit("reservation:expired", {
            dropId: reservation.dropId,
            reservationId: reservation.id,
          });
        }
      }

      if (expiredReservations.length > 0) {
        console.log(`Recovered ${expiredReservations.length} expired reservation(s)`);
      }
    } catch (err) {
      console.error("Stock recovery error:", err);
    }
  }

  setInterval(recoverExpiredReservations, RECOVERY_INTERVAL_MS);
  console.log("Stock recovery service started (check every 5s)");
}
