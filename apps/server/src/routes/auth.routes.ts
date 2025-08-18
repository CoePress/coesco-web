import { Router } from "express";

import { authController } from "../controllers";

const router = Router();

router.post("/login", authController.login);
router.get("/microsoft/login", authController.microsoftLogin);
router.post("/microsoft/callback", authController.microsoftCallback);
router.post("/logout", authController.logout);
router.get("/session", authController.session);

export default router;
