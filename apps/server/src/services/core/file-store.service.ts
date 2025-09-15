import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import { dirname, extname, join } from "node:path";

export interface FileMetadata {
  id: string;
  originalName: string;
  fileName: string;
  path: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  uploadedBy?: string;
  category?: string;
  tags?: string[];
}

export interface FileUploadOptions {
  category?: string;
  tags?: string[];
  uploadedBy?: string;
  preserveOriginalName?: boolean;
}

export class FileStoreService {
  private readonly baseStoragePath: string;
  private readonly metadataStore: Map<string, FileMetadata> = new Map();

  constructor(baseStoragePath: string = "./storage/files") {
    this.baseStoragePath = baseStoragePath;
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    }
    catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  private generateFileName(originalName: string, preserveOriginal: boolean = false): string {
    if (preserveOriginal) {
      return originalName;
    }

    const ext = extname(originalName);
    const uuid = randomUUID();
    return `${uuid}${ext}`;
  }

  private getCategoryPath(category?: string): string {
    if (!category) {
      return "general";
    }
    return category.toLowerCase().replace(/[^a-z0-9]/g, "-");
  }

  async storeFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    options: FileUploadOptions = {},
  ): Promise<FileMetadata> {
    const { category, tags, uploadedBy, preserveOriginalName } = options;

    const categoryPath = this.getCategoryPath(category);
    const fileName = this.generateFileName(originalName, preserveOriginalName);
    const relativePath = join(categoryPath, fileName);
    const fullPath = join(this.baseStoragePath, relativePath);

    await this.ensureDirectoryExists(dirname(fullPath));

    await fs.writeFile(fullPath, fileBuffer);

    const metadata: FileMetadata = {
      id: randomUUID(),
      originalName,
      fileName,
      path: relativePath,
      size: fileBuffer.length,
      mimeType,
      uploadedAt: new Date(),
      uploadedBy,
      category,
      tags,
    };

    this.metadataStore.set(metadata.id, metadata);

    return metadata;
  }

  async getFile(fileId: string): Promise<{ metadata: FileMetadata; buffer: Buffer } | null> {
    const metadata = this.metadataStore.get(fileId);
    if (!metadata) {
      return null;
    }

    const fullPath = join(this.baseStoragePath, metadata.path);

    try {
      const buffer = await fs.readFile(fullPath);
      return { metadata, buffer };
    }
    catch {
      return null;
    }
  }

  async getFileMetadata(fileId: string): Promise<FileMetadata | null> {
    return this.metadataStore.get(fileId) || null;
  }

  async listFiles(filters?: {
    category?: string;
    tag?: string;
    uploadedBy?: string;
    mimeType?: string;
  }): Promise<FileMetadata[]> {
    const allFiles = Array.from(this.metadataStore.values());

    if (!filters) {
      return allFiles;
    }

    return allFiles.filter((file) => {
      if (filters.category && file.category !== filters.category) {
        return false;
      }
      if (filters.tag && (!file.tags || !file.tags.includes(filters.tag))) {
        return false;
      }
      if (filters.uploadedBy && file.uploadedBy !== filters.uploadedBy) {
        return false;
      }
      if (filters.mimeType && file.mimeType !== filters.mimeType) {
        return false;
      }
      return true;
    });
  }

  async deleteFile(fileId: string): Promise<boolean> {
    const metadata = this.metadataStore.get(fileId);
    if (!metadata) {
      return false;
    }

    const fullPath = join(this.baseStoragePath, metadata.path);

    try {
      await fs.unlink(fullPath);
      this.metadataStore.delete(fileId);
      return true;
    }
    catch {
      return false;
    }
  }

  async updateMetadata(
    fileId: string,
    updates: Partial<Pick<FileMetadata, "category" | "tags">>,
  ): Promise<FileMetadata | null> {
    const metadata = this.metadataStore.get(fileId);
    if (!metadata) {
      return null;
    }

    const updatedMetadata = { ...metadata, ...updates };
    this.metadataStore.set(fileId, updatedMetadata);

    return updatedMetadata;
  }

  async getStorageInfo(): Promise<{
    totalFiles: number;
    totalSize: number;
    categories: string[];
    tags: string[];
  }> {
    const allFiles = Array.from(this.metadataStore.values());
    const categories = new Set<string>();
    const tags = new Set<string>();
    let totalSize = 0;

    for (const file of allFiles) {
      totalSize += file.size;
      if (file.category) {
        categories.add(file.category);
      }
      if (file.tags) {
        for (const tag of file.tags) {
          tags.add(tag);
        }
      }
    }

    return {
      totalFiles: allFiles.length,
      totalSize,
      categories: Array.from(categories),
      tags: Array.from(tags),
    };
  }
}
