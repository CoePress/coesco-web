import { authController } from "@/controllers";
import { protect } from "@/middleware/auth.middleware";
import { Router } from "express";

const router = Router();

router.post("/login/test", authController.testLogin);
router.post("/login", authController.login);
router.post("/login/microsoft", authController.loginWithMicrosoft);
router.get("/callback", authController.callback);
router.post("/logout", protect, authController.logout);
router.get("/session", protect, authController.session);

export default router;
