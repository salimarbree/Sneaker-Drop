import type { Request, Response } from "express";
import type { RequestWithUser } from "../../shared/types/index.js";
import * as userService from "./user.service.js";
import { zodSafeParse } from "../../shared/lib/zodSafeParse.js";
import { registerSchema, loginSchema, updateProfileSchema } from "./user.schema.js";

const getAll = async (_req: Request, res: Response) => {
  const users = await userService.getAll();
  res.json(users);
};

const getMe = async (req: Request, res: Response) => {
  const user = await userService.getById((req as RequestWithUser).user.userId);
  res.json(user);
};

const register = async (req: Request, res: Response) => {
  const parsed = zodSafeParse(req.body, registerSchema);
  const result = await userService.register(parsed);
  res.status(201).json(result);
};

const login = async (req: Request, res: Response) => {
  const parsed = zodSafeParse(req.body, loginSchema);
  const result = await userService.login(parsed);
  res.json(result);
};

const updateProfile = async (req: Request, res: Response) => {
  const parsed = zodSafeParse(req.body, updateProfileSchema);
  const user = await userService.updateProfile((req as RequestWithUser).user.userId, parsed);
  res.json(user);
};

export const userController = { getAll, getMe, register, login, updateProfile };
