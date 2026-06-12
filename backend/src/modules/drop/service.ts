import { prisma } from "../../shared/lib/prisma.js";
import { AppError } from "../../shared/lib/errors.js";
import type { CreateDropInput, UpdateDropInput } from "./schema.js";
import type { Server as SocketIOServer } from "socket.io";

function includePurchases() {
  return {
    purchases: {
      orderBy: { createdAt: "desc" as const },
      take: 3,
      include: { user: { select: { username: true as const } } },
    },
  };
}

export const getAll = async () => {
  return prisma.drop.findMany({
    orderBy: { createdAt: "desc" },
    include: includePurchases(),
  });
};

export const getById = async (id: string) => {
  const drop = await prisma.drop.findUnique({ where: { id }, include: includePurchases() });
  if (!drop) throw new AppError("Drop not found", "NOT_FOUND", 404);
  return drop;
};

export const create = async (data: CreateDropInput, io: SocketIOServer) => {
  const drop = await prisma.drop.create({
    data: {
      name: data.name,
      description: data.description ?? "",
      imageUrl: data.imageUrl || "/placeholder-shoe.svg",
      totalStock: data.totalStock,
      availableStock: data.totalStock,
      startTime: data.startTime ? new Date(data.startTime) : new Date(),
      endTime: data.endTime ? new Date(data.endTime) : null,
    },
  });

  io.emit("drop:created", drop);
  return drop;
};

export const update = async (id: string, data: UpdateDropInput, io: SocketIOServer) => {
  const existing = await prisma.drop.findUnique({ where: { id } });
  if (!existing) throw new AppError("Drop not found", "NOT_FOUND", 404);

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl || "/placeholder-shoe.svg";
  if (data.totalStock !== undefined) {
    const diff = data.totalStock - existing.totalStock;
    updateData.totalStock = data.totalStock;
    updateData.availableStock = Math.max(0, existing.availableStock + diff);
  }
  if (data.startTime !== undefined) updateData.startTime = new Date(data.startTime);
  if (data.endTime !== undefined) updateData.endTime = data.endTime ? new Date(data.endTime) : null;

  const drop = await prisma.drop.update({ where: { id }, data: updateData });
  io.emit("drop:updated", drop);
  return drop;
};

export const remove = async (id: string, io: SocketIOServer) => {
  const existing = await prisma.drop.findUnique({ where: { id } });
  if (!existing) throw new AppError("Drop not found", "NOT_FOUND", 404);

  await prisma.drop.delete({ where: { id } });
  io.emit("drop:deleted", { id });
};
