import { prisma } from "../../shared/lib/prisma.js";
import { AppError } from "../../shared/lib/errors.js";
import type { Server as SocketIOServer } from "socket.io";
import type { CreatePurchaseInput } from "./schema.js";

export const create = async (data: CreatePurchaseInput, io: SocketIOServer) => {
  const { userId, dropId, reservationId } = data;

  const result = await prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({
      where: { id: reservationId },
    });

    if (
      !reservation ||
      reservation.userId !== userId ||
      reservation.dropId !== dropId
    ) {
      throw new AppError("Invalid reservation", "INVALID_RESERVATION", 400);
    }

    if (reservation.status !== "active") {
      throw new AppError("Reservation expired", "RESERVATION_EXPIRED", 409);
    }

    if (reservation.expiresAt < new Date()) {
      await tx.reservation.update({
        where: { id: reservationId },
        data: { status: "expired" },
      });

      await tx.drop.update({
        where: { id: dropId },
        data: { availableStock: { increment: 1 } },
      });

      throw new AppError("Reservation expired", "RESERVATION_EXPIRED", 409);
    }

    await tx.reservation.update({
      where: { id: reservationId },
      data: { status: "purchased" },
    });

    const purchase = await tx.purchase.create({
      data: { userId, dropId, reservationId },
      include: { user: { select: { username: true } } },
    });

    const updatedDrop = await tx.drop.findUnique({ where: { id: dropId } });

    return { purchase, updatedDrop: updatedDrop! };
  });

  io.emit("stock:updated", {
    dropId,
    availableStock: result.updatedDrop.availableStock,
    totalStock: result.updatedDrop.totalStock,
  });

  io.emit("purchase:new", {
    dropId,
    username: result.purchase.user.username,
    createdAt: result.purchase.createdAt,
  });

  return {
    purchase: result.purchase,
    availableStock: result.updatedDrop.availableStock,
  };
};
