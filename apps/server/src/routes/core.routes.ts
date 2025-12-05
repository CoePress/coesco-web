import { Router } from "express";
import multer from "multer";

import { assetController, chatController, imageController, lockController, searchController, settingsController } from "@/controllers";
import { createCrudEntity } from "@/factories";
import { noteRepository, tagRepository } from "@/repositories";

const router = Router();

// Tags - using CRUD factory
createCrudEntity(router, {
  repository: tagRepository,
  entityName: "Tag",
  basePath: "/tags",
  idParam: "tagId",
});

// Notes - using CRUD factory
createCrudEntity(router, {
  repository: noteRepository,
  entityName: "Note",
  basePath: "/notes",
  idParam: "noteId",
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

// Chats
router.post("/chats", chatController.createChat);
router.get("/chats", chatController.getChats);
router.get("/chats/:chatId", chatController.getChat);
router.patch("/chats/:chatId", chatController.updateChat);
router.delete("/chats/:chatId", chatController.deleteChat);
router.get("/chats/:chatId/messages", chatController.getMessages);

// Messages
router.post("/messages", chatController.createMessage);
router.patch("/messages/:messageId", chatController.updateMessage);
router.delete("/messages/:messageId", chatController.deleteMessage);

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

// Search
router.get("/search", searchController.searchEntities);

// Images
router.post("/images", upload.any(), imageController.uploadImages);
router.get("/images", imageController.getAllImages);
router.delete("/images/:id", imageController.deleteImage);

// Assets
router.post("/assets/upload", upload.single("file"), assetController.uploadAsset);
router.post("/assets/upload-multiple", upload.array("files"), assetController.uploadAssets);
router.post("/assets/generate-upload-url", assetController.generateUploadUrl);
router.get("/assets", assetController.listAssets);
router.get("/assets/:id", assetController.getAsset);
router.get("/assets/:id/download", assetController.getDownloadUrl);
router.patch("/assets/:id", assetController.updateAsset);
router.patch("/assets/:id/tags", assetController.updateAssetTags);
router.delete("/assets/:id", assetController.deleteAsset);

export default router;
