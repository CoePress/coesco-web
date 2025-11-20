/* eslint-disable node/no-process-env */
/* eslint-disable node/prefer-global/process */
import type { Asset, AssetStatus, AssetType } from "@prisma/client";
import type { Buffer } from "node:buffer";

import mime from "mime-types";
import path from "node:path";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

import { prisma } from "@/utils/prisma";

import { storageService } from "../storage";

interface UploadAssetOptions {
  tags?: string[];
  isPublic?: boolean;
  generateThumbnail?: boolean;
  maxThumbnailWidth?: number;
  maxThumbnailHeight?: number;
}

export class AssetService {
  private async determineAssetType(mimeType: string): Promise<AssetType> {
    if (mimeType.startsWith("image/"))
      return "IMAGE";
    if (mimeType.startsWith("video/"))
      return "VIDEO";
    if (mimeType.startsWith("audio/"))
      return "AUDIO";
    if (mimeType.includes("pdf") || mimeType.includes("document") || mimeType.includes("text") || mimeType.includes("msword") || mimeType.includes("spreadsheet") || mimeType.includes("presentation")) {
      return "DOCUMENT";
    }
    if (mimeType.includes("zip") || mimeType.includes("tar") || mimeType.includes("rar") || mimeType.includes("7z")) {
      return "ARCHIVE";
    }
    return "OTHER";
  }

  private generateKey(originalName: string, folder?: string): string {
    const ext = path.extname(originalName);
    const timestamp = new Date().toISOString().split("T")[0].replace(/-/g, "/");
    const uuid = uuidv4();
    const filename = `${uuid}${ext}`;

    if (folder) {
      return `${folder}/${timestamp}/${filename}`;
    }

    return `${timestamp}/${filename}`;
  }

  async uploadAsset(
    file: Express.Multer.File,
    uploadedById?: string,
    options?: UploadAssetOptions,
  ): Promise<Asset> {
    const mimeType = file.mimetype || mime.lookup(file.originalname) || "application/octet-stream";
    const type = await this.determineAssetType(mimeType);
    const key = this.generateKey(file.originalname, type.toLowerCase());

    const uploadResult = await storageService.upload(key, file.buffer, {
      contentType: mimeType,
      isPublic: options?.isPublic || false,
      metadata: {
        originalName: file.originalname,
        uploadedById: uploadedById || "system",
      },
    });

    let thumbnailUrl: string | undefined;

    if (options?.generateThumbnail && type === "IMAGE") {
      thumbnailUrl = await this.generateThumbnail(
        file.buffer,
        key,
        options.maxThumbnailWidth,
        options.maxThumbnailHeight,
      );
    }

    const asset = await prisma.asset.create({
      data: {
        key,
        filename: path.basename(key),
        originalName: file.originalname,
        mimeType,
        size: uploadResult.size,
        type,
        status: "READY",
        storageProvider: process.env.STORAGE_PROVIDER || "local",
        url: uploadResult.url,
        cdnUrl: uploadResult.cdnUrl,
        thumbnailUrl,
        tags: options?.tags || [],
        isPublic: options?.isPublic || false,
        uploadedById,
      },
    });

    return asset;
  }

  async uploadAssets(
    files: Express.Multer.File[],
    uploadedById?: string,
    options?: UploadAssetOptions,
  ): Promise<Asset[]> {
    return Promise.all(files.map(file => this.uploadAsset(file, uploadedById, options)));
  }

  private async generateThumbnail(
    imageBuffer: Buffer,
    originalKey: string,
    maxWidth = 400,
    maxHeight = 400,
  ): Promise<string> {
    const thumbnailBuffer = await sharp(imageBuffer)
      .resize(maxWidth, maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer();

    const ext = path.extname(originalKey);
    const thumbnailKey = originalKey.replace(ext, "_thumb.webp");

    const result = await storageService.upload(thumbnailKey, thumbnailBuffer, {
      contentType: "image/webp",
      isPublic: true,
    });

    return result.cdnUrl || result.url;
  }

  async getAsset(id: string): Promise<Asset | null> {
    return prisma.asset.findUnique({
      where: { id, deletedAt: null },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async listAssets(filters?: {
    type?: AssetType;
    tags?: string[];
    uploadedById?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ assets: Asset[]; total: number }> {
    const where: any = {
      deletedAt: null,
    };

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    if (filters?.uploadedById) {
      where.uploadedById = filters.uploadedById;
    }

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        include: {
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      prisma.asset.count({ where }),
    ]);

    return { assets, total };
  }

  async deleteAsset(id: string, hardDelete = false): Promise<void> {
    const asset = await prisma.asset.findUnique({
      where: { id },
    });

    if (!asset) {
      throw new Error("Asset not found");
    }

    if (hardDelete) {
      await storageService.delete(asset.key);

      if (asset.thumbnailUrl) {
        const thumbnailKey = asset.key.replace(path.extname(asset.key), "_thumb.webp");
        await storageService.delete(thumbnailKey).catch(() => {});
      }

      await prisma.asset.delete({
        where: { id },
      });
    }
    else {
      await prisma.asset.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          status: "DELETED",
        },
      });
    }
  }

  async cleanupDeletedAssets(olderThanDays = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const assetsToCleanup = await prisma.asset.findMany({
      where: {
        deletedAt: { lte: cutoffDate },
        status: "DELETED",
      },
    });

    for (const asset of assetsToCleanup) {
      await this.deleteAsset(asset.id, true);
    }

    return assetsToCleanup.length;
  }

  async updateAssetStatus(id: string, status: AssetStatus): Promise<Asset> {
    return prisma.asset.update({
      where: { id },
      data: { status },
    });
  }

  async updateAssetTags(id: string, tags: string[]): Promise<Asset> {
    return prisma.asset.update({
      where: { id },
      data: { tags },
    });
  }

  async getDownloadUrl(id: string, expiresIn = 3600): Promise<string> {
    const asset = await prisma.asset.findUnique({
      where: { id, deletedAt: null },
    });

    if (!asset) {
      throw new Error("Asset not found");
    }

    if (asset.isPublic) {
      return asset.cdnUrl || asset.url;
    }

    const result = await storageService.generatePresignedDownloadUrl(asset.key, {
      expiresIn,
      contentDisposition: `attachment; filename="${asset.originalName}"`,
    });

    return result.url;
  }

  async generateUploadUrl(
    filename: string,
    mimeType: string,
    uploadedById?: string,
    expiresIn = 3600,
  ): Promise<{ uploadUrl: string; assetId: string; key: string }> {
    const type = await this.determineAssetType(mimeType);
    const key = this.generateKey(filename, type.toLowerCase());

    const result = await storageService.generatePresignedUploadUrl(key, {
      expiresIn,
      contentType: mimeType,
    });

    const asset = await prisma.asset.create({
      data: {
        key,
        filename: path.basename(key),
        originalName: filename,
        mimeType,
        size: 0,
        type,
        status: "UPLOADING",
        storageProvider: process.env.STORAGE_PROVIDER || "local",
        url: storageService.getPublicUrl(key),
        isPublic: false,
        uploadedById,
      },
    });

    return {
      uploadUrl: result.url,
      assetId: asset.id,
      key,
    };
  }
}

export const assetService = new AssetService();
