import { Router } from "express";

import { fileStoreController } from "../controllers";

const router = Router();

// Get storage information (must be before /:fileId routes)
router.get("/storage/info", fileStoreController.getStorageInfo);

// File upload - for uploading resources
router.post("/upload", fileStoreController.uploadFile);

// List all resources with optional filters (pagination, sorting, tags)
router.get("/resources", fileStoreController.listFiles);

// Get recently added resources
router.get("/resources/recent", fileStoreController.getRecentFiles);

// Get file/resource by ID for preview
router.get("/resources/:fileId", fileStoreController.getFileMetadata);

// Preview file/resource (inline display)
router.get("/resources/:fileId/preview", fileStoreController.previewFile);

// Download file/resource
router.get("/resources/:fileId/download", fileStoreController.getFile);

// Update resource metadata (tags, name, etc)
router.patch("/resources/:fileId", fileStoreController.updateFileMetadata);

// Delete resource
router.delete("/resources/:fileId", fileStoreController.deleteFile);

export default router;
