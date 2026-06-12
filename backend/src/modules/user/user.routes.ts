import { Router } from "express";
import { asyncWrapper } from "../../shared/middlewares/asyncWrapper.js";
import { authenticate } from "../../shared/middlewares/auth.js";
import { userController } from "./user.controller.js";

const router = Router();

router.get("/", asyncWrapper(userController.getAll));
router.post("/register", asyncWrapper(userController.register));
router.post("/login", asyncWrapper(userController.login));
router.get("/me", authenticate, asyncWrapper(userController.getMe));
router.patch("/me", authenticate, asyncWrapper(userController.updateProfile));

export default router;
