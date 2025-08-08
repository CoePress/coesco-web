import { Router } from "express";

import { authController } from "../controllers";

const router = Router();

router.post("/login", authController.login);
router.post("/login/microsoft", authController.microsoftLogin);
router.post("/callback/microsoft", authController.microsoftCallback);
router.post("/logout", authController.logout);
router.get("/me", authController.me);
router.get("/recent", authController.recentActivity);
router.get("/sessions", authController.getSessions);
router.delete("/sessions", authController.deleteSessions);
router.delete("/sessions/:sessionId", authController.deleteSession);

export default router;
