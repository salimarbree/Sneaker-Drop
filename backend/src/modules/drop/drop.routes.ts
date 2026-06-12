import { Router } from "express";
import { asyncWrapper } from "../../shared/middlewares/asyncWrapper.js";
import { dropController } from "./drop.controller.js";

const router = Router();

router.get("/", asyncWrapper(dropController.getAll));
router.get("/:id", asyncWrapper(dropController.getById));
router.post("/", asyncWrapper(dropController.create));

export default router;
