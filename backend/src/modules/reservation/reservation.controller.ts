import type { Request, Response } from "express";
import type { RequestWithUser } from "../../shared/types/index.js";
import * as reservationService from "./reservation.service.js";
import { zodSafeParse } from "../../shared/lib/zodSafeParse.js";
import { createReservationSchema } from "./reservation.schema.js";

const create = async (req: Request, res: Response) => {
  const parsed = zodSafeParse(req.body, createReservationSchema);
  const result = await reservationService.create(parsed, (req as RequestWithUser).io);
  res.status(201).json(result);
};

export const reservationController = { create };
