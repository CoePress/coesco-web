import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

import { prisma } from "@/utils/prisma";

export class ImageService {
  private uploadsDir = path.join(process.cwd(), "uploads");

  async uploadImage(file: Express.Multer.File): Promise<{ id: number; url: string }> {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = String(date.getFullYear());

    const dateDir = path.join(this.uploadsDir, month, day, year);
    await fs.mkdir(dateDir, { recursive: true });

    const filename = `${uuidv4()}.webp`;
    const filePath = path.join(dateDir, filename);

    const compressedBuffer = await sharp(file.buffer)
      .webp({ quality: 85 })
      .toBuffer();

    const sizeInMB = compressedBuffer.length / (1024 * 1024);
    if (sizeInMB > 2) {
      throw new Error(`Compressed image size (${sizeInMB.toFixed(2)}MB) exceeds 2MB limit`);
    }

    await fs.writeFile(filePath, compressedBuffer);

    const relativePath = `/uploads/${month}/${day}/${year}/${filename}`;
    const image = await prisma.image.create({
      data: { path: relativePath },
    });

    return {
      id: image.id,
      url: relativePath,
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

    const fullPath = path.join(process.cwd(), image.path.replace(/^\//, ""));

    try {
      await fs.unlink(fullPath);
    }
    catch (error) {
      console.error("Failed to delete file from disk:", error);
    }

    await prisma.image.delete({
      where: { id },
    });
  }
}
