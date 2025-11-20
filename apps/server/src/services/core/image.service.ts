import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

import { prisma } from "@/utils/prisma";

import { storageService } from "../storage";

export class ImageService {
  async uploadImage(file: Express.Multer.File): Promise<{ id: number; url: string }> {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = String(date.getFullYear());

    const filename = `${uuidv4()}.webp`;
    const key = `images/${month}/${day}/${year}/${filename}`;

    const compressedBuffer = await sharp(file.buffer)
      .webp({ quality: 85 })
      .toBuffer();

    const sizeInMB = compressedBuffer.length / (1024 * 1024);
    if (sizeInMB > 2) {
      throw new Error(`Compressed image size (${sizeInMB.toFixed(2)}MB) exceeds 2MB limit`);
    }

    const uploadResult = await storageService.upload(key, compressedBuffer, {
      contentType: "image/webp",
      isPublic: true,
    });

    const imagePath = uploadResult.cdnUrl || uploadResult.url;
    const image = await prisma.image.create({
      data: { path: imagePath },
    });

    return {
      id: image.id,
      url: imagePath,
    };
  }

  async uploadImages(files: Express.Multer.File[]): Promise<{ images: Array<{ id: number; url: string }> }> {
    const results = await Promise.all(files.map(file => this.uploadImage(file)));
    return { images: results };
  }

  async getAllImages() {
    const images = await prisma.image.findMany({
      orderBy: { uploadedAt: "desc" },
    });
    return images.map(img => ({
      id: img.id,
      url: img.path,
      uploadedAt: img.uploadedAt,
    }));
  }

  async deleteImage(id: number): Promise<void> {
    const image = await prisma.image.findUnique({
      where: { id },
    });

    if (!image) {
      throw new Error("Image not found");
    }

    try {
      const key = image.path.replace(/^https?:\/\/[^/]+\//, "");
      await storageService.delete(key);
    }
    catch (error) {
      console.error("Failed to delete file from storage:", error);
    }

    await prisma.image.delete({
      where: { id },
    });
  }
}
