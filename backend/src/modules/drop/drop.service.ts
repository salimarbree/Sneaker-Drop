import { prisma } from "../../shared/lib/prisma.js";
import { AppError } from "../../shared/lib/errors.js";
import type { CreateDropInput } from "./drop.schema.js";
import type { Server as SocketIOServer } from "socket.io";

export const getAll = async () => {
  return prisma.drop.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      purchases: {
        orderBy: { createdAt: "desc" },
        take: 3,
        include: { user: { select: { username: true } } },
      },
    },
  });
};

export const getById = async (id: string) => {
  const drop = await prisma.drop.findUnique({
    where: { id },
    include: {
      purchases: {
        orderBy: { createdAt: "desc" },
        take: 3,
        include: { user: { select: { username: true } } },
      },
    },
  });

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
