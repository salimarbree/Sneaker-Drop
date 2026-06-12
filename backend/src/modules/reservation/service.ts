import { prisma } from "../../shared/lib/prisma.js";
import { AppError } from "../../shared/lib/errors.js";
import type { Server as SocketIOServer } from "socket.io";
import type { CreateReservationInput } from "./schema.js";

const RESERVATION_TTL_MS = 60_000;

async function recoverExpiredForDrop(dropId: string, io: SocketIOServer) {
  const expired = await prisma.reservation.findMany({
    where: { dropId, status: "active", expiresAt: { lte: new Date() } },
  });
  for (const reservation of expired) {
    await prisma.$transaction(async (tx) => {
      const current = await tx.reservation.findUnique({ where: { id: reservation.id } });
      if (!current || current.status !== "active") return;
      await tx.reservation.update({ where: { id: reservation.id }, data: { status: "expired" } });
      await tx.drop.update({ where: { id: dropId }, data: { availableStock: { increment: 1 } } });
    });
    const updatedDrop = await prisma.drop.findUnique({ where: { id: dropId } });
    if (updatedDrop) {
      io.emit("stock:updated", { dropId, availableStock: updatedDrop.availableStock, totalStock: updatedDrop.totalStock });
    }
  }
}

export const create = async (
  data: CreateReservationInput,
  io: SocketIOServer,
) => {
  const { userId, dropId } = data;

  await recoverExpiredForDrop(dropId, io);

  const result = await prisma.$transaction(async (tx) => {
    const drop = await tx.drop.findUnique({ where: { id: dropId } });

    if (!drop) {
      throw new AppError("Drop not found", "DROP_NOT_FOUND", 409);
    }

    if (drop.availableStock <= 0) {
      throw new AppError("Out of stock", "OUT_OF_STOCK", 409);
    }

    const existingActive = await tx.reservation.findFirst({
      where: {
        userId,
        dropId,
        status: "active",
        expiresAt: { gt: new Date() },
      },
    });

    if (existingActive) {
      throw new AppError(
        "You already have an active reservation for this drop",
        "ALREADY_RESERVED",
        409,
      );
    }

    const updated = await tx.drop.updateMany({
      where: { id: dropId, availableStock: { gt: 0 } },
      data: { availableStock: { decrement: 1 } },
    });

    if (updated.count === 0) {
      throw new AppError("Stock unavailable", "OVERSOLD", 409);
    }

    const expiresAt = new Date(Date.now() + RESERVATION_TTL_MS);

    const reservation = await tx.reservation.create({
      data: { userId, dropId, status: "active", expiresAt },
    });

    const updatedDrop = await tx.drop.findUnique({ where: { id: dropId } });

    return { reservation, updatedDrop: updatedDrop! };
  });

  io.emit("stock:updated", {
    dropId: result.reservation.dropId,
    availableStock: result.updatedDrop.availableStock,
    totalStock: result.updatedDrop.totalStock,
  });

  return {
    reservation: result.reservation,
    availableStock: result.updatedDrop.availableStock,
  };
};
