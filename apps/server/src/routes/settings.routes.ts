import { Router } from "express";

import { settingsController } from "@/controllers";

const router = Router();

router.post("/request-password-reset", settingsController.requestPasswordReset);
router.post("/reset-password", settingsController.resetPassword);
router.post("/change-password", settingsController.changePassword);
router.post("/", settingsController.createUserSettings);
router.get("/", settingsController.getUserSettings);
router.get("/:id", settingsController.getUserSetting);
router.patch("/:id", settingsController.updateUserSettings);
router.delete("/:id", settingsController.deleteUserSettings);

export default router;
