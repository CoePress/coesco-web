import type { AssetType } from "@prisma/client";
import type { Request, Response } from "express";

import { assetService } from "@/services/core/asset.service";
import { asyncWrapper } from "@/utils";
import { HTTP_STATUS } from "@/utils/constants";

export class AssetController {
  uploadAsset = asyncWrapper(async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "No file provided" });
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

    res.status(HTTP_STATUS.OK).json(asset);
  });

  uploadAssets = asyncWrapper(async (req: Request, res: Response) => {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "No files provided" });
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

    res.status(HTTP_STATUS.OK).json({ assets });
  });

  getAsset = asyncWrapper(async (req: Request, res: Response) => {
    const { id } = req.params;
    const asset = await assetService.getAsset(id);

    if (!asset) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: "Asset not found" });
    }

    res.status(HTTP_STATUS.OK).json(asset);
  });

  listAssets = asyncWrapper(async (req: Request, res: Response) => {
    const page = req.query.page ? Number.parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? Number.parseInt(req.query.limit as string) : 50;
    const sort = (req.query.sort as string) || "createdAt";
    const order = (req.query.order as "asc" | "desc") || "desc";
    const search = req.query.search as string | undefined;

    const filter = req.query.filter ? JSON.parse(req.query.filter as string) : {};

    const type = filter.type as AssetType | undefined;
    const status = filter.status as string | undefined;
    const isPublic = filter.isPublic !== undefined ? filter.isPublic === "true" : undefined;
    const tags = req.query.tags ? (req.query.tags as string).split(",") : undefined;
    const uploadedById = req.query.uploadedById as string | undefined;

    const offset = (page - 1) * limit;

    const result = await assetService.listAssets({
      type,
      status,
      isPublic,
      tags,
      uploadedById,
      search,
      sort,
      order,
      limit,
      offset,
    });

    const totalPages = Math.ceil(result.total / limit);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result.assets,
      meta: {
        total: result.total,
        page,
        totalPages,
        limit,
      },
    });
  });

  deleteAsset = asyncWrapper(async (req: Request, res: Response) => {
    const { id } = req.params;
    const hardDelete = req.query.hard === "true";

    await assetService.deleteAsset(id, hardDelete);

    res.status(HTTP_STATUS.OK).json({ message: "Asset deleted successfully" });
  });

  updateAsset = asyncWrapper(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { originalName, tags, isPublic } = req.body;

    const updateData: { originalName?: string; tags?: string[]; isPublic?: boolean } = {};

    if (originalName !== undefined)
      updateData.originalName = originalName;
    if (tags !== undefined) {
      if (!Array.isArray(tags)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "Tags must be an array" });
      }
      updateData.tags = tags;
    }
    if (isPublic !== undefined)
      updateData.isPublic = isPublic;

    const asset = await assetService.updateAsset(id, updateData);

    res.status(HTTP_STATUS.OK).json(asset);
  });

  updateAssetTags = asyncWrapper(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { tags } = req.body;

    if (!Array.isArray(tags)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "Tags must be an array" });
    }

    const asset = await assetService.updateAssetTags(id, tags);

    res.status(HTTP_STATUS.OK).json(asset);
  });

  getDownloadUrl = asyncWrapper(async (req: Request, res: Response) => {
    const { id } = req.params;
    const expiresIn = req.query.expiresIn ? Number.parseInt(req.query.expiresIn as string) : 3600;

    const url = await assetService.getDownloadUrl(id, expiresIn);

    res.status(HTTP_STATUS.OK).json({ url });
  });

  generateUploadUrl = asyncWrapper(async (req: Request, res: Response) => {
    const { filename, mimeType } = req.body;

    if (!filename || !mimeType) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "Filename and mimeType are required" });
    }

    const uploadedById = (req as any).user?.employeeId;
    const expiresIn = req.body.expiresIn ? Number.parseInt(req.body.expiresIn) : 3600;

    const result = await assetService.generateUploadUrl(
      filename,
      mimeType,
      uploadedById,
      expiresIn,
    );

    res.status(HTTP_STATUS.OK).json(result);
  });
}

export const assetController = new AssetController();
