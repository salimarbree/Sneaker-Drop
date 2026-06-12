import type { Request, Response } from "express";
import type { RequestWithUser } from "../../shared/types/index.js";
import * as dropService from "./drop.service.js";
import { zodSafeParse } from "../../shared/lib/zodSafeParse.js";
import { createDropSchema } from "./drop.schema.js";

const getAll = async (_req: Request, res: Response) => {
  const drops = await dropService.getAll();
  res.json(drops);
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

export const dropController = { getAll, getById, create };
