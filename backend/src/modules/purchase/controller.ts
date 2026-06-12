import type { Request, Response } from "express";
import type { RequestWithUser } from "../../shared/types/index.js";
import * as purchaseService from "./service.js";
import { zodSafeParse } from "../../shared/lib/zodSafeParse.js";
import { createPurchaseSchema } from "./schema.js";

const create = async (req: Request, res: Response) => {
  const parsed = zodSafeParse(req.body, createPurchaseSchema);
  const result = await purchaseService.create(
    parsed,
    (req as RequestWithUser).io,
  );
  res.json(result);
};

export const purchaseController = { create };
