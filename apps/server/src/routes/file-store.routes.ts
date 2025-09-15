import { Router } from "express";

import { fileStoreController } from "../controllers";

const router = Router();

// Get storage information (must be before /:fileId routes)
router.get("/storage/info", fileStoreController.getStorageInfo);

// File upload
router.post("/upload", fileStoreController.uploadFile);

// List files with optional filters
router.get("/", fileStoreController.listFiles);

// Get file content
router.get("/:fileId/download", fileStoreController.getFile);

// Get file metadata
router.get("/:fileId", fileStoreController.getFileMetadata);

// Update file metadata
router.patch("/:fileId", fileStoreController.updateFileMetadata);

// Delete file
router.delete("/:fileId", fileStoreController.deleteFile);

export default router;