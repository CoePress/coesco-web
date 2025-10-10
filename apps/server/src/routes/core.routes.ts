import { lockController, settingsController, tagController } from "@/controllers";
import { Router } from "express";

const router = Router()

// Locks
router.post("/locks/acquire", lockController.acquireLock);
router.post("/locks/release", lockController.releaseLock);
router.post("/locks/force-release", lockController.forceReleaseLock);
router.post("/locks/extend", lockController.extendLock);
router.get("/locks/status/:recordType/:recordId", lockController.getLockStatus);
router.get("/locks", lockController.getAllLocks);
router.get("/locks/:recordType", lockController.getAllLocksByRecordType);
router.delete("/locks", lockController.clearAllLocks);

// Settings
router.post("/settings/request-password-reset", settingsController.requestPasswordReset);
router.post("/settings/reset-password", settingsController.resetPassword);
router.post("/settings/change-password", settingsController.changePassword);
router.post("/settings", settingsController.createUserSettings);
router.get("/settings", settingsController.getUserSettings);
router.get("/settings/:id", settingsController.getUserSetting);
router.patch("/settings/:id", settingsController.updateUserSettings);
router.delete("/settings/:id", settingsController.deleteUserSettings);

// Tags
router.post("/tags", tagController.createTag);
router.get("/tags", tagController.getTags);
router.get("/tags/:tagId", tagController.getTag);
router.patch("/tags/:tagId", tagController.updateTag);
router.delete("/tags/:tagId", tagController.deleteTag);

export default router