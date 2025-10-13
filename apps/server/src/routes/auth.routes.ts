import { Router } from "express";

import { protect } from "@/middleware/auth.middleware";

import { authController } from "../controllers";

const router = Router();

router.post("/login", authController.login);
router.get("/microsoft/login", authController.microsoftLogin);
router.post("/microsoft/callback", authController.microsoftCallback);
router.post("/logout", authController.logout);
router.get("/session", protect, authController.session);

// Development only - create dev user
if (process.env.NODE_ENV === "development") {
    router.post("/dev/setup", async (req, res, next) => {
        try {
            const { authService } = await import("../services");
            const result = await authService.testLogin();
            res.json({
                message: "Development user created/updated successfully",
                credentials: {
                    username: "dev",
                    password: "DevPassword123!"
                },
                user: result.user,
                employee: result.employee
            });
        } catch (error) {
            next(error);
        }
    });
}

export default router;
