import { exec } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { env } from "@/config/env";
import { logger } from "@/utils/logger";

const execAsync = promisify(exec);

export class BackupService {
  private backupDir: string;
  private retentionDays: number;

  constructor() {
    // eslint-disable-next-line node/prefer-global/process
    this.backupDir = env.BACKUP_DIR || path.join(process.cwd(), "backups");
    this.retentionDays = env.BACKUP_RETENTION_DAYS || 14;
  }

  get backupDirectory(): string {
    return this.backupDir;
  }

  get retention(): number {
    return this.retentionDays;
  }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      logger.info(`Backup directory initialized at: ${this.backupDir}`);
    }
    catch (error) {
      logger.error("Failed to initialize backup directory:", error);
      throw error;
    }
  }

  async createBackup(): Promise<{ success: boolean; filename?: string; error?: string }> {
    const startTime = Date.now();

    try {
      await this.ensureBackupDirectory();

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0];
      const filename = `backup-${timestamp}.sql.gz`;
      const filepath = path.join(this.backupDir, filename);

      logger.info("Starting database backup...");

      const databaseUrl = env.DATABASE_URL;
      const backupCommand = `pg_dump "${databaseUrl}" | gzip > "${filepath}"`;

      await execAsync(backupCommand);

      const stats = await fs.stat(filepath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      const duration = Date.now() - startTime;

      logger.info(`Backup completed: ${filename} (${sizeInMB} MB) in ${duration}ms`);

      await this.cleanupOldBackups();

      return { success: true, filename };
    }
    catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Backup failed after ${duration}ms:`, error);
      return { success: false, error: errorMessage };
    }
  }

  async cleanupOldBackups(): Promise<void> {
    try {
      const files = await fs.readdir(this.backupDir);
      const now = Date.now();
      const retentionMs = this.retentionDays * 24 * 60 * 60 * 1000;

      let deletedCount = 0;

      for (const file of files) {
        if (!file.startsWith("backup-") || !file.endsWith(".sql.gz")) {
          continue;
        }

        const filepath = path.join(this.backupDir, file);
        const stats = await fs.stat(filepath);
        const age = now - stats.mtimeMs;

        if (age > retentionMs) {
          await fs.unlink(filepath);
          deletedCount++;
          logger.info(`Deleted old backup: ${file} (${(age / (24 * 60 * 60 * 1000)).toFixed(1)} days old)`);
        }
      }

      if (deletedCount > 0) {
        logger.info(`Cleanup complete: removed ${deletedCount} old backup(s)`);
      }
    }
    catch (error) {
      logger.error("Failed to cleanup old backups:", error);
    }
  }

  async listBackups(): Promise<Array<{ filename: string; size: number; created: Date }>> {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups = [];

      for (const file of files) {
        if (!file.startsWith("backup-") || !file.endsWith(".sql.gz")) {
          continue;
        }

        const filepath = path.join(this.backupDir, file);
        const stats = await fs.stat(filepath);

        backups.push({
          filename: file,
          size: stats.size,
          created: stats.mtime,
        });
      }

      return backups.sort((a, b) => b.created.getTime() - a.created.getTime());
    }
    catch (error) {
      logger.error("Failed to list backups:", error);
      return [];
    }
  }

  async getBackupStats(): Promise<{
    totalBackups: number;
    totalSize: number;
    oldestBackup?: Date;
    newestBackup?: Date;
  }> {
    const backups = await this.listBackups();

    if (backups.length === 0) {
      return { totalBackups: 0, totalSize: 0 };
    }

    return {
      totalBackups: backups.length,
      totalSize: backups.reduce((sum, b) => sum + b.size, 0),
      oldestBackup: backups[backups.length - 1].created,
      newestBackup: backups[0].created,
    };
  }

  async verifyBackup(filename: string): Promise<boolean> {
    try {
      const filepath = path.join(this.backupDir, filename);
      const stats = await fs.stat(filepath);

      if (stats.size === 0) {
        logger.error(`Backup verification failed: ${filename} is empty`);
        return false;
      }

      const testCommand = `gzip -t "${filepath}"`;
      await execAsync(testCommand);

      logger.info(`Backup verified: ${filename}`);
      return true;
    }
    catch (error) {
      logger.error(`Backup verification failed for ${filename}:`, error);
      return false;
    }
  }

  async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.access(this.backupDir);
    }
    catch {
      await fs.mkdir(this.backupDir, { recursive: true });
      logger.info(`Created backup directory: ${this.backupDir}`);
    }
  }

  async restoreBackup(filename: string): Promise<{ success: boolean; error?: string }> {
    try {
      const filepath = path.join(this.backupDir, filename);

      await fs.access(filepath);

      logger.warn(`Starting database restore from: ${filename}`);

      const databaseUrl = env.DATABASE_URL;
      const restoreCommand = `gunzip -c "${filepath}" | psql "${databaseUrl}"`;

      await execAsync(restoreCommand);

      logger.info(`Database restored successfully from: ${filename}`);
      return { success: true };
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Restore failed for ${filename}:`, error);
      return { success: false, error: errorMessage };
    }
  }

  async getBackupFiles(page = 1, limit = 25) {
    try {
      await this.ensureBackupDirectory();

      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter(f => f.startsWith("backup-") && f.endsWith(".sql.gz"))
        .sort()
        .reverse();

      const total = backupFiles.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedFiles = backupFiles.slice(startIndex, endIndex);

      return {
        success: true,
        data: paginatedFiles,
        meta: {
          total,
          page,
          totalPages,
        },
      };
    }
    catch (error) {
      logger.error("Failed to get backup files:", error);
      return {
        success: true,
        data: [],
        meta: {
          total: 0,
          page: 1,
          totalPages: 0,
        },
      };
    }
  }

  async getBackupFile(filename: string) {
    try {
      const filepath = path.join(this.backupDir, filename);

      await fs.access(filepath);

      const normalizedPath = path.normalize(filepath);
      const normalizedBackupDir = path.normalize(this.backupDir);
      if (!normalizedPath.startsWith(normalizedBackupDir)) {
        throw new Error("Invalid backup file path");
      }

      return {
        success: true,
        data: {
          path: filepath,
          isGzipped: filepath.endsWith(".gz"),
        },
      };
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to get backup file ${filename}:`, error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}
