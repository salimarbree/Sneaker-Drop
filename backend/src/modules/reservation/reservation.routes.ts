import { Router } from "express";
import { asyncWrapper } from "../../shared/middlewares/asyncWrapper.js";
import { reservationController } from "./reservation.controller.js";

const router = Router();

router.post("/", asyncWrapper(reservationController.create));

export default router;
