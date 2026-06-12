import type { Request, Response } from "express";
import type { RequestWithUser } from "../../shared/types/index.js";
import * as dropService from "./service.js";
import { zodSafeParse } from "../../shared/lib/zodSafeParse.js";
import { createDropSchema, updateDropSchema } from "./schema.js";

const getAll = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 8;
  const result = await dropService.getAll(page, limit);
  res.json(result);
};

const getById = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const drop = await dropService.getById(id);
  res.json(drop);
};

const create = async (req: Request, res: Response) => {
  const parsed = zodSafeParse(req.body, createDropSchema);
  const drop = await dropService.create(parsed, (req as RequestWithUser).io);
  res.status(201).json(drop);
};

const update = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const parsed = zodSafeParse(req.body, updateDropSchema);
  const drop = await dropService.update(id, parsed, (req as RequestWithUser).io);
  res.json(drop);
};

const remove = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await dropService.remove(id, (req as RequestWithUser).io);
  res.json({ ok: true });
};

export const dropController = { getAll, getById, create, update, remove };
