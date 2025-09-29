import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export interface StoredFile {
  id: string;
  originalName: string;
  filename: string;
  path: string;
  mimetype: string;
  size: number;
  hash: string;
  uploadedAt: Date;
}

export class FileStorageService {
  private readonly baseDir: string;

  constructor() {
    this.baseDir = path.join(process.cwd(), 'uploads');
    this.ensureDirectoryExists(this.baseDir);
  }

  private ensureDirectoryExists(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private generatePath(formId: string, submissionId?: string, category: 'images' | 'sketches' = 'images'): string {
    if (submissionId) {
      return path.join(this.baseDir, 'forms', formId, submissionId, category);
    }
    return path.join(this.baseDir, 'forms', formId, 'temp', category);
  }

  private generateFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const random = uuidv4().substring(0, 8);
    return `${timestamp}-${random}${ext}`;
  }

  private calculateHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  async storeTempFile(
    formId: string,
    file: Express.Multer.File,
    category: 'images' | 'sketches' = 'images'
  ): Promise<StoredFile> {
    const uploadDir = this.generatePath(formId, undefined, category);
    this.ensureDirectoryExists(uploadDir);

    const filename = this.generateFilename(file.originalname);
    const filePath = path.join(uploadDir, filename);
    const hash = this.calculateHash(file.buffer);

    fs.writeFileSync(filePath, file.buffer);

    return {
      id: uuidv4(),
      originalName: file.originalname,
      filename,
      path: filePath,
      mimetype: file.mimetype,
      size: file.size,
      hash,
      uploadedAt: new Date(),
    };
  }

  async moveTempToPermanent(
    formId: string,
    submissionId: string,
    tempFiles: StoredFile[]
  ): Promise<StoredFile[]> {
    const permanentFiles: StoredFile[] = [];

    for (const tempFile of tempFiles) {
      const category = tempFile.path.includes('/sketches/') ? 'sketches' : 'images';
      const permanentDir = this.generatePath(formId, submissionId, category);
      this.ensureDirectoryExists(permanentDir);

      const permanentPath = path.join(permanentDir, tempFile.filename);

      fs.renameSync(tempFile.path, permanentPath);

      permanentFiles.push({
        ...tempFile,
        path: permanentPath,
      });
    }

    this.cleanupTempFiles(formId);

    return permanentFiles;
  }

  getFile(filePath: string): Buffer | null {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return fs.readFileSync(filePath);
  }

  getFileInfo(filePath: string): { exists: boolean; size?: number; mtime?: Date } {
    try {
      const stats = fs.statSync(filePath);
      return {
        exists: true,
        size: stats.size,
        mtime: stats.mtime,
      };
    } catch {
      return { exists: false };
    }
  }

  deleteFile(filePath: string): boolean {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  deleteSubmissionFiles(formId: string, submissionId: string): void {
    const submissionDir = path.join(this.baseDir, 'forms', formId, submissionId);
    if (fs.existsSync(submissionDir)) {
      fs.rmSync(submissionDir, { recursive: true, force: true });
    }
  }

  cleanupTempFiles(formId?: string): void {
    const tempDir = formId
      ? path.join(this.baseDir, 'forms', formId, 'temp')
      : path.join(this.baseDir, 'forms');

    if (!fs.existsSync(tempDir)) return;

    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000);

    const processDirectory = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (entry.name === 'temp') {
            processDirectory(fullPath);
          }
        } else {
          const stats = fs.statSync(fullPath);
          if (stats.mtime.getTime() < cutoffTime) {
            fs.unlinkSync(fullPath);
            console.log(`Cleaned up temp file: ${fullPath}`);
          }
        }
      }

      if (dir.endsWith('/temp') && fs.readdirSync(dir).length === 0) {
        fs.rmdirSync(dir);
      }
    };

    processDirectory(tempDir);
  }

  generateFileUrl(formId: string, submissionId: string, filename: string): string {
    return `/api/v1/files/forms/${formId}/submissions/${submissionId}/${filename}`;
  }

  getFilePathFromUrl(formId: string, submissionId: string, filename: string): string | null {
    const imagePath = path.join(this.generatePath(formId, submissionId, 'images'), filename);
    const sketchPath = path.join(this.generatePath(formId, submissionId, 'sketches'), filename);

    if (fs.existsSync(imagePath)) return imagePath;
    if (fs.existsSync(sketchPath)) return sketchPath;

    return null;
  }

  getStorageStats(): {
    totalFiles: number;
    totalSize: number;
    formCount: number;
  } {
    let totalFiles = 0;
    let totalSize = 0;
    let formCount = 0;

    const formsDir = path.join(this.baseDir, 'forms');
    if (!fs.existsSync(formsDir)) {
      return { totalFiles: 0, totalSize: 0, formCount: 0 };
    }

    const countInDirectory = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          countInDirectory(fullPath);
        } else {
          const stats = fs.statSync(fullPath);
          totalFiles++;
          totalSize += stats.size;
        }
      }
    };

    const formDirs = fs.readdirSync(formsDir);
    formCount = formDirs.length;

    for (const formDir of formDirs) {
      const formPath = path.join(formsDir, formDir);
      if (fs.statSync(formPath).isDirectory()) {
        countInDirectory(formPath);
      }
    }

    return { totalFiles, totalSize, formCount };
  }
}
