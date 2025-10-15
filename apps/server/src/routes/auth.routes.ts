import { Router } from "express";

import { authController } from "@/controllers";
import { protect } from "@/middleware/auth.middleware";

const router = Router();

router.post("/login", authController.login);
router.get("/microsoft/login", authController.microsoftLogin);
router.post("/microsoft/callback", authController.microsoftCallback);
router.post("/logout", authController.logout);
router.get("/session", protect, authController.session);

export default router;
