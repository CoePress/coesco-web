import type { Buffer } from "node:buffer";

import { promises as fs } from "node:fs";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";

import type { PresignedUrlOptions, PresignedUrlResult, StorageMetadata, StorageService, UploadOptions, UploadResult } from "./types";

export interface LocalStorageConfig {
  uploadDir: string;
  baseUrl: string;
}

export class LocalStorageService implements StorageService {
  private uploadDir: string;
  private baseUrl: string;

  constructor(config: LocalStorageConfig) {
    this.uploadDir = config.uploadDir;
    this.baseUrl = config.baseUrl;
  }

  async upload(
    key: string,
    buffer: Buffer,
    options?: UploadOptions,
  ): Promise<UploadResult> {
    const filePath = path.join(this.uploadDir, key);
    const dir = path.dirname(filePath);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, buffer);

    return {
      key,
      url: this.getPublicUrl(key),
      size: buffer.length,
      contentType: options?.contentType || "application/octet-stream",
    };
  }

  async download(key: string): Promise<{ buffer: Buffer; metadata: StorageMetadata }> {
    const filePath = path.join(this.uploadDir, key);
    const buffer = await fs.readFile(filePath);
    const stats = await fs.stat(filePath);

    return {
      buffer,
      metadata: {
        size: stats.size,
        lastModified: stats.mtime,
      },
    };
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.uploadDir, key);
    try {
      await fs.unlink(filePath);
    }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  async exists(key: string): Promise<boolean> {
    const filePath = path.join(this.uploadDir, key);
    try {
      await fs.access(filePath);
      return true;
    }
    catch {
      return false;
    }
  }

  async getMetadata(key: string): Promise<StorageMetadata> {
    const filePath = path.join(this.uploadDir, key);
    const stats = await fs.stat(filePath);

    return {
      size: stats.size,
      lastModified: stats.mtime,
    };
  }

  getPublicUrl(key: string): string {
    return `${this.baseUrl}/${key}`;
  }

  async generatePresignedUploadUrl(
    key: string,
    options?: PresignedUrlOptions,
  ): Promise<PresignedUrlResult> {
    const token = uuidv4();
    const expiresIn = options?.expiresIn || 3600;

    return {
      url: `${this.baseUrl}/upload/${key}?token=${token}`,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
      key,
    };
  }

  async generatePresignedDownloadUrl(
    key: string,
    options?: PresignedUrlOptions,
  ): Promise<PresignedUrlResult> {
    const expiresIn = options?.expiresIn || 3600;

    return {
      url: this.getPublicUrl(key),
      expiresAt: new Date(Date.now() + expiresIn * 1000),
      key,
    };
  }

  async listFiles(prefix?: string, maxKeys = 1000): Promise<string[]> {
    const searchDir = prefix ? path.join(this.uploadDir, prefix) : this.uploadDir;

    try {
      const files: string[] = [];

      const walk = async (dir: string, baseDir: string) => {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.relative(baseDir, fullPath);

          if (entry.isDirectory()) {
            await walk(fullPath, baseDir);
          }
          else {
            files.push(relativePath.replace(/\\/g, "/"));
            if (files.length >= maxKeys) {
              break;
            }
          }
        }
      };

      await walk(searchDir, this.uploadDir);
      return files;
    }
    catch {
      return [];
    }
  }
}
