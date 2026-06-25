import { Router } from "express";
import { health, register, login, adminCreateUser } from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/health", health);
router.post("/register", register);
router.post("/login", login);
router.post("/admin/create-user", requireAuth, adminCreateUser);

export default router;
