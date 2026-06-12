import { Router } from "express";
import { asyncWrapper } from "../../shared/middlewares/asyncWrapper.js";
import { requireAdmin } from "../../shared/middlewares/auth.js";
import { dropController } from "./controller.js";

const router = Router();

router.get("/", asyncWrapper(dropController.getAll));
router.get("/:id", asyncWrapper(dropController.getById));
router.post("/", requireAdmin, asyncWrapper(dropController.create));
router.put("/:id", requireAdmin, asyncWrapper(dropController.update));
router.delete("/:id", requireAdmin, asyncWrapper(dropController.remove));

export default router;
