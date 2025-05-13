import { authController } from "@/controllers";
import { Router } from "express";

const router = Router();

router.post("/login", authController.login);
router.post("/login/microsoft", authController.loginWithMicrosoft);
router.get("/callback", authController.callback);
router.post("/logout", authController.logout);
router.get("/session", authController.session);
router.post("/test-login", authController.testLogin);

export default router;
