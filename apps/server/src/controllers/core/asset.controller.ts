import type { AssetType } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

import { assetService } from "@/services/core/asset.service";

export class AssetController {
  async uploadAsset(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const uploadedById = (req as any).user?.employeeId;
      const tags = req.body.tags ? JSON.parse(req.body.tags) : [];
      const isPublic = req.body.isPublic === "true";
      const generateThumbnail = req.body.generateThumbnail === "true";

      const asset = await assetService.uploadAsset(req.file, uploadedById, {
        tags,
        isPublic,
        generateThumbnail,
      });

      res.status(200).json(asset);
    }
    catch (error) {
      next(error);
    }
  }

  async uploadAssets(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        return res.status(400).json({ error: "No files provided" });
      }

      const uploadedById = (req as any).user?.employeeId;
      const tags = req.body.tags ? JSON.parse(req.body.tags) : [];
      const isPublic = req.body.isPublic === "true";
      const generateThumbnail = req.body.generateThumbnail === "true";

      const assets = await assetService.uploadAssets(
        req.files as Express.Multer.File[],
        uploadedById,
        {
          tags,
          isPublic,
          generateThumbnail,
        },
      );

      res.status(200).json({ assets });
    }
    catch (error) {
      next(error);
    }
  }

  async getAsset(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const asset = await assetService.getAsset(id);

      if (!asset) {
        return res.status(404).json({ error: "Asset not found" });
      }

      res.status(200).json(asset);
    }
    catch (error) {
      next(error);
    }
  }

  async listAssets(req: Request, res: Response, next: NextFunction) {
    try {
      const type = req.query.type as AssetType | undefined;
      const tags = req.query.tags ? (req.query.tags as string).split(",") : undefined;
      const uploadedById = req.query.uploadedById as string | undefined;
      const limit = req.query.limit ? Number.parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? Number.parseInt(req.query.offset as string) : 0;

      const result = await assetService.listAssets({
        type,
        tags,
        uploadedById,
        limit,
        offset,
      });

      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteAsset(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const hardDelete = req.query.hard === "true";

      await assetService.deleteAsset(id, hardDelete);

      res.status(200).json({ message: "Asset deleted successfully" });
    }
    catch (error) {
      next(error);
    }
  }

  async updateAssetTags(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { tags } = req.body;

      if (!Array.isArray(tags)) {
        return res.status(400).json({ error: "Tags must be an array" });
      }

      const asset = await assetService.updateAssetTags(id, tags);

      res.status(200).json(asset);
    }
    catch (error) {
      next(error);
    }
  }

  async getDownloadUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const expiresIn = req.query.expiresIn ? Number.parseInt(req.query.expiresIn as string) : 3600;

      const url = await assetService.getDownloadUrl(id, expiresIn);

      res.status(200).json({ url });
    }
    catch (error) {
      next(error);
    }
  }

  async generateUploadUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const { filename, mimeType } = req.body;

      if (!filename || !mimeType) {
        return res.status(400).json({ error: "Filename and mimeType are required" });
      }

      const uploadedById = (req as any).user?.employeeId;
      const expiresIn = req.body.expiresIn ? Number.parseInt(req.body.expiresIn) : 3600;

      const result = await assetService.generateUploadUrl(
        filename,
        mimeType,
        uploadedById,
        expiresIn,
      );

      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }
}

export const assetController = new AssetController();
