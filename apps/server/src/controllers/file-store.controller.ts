import type { NextFunction, Request, Response } from "express";

import { FileStoreService } from "@/services/core/file-store.service";

export class FileStoreController {
  private fileStoreService: FileStoreService;

  constructor() {
    this.fileStoreService = new FileStoreService();
  }

  uploadFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const contentType = req.get("Content-Type") || "application/octet-stream";
      const fileName = req.get("X-File-Name") || "uploaded-file";
      const { category, tags, preserveOriginalName } = req.query;
      const userId = (req as any).user?.id;

      if (!req.body || req.body.length === 0) {
        return res.status(400).json({ error: "No file data provided" });
      }

      // Convert request body to buffer if it's not already
      const fileBuffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body);

      const metadata = await this.fileStoreService.storeFile(
        fileBuffer,
        fileName,
        contentType,
        {
          category: category as string,
          tags: tags ? JSON.parse(tags as string) : undefined,
          uploadedBy: userId,
          preserveOriginalName: preserveOriginalName === "true",
        },
      );

      res.status(201).json(metadata);
    }
    catch (error) {
      next(error);
    }
  };

  previewFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fileId } = req.params;
      const file = await this.fileStoreService.getFile(fileId);

      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      res.set({
        "Content-Type": file.metadata.mimeType,
        "Content-Disposition": `inline; filename="${file.metadata.originalName}"`,
        "Content-Length": file.metadata.size.toString(),
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      });

      res.send(file.buffer);
    }
    catch (error) {
      next(error);
    }
  };

  getFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fileId } = req.params;
      const file = await this.fileStoreService.getFile(fileId);

      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      res.set({
        "Content-Type": file.metadata.mimeType,
        "Content-Disposition": `attachment; filename="${file.metadata.originalName}"`,
        "Content-Length": file.metadata.size.toString(),
      });

      res.send(file.buffer);
    }
    catch (error) {
      next(error);
    }
  };

  getFileMetadata = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fileId } = req.params;
      const metadata = await this.fileStoreService.getFileMetadata(fileId);

      if (!metadata) {
        return res.status(404).json({ error: "File not found" });
      }

      res.json(metadata);
    }
    catch (error) {
      next(error);
    }
  };

  listFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category, tag, uploadedBy, mimeType, page = 1, limit = 25, sortBy, sortOrder } = req.query;

      const filters = {
        category: category as string,
        tag: tag as string,
        uploadedBy: uploadedBy as string,
        mimeType: mimeType as string,
      };

      // Remove undefined values
      Object.keys(filters).forEach((key) => {
        if (filters[key as keyof typeof filters] === undefined) {
          delete filters[key as keyof typeof filters];
        }
      });

      const files = await this.fileStoreService.listFiles(
        Object.keys(filters).length > 0 ? filters : undefined,
      );

      // Apply sorting if requested
      let sortedFiles = [...files];
      if (sortBy) {
        sortedFiles.sort((a, b) => {
          const aVal = a[sortBy as keyof typeof a];
          const bVal = b[sortBy as keyof typeof b];

          if (aVal === undefined || bVal === undefined) {
            return 0;
          }

          const order = sortOrder === "desc" ? -1 : 1;

          if (aVal > bVal)
            return order;
          if (aVal < bVal)
            return -order;
          return 0;
        });
      }

      // Apply pagination
      const pageNum = Number.parseInt(page as string);
      const limitNum = Number.parseInt(limit as string);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedFiles = sortedFiles.slice(startIndex, endIndex);

      res.json({
        data: paginatedFiles,
        total: files.length,
        page: pageNum,
        totalPages: Math.ceil(files.length / limitNum),
      });
    }
    catch (error) {
      next(error);
    }
  };

  getRecentFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { limit = 6 } = req.query;
      const limitNum = Number.parseInt(limit as string);

      const files = await this.fileStoreService.listFiles();

      // Sort by uploadedAt descending and take the most recent ones
      const recentFiles = files
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
        .slice(0, limitNum);

      res.json(recentFiles);
    }
    catch (error) {
      next(error);
    }
  };

  deleteFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fileId } = req.params;
      const success = await this.fileStoreService.deleteFile(fileId);

      if (!success) {
        return res.status(404).json({ error: "File not found or could not be deleted" });
      }

      res.status(204).send();
    }
    catch (error) {
      next(error);
    }
  };

  updateFileMetadata = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fileId } = req.params;
      const { category, tags } = req.body;

      const updatedMetadata = await this.fileStoreService.updateMetadata(fileId, {
        category,
        tags,
      });

      if (!updatedMetadata) {
        return res.status(404).json({ error: "File not found" });
      }

      res.json(updatedMetadata);
    }
    catch (error) {
      next(error);
    }
  };

  getStorageInfo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const info = await this.fileStoreService.getStorageInfo();
      res.json(info);
    }
    catch (error) {
      next(error);
    }
  };
}
