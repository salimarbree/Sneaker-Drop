import { prisma } from "../../shared/lib/prisma.js";
import { AppError } from "../../shared/lib/errors.js";
import bcrypt from "bcryptjs";
import { signToken } from "../../shared/middlewares/auth.js";
import { publicUserSelect } from "./schema.js";
import type {
  RegisterInput,
  LoginInput,
  UpdateProfileInput,
} from "./schema.js";

export const getAll = async () => {
  return prisma.user.findMany({
    select: publicUserSelect,
    orderBy: { username: "asc" },
  });
};

export const getById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: publicUserSelect,
  });
  if (!user) throw new AppError("User not found", "NOT_FOUND", 404);
  return user;
};

export const register = async (data: RegisterInput) => {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: data.email }, { username: data.username }],
    },
  });

  if (existing) {
    throw new AppError(
      existing.email === data.email
        ? "Email already in use"
        : "Username already taken",
      "DUPLICATE",
      409,
    );
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      username: data.username,
      email: data.email,
      passwordHash,
    },
    select: publicUserSelect,
  });

  const token = signToken({ userId: user.id, username: user.username });

  return { user, token };
};

export const login = async (data: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new AppError("Invalid email or password", "INVALID_CREDENTIALS", 400);
  }

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) {
    throw new AppError("Invalid email or password", "INVALID_CREDENTIALS", 400);
  }

  const token = signToken({ userId: user.id, username: user.username });

  const { passwordHash: _, ...publicUser } = user;

  return { user: publicUser, token };
};

export const updateProfile = async (
  userId: string,
  data: UpdateProfileInput,
) => {
  if (data.email) {
    const existing = await prisma.user.findFirst({
      where: { email: data.email, id: { not: userId } },
    });
    if (existing) throw new AppError("Email already in use", "DUPLICATE", 409);
  }

  if (data.username) {
    const existing = await prisma.user.findFirst({
      where: { username: data.username, id: { not: userId } },
    });
    if (existing)
      throw new AppError("Username already taken", "DUPLICATE", 409);
  }

  const updateData: Record<string, string> = {};
  if (data.username) updateData.username = data.username;
  if (data.email) updateData.email = data.email;
  if (data.password)
    updateData.passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: publicUserSelect,
  });

  return user;
};
