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
  private readonly metadataFilePath: string;
  private initialized = false;

  constructor(baseStoragePath: string = "./storage/files") {
    this.baseStoragePath = baseStoragePath;
    this.metadataFilePath = join(baseStoragePath, "..", "metadata.json");
    this.initializeMetadata();
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

  private async initializeMetadata(): Promise<void> {
    if (this.initialized)
      return;

    try {
      await this.ensureDirectoryExists(dirname(this.metadataFilePath));

      // Try to load existing metadata
      try {
        const data = await fs.readFile(this.metadataFilePath, "utf-8");
        const metadata = JSON.parse(data) as FileMetadata[];
        this.metadataStore.clear();
        for (const item of metadata) {
          // Convert uploadedAt back to Date object
          item.uploadedAt = new Date(item.uploadedAt);
          this.metadataStore.set(item.id, item);
        }
      }
      catch {
        // No existing metadata file, scan filesystem
        await this.scanAndRebuildMetadata();
      }
    }
    catch (error) {
      console.error("Failed to initialize metadata:", error);
    }

    this.initialized = true;
  }

  private async scanAndRebuildMetadata(): Promise<void> {
    try {
      const categories = await fs.readdir(this.baseStoragePath);

      for (const category of categories) {
        const categoryPath = join(this.baseStoragePath, category);
        const stat = await fs.stat(categoryPath);

        if (stat.isDirectory()) {
          const files = await fs.readdir(categoryPath);

          for (const fileName of files) {
            const filePath = join(categoryPath, fileName);
            const fileStat = await fs.stat(filePath);

            if (fileStat.isFile()) {
              const metadata: FileMetadata = {
                id: randomUUID(),
                originalName: fileName,
                fileName,
                path: join(category, fileName),
                size: fileStat.size,
                mimeType: this.getMimeType(fileName),
                uploadedAt: fileStat.birthtime || fileStat.mtime,
                category: category === "general" ? undefined : category,
                tags: this.getTagsFromFilename(fileName),
              };

              this.metadataStore.set(metadata.id, metadata);
            }
          }
        }
      }

      await this.saveMetadata();
    }
    catch (error) {
      console.error("Failed to scan and rebuild metadata:", error);
    }
  }

  private getMimeType(fileName: string): string {
    const ext = extname(fileName).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".txt": "text/plain",
      ".md": "text/markdown",
      ".csv": "text/csv",
      ".json": "application/json",
      ".xml": "application/xml",
    };
    return mimeTypes[ext] || "application/octet-stream";
  }

  private getTagsFromFilename(fileName: string): string[] {
    const tags: string[] = [];
    const name = fileName.toLowerCase();

    if (name.includes("sample"))
      tags.push("sample");
    if (name.includes("test"))
      tags.push("test");
    if (name.includes("data"))
      tags.push("data");
    if (name.includes("export"))
      tags.push("export");
    if (name.includes("report"))
      tags.push("report");
    if (name.includes("statistics"))
      tags.push("statistics");
    if (name.includes("photo") || name.includes("image"))
      tags.push("photo");
    if (name.includes("document") || name.includes("doc"))
      tags.push("document");
    if (name.includes("guide"))
      tags.push("guide");

    return tags;
  }

  private async saveMetadata(): Promise<void> {
    try {
      const metadata = Array.from(this.metadataStore.values());
      await fs.writeFile(this.metadataFilePath, JSON.stringify(metadata, null, 2));
    }
    catch (error) {
      console.error("Failed to save metadata:", error);
    }
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
    await this.saveMetadata();

    return metadata;
  }

  async getFile(fileId: string): Promise<{ metadata: FileMetadata; buffer: Buffer } | null> {
    await this.initializeMetadata();
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
    await this.initializeMetadata();
    return this.metadataStore.get(fileId) || null;
  }

  async listFiles(filters?: {
    category?: string;
    tag?: string;
    uploadedBy?: string;
    mimeType?: string;
  }): Promise<FileMetadata[]> {
    await this.initializeMetadata();
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
    await this.initializeMetadata();
    const metadata = this.metadataStore.get(fileId);
    if (!metadata) {
      return false;
    }

    const fullPath = join(this.baseStoragePath, metadata.path);

    try {
      await fs.unlink(fullPath);
      this.metadataStore.delete(fileId);
      await this.saveMetadata();
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
    await this.initializeMetadata();
    const metadata = this.metadataStore.get(fileId);
    if (!metadata) {
      return null;
    }

    const updatedMetadata = { ...metadata, ...updates };
    this.metadataStore.set(fileId, updatedMetadata);
    await this.saveMetadata();

    return updatedMetadata;
  }

  async getStorageInfo(): Promise<{
    totalFiles: number;
    totalSize: number;
    categories: string[];
    tags: string[];
  }> {
    await this.initializeMetadata();
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
