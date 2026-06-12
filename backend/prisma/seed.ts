import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import process from "process";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("123456", 10);

  await prisma.purchase.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.drop.deleteMany();
  await prisma.user.deleteMany();

  const users = await Promise.all([
    prisma.user.create({
      data: {
        username: "admin",
        email: "admin@example.com",
        passwordHash: hash,
        role: "admin",
      },
    }),
    prisma.user.create({
      data: {
        username: "sneakerhead42",
        email: "sneakerhead42@example.com",
        passwordHash: hash,
      },
    }),
    prisma.user.create({
      data: {
        username: "dropsniper",
        email: "dropsniper@example.com",
        passwordHash: hash,
      },
    }),
    prisma.user.create({
      data: {
        username: "heatseeker",
        email: "heatseeker@example.com",
        passwordHash: hash,
      },
    }),
    prisma.user.create({
      data: {
        username: "resell_king",
        email: "resell_king@example.com",
        passwordHash: hash,
      },
    }),
    prisma.user.create({
      data: {
        username: "collector_jay",
        email: "collector_jay@example.com",
        passwordHash: hash,
      },
    }),
  ]);

  console.log(`Seeded ${users.length} users`);

  await prisma.drop.create({
    data: {
      name: "Air Jordan 1 Retro High 'Chicago'",
      description: "The iconic colorway returns. Limited release.",
      imageUrl: "/placeholder-shoe.svg",
      totalStock: 10,
      availableStock: 10,
      startTime: new Date(),
    },
  });

  await prisma.drop.create({
    data: {
      name: "Yeezy Boost 350 V2 'Black/Red'",
      description: "Classic Yeezy silhouette in a fan-favorite colorway.",
      imageUrl: "/placeholder-shoe.svg",
      totalStock: 5,
      availableStock: 5,
      startTime: new Date(),
    },
  });

  await prisma.drop.create({
    data: {
      name: "Nike Dunk Low 'University Blue'",
      description: "Clean and classic dunk silhouette.",
      imageUrl: "/placeholder-shoe.svg",
      totalStock: 15,
      availableStock: 15,
      startTime: new Date(),
    },
  });

  console.log("Seeded 3 drops");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
