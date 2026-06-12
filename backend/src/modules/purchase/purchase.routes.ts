import { Router } from "express";
import { asyncWrapper } from "../../shared/middlewares/asyncWrapper.js";
import { purchaseController } from "./purchase.controller.js";

const router = Router();

router.post("/", asyncWrapper(purchaseController.create));

export default router;
