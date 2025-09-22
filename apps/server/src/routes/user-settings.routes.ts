import { Router } from "express";

import { userSettingsController } from "@/controllers";

const router = Router();

router.post("/", userSettingsController.createUserSettings);
router.get("/", userSettingsController.getUserSettings);
router.get("/:id", userSettingsController.getUserSetting);
router.patch("/:id", userSettingsController.updateUserSettings);
router.delete("/:id", userSettingsController.deleteUserSettings);

export default router;
