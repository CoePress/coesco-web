import type { Request, Response } from "express";

import { Router } from "express";
import multer from "multer";

import { BadRequestError, NotFoundError } from "@/middleware/error.middleware";
import { fileStorageService } from "@/services";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    }
    else {
      cb(new BadRequestError("Only image files are allowed"));
    }
  },
});

router.post(
  "/forms/:formId/upload",
  upload.array("files", 10),
  async (req: Request, res: Response) => {
    try {
      const { formId } = req.params;
      const { category = "images" } = req.body;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        throw new BadRequestError("No files provided");
      }

      const storedFiles = [];

      for (const file of files) {
        const storedFile = await fileStorageService.storeTempFile(
          formId,
          file,
          category as "images" | "sketches",
        );
        storedFiles.push({
          id: storedFile.id,
          originalName: storedFile.originalName,
          filename: storedFile.filename,
          mimetype: storedFile.mimetype,
          size: storedFile.size,
          uploadedAt: storedFile.uploadedAt,
        });
      }

      res.json({
        success: true,
        data: storedFiles,
        message: `${files.length} file(s) uploaded successfully`,
      });
    }
    catch (error) {
      console.error("File upload error:", error);
      throw error;
    }
  },
);

router.get(
  "/forms/:formId/submissions/:submissionId/:filename",
  async (req: Request, res: Response) => {
    try {
      const { formId, submissionId, filename } = req.params;

      const filePath = fileStorageService.getFilePathFromUrl(formId, submissionId, filename);

      if (!filePath) {
        throw new NotFoundError("File not found");
      }

      const fileBuffer = fileStorageService.getFile(filePath);
      if (!fileBuffer) {
        throw new NotFoundError("File not found");
      }

      const fileInfo = fileStorageService.getFileInfo(filePath);

      res.set({
        "Content-Type": getContentType(filename),
        "Content-Length": fileBuffer.length.toString(),
        "Last-Modified": fileInfo.mtime?.toUTCString(),
        "Cache-Control": "public, max-age=31536000",
        "ETag": `"${fileInfo.size}-${fileInfo.mtime?.getTime()}"`,
      });

      const ifNoneMatch = req.get("If-None-Match");
      const etag = res.get("ETag");

      if (ifNoneMatch && ifNoneMatch === etag) {
        return res.status(304).end();
      }

      res.send(fileBuffer);
    }
    catch (error) {
      console.error("File serving error:", error);
      throw error;
    }
  },
);

router.get("/stats", async (req: Request, res: Response) => {
  try {
    const stats = fileStorageService.getStorageStats();

    res.json({
      success: true,
      data: {
        ...stats,
        totalSizeFormatted: formatBytes(stats.totalSize),
      },
    });
  }
  catch (error) {
    console.error("Stats error:", error);
    throw error;
  }
});

router.post("/cleanup", async (req: Request, res: Response) => {
  try {
    fileStorageService.cleanupTempFiles();

    res.json({
      success: true,
      message: "Temporary files cleaned up successfully",
    });
  }
  catch (error) {
    console.error("Cleanup error:", error);
    throw error;
  }
});

router.delete(
  "/forms/:formId/submissions/:submissionId",
  async (req: Request, res: Response) => {
    try {
      const { formId, submissionId } = req.params;

      fileStorageService.deleteSubmissionFiles(formId, submissionId);

      res.json({
        success: true,
        message: "Submission files deleted successfully",
      });
    }
    catch (error) {
      console.error("File deletion error:", error);
      throw error;
    }
  },
);

function getContentType(filename: string): string {
  const ext = filename.toLowerCase().split(".").pop();
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
  };
  return mimeTypes[ext || ""] || "application/octet-stream";
}

function formatBytes(bytes: number): string {
  if (bytes === 0)
    return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

export default router;
