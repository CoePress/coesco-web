import { spawn } from "node:child_process";
import { createReadStream, createWriteStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createGunzip, createGzip } from "node:zlib";

import env from "./env";
import logger from "./logger";

export interface BackupInfo {
  filename: string;
  size: number;
  created: Date;
}

export interface BackupResult {
  success: boolean;
  filename?: string;
  error?: string;
}

export interface BackupStats {
  totalBackups: number;
  totalSize: number;
  oldestBackup?: Date;
  newestBackup?: Date;
}

class BackupService {
  private backupDir: string;
  private retentionDays: number;

  constructor() {
    this.backupDir = env.BACKUP_DIR || path.join(process.cwd(), "backups");
    this.retentionDays = env.BACKUP_RETENTION_DAYS;
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
      logger.info("backup.initialized", { dir: this.backupDir });
    }
    catch (error) {
      logger.error("backup.init_failed", { error });
      throw error;
    }
  }

  async createBackup(): Promise<BackupResult> {
    const startTime = Date.now();

    try {
      await this.ensureBackupDirectory();

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0];
      const filename = `backup-${timestamp}.sql.gz`;
      const filepath = path.join(this.backupDir, filename);

      logger.info("backup.started");

      await new Promise<void>((resolve, reject) => {
        const pgDump = spawn("pg_dump", [env.DATABASE_URL]);
        const gzip = createGzip();
        const output = createWriteStream(filepath);

        pgDump.stdout.pipe(gzip).pipe(output);

        pgDump.stderr.on("data", (data) => {
          logger.warn("backup.pg_dump_stderr", { data: String(data) });
        });

        pgDump.on("error", (error) => {
          reject(new Error(`pg_dump process error: ${error.message}`));
        });

        output.on("error", (error) => {
          reject(new Error(`Write stream error: ${error.message}`));
        });

        output.on("finish", () => {
          resolve();
        });

        pgDump.on("exit", (code) => {
          if (code !== 0) {
            reject(new Error(`pg_dump exited with code ${code}`));
          }
        });
      });

      const stats = await fs.stat(filepath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      const duration = Date.now() - startTime;

      logger.info("backup.completed", { filename, sizeMB: sizeInMB, durationMs: duration });

      await this.cleanupOldBackups();

      return { success: true, filename };
    }
    catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("backup.failed", { durationMs: duration, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  async cleanupOldBackups(): Promise<number> {
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
          logger.info("backup.deleted_old", { file, ageDays: (age / (24 * 60 * 60 * 1000)).toFixed(1) });
        }
      }

      if (deletedCount > 0) {
        logger.info("backup.cleanup_complete", { deletedCount });
      }

      return deletedCount;
    }
    catch (error) {
      logger.error("backup.cleanup_failed", { error });
      return 0;
    }
  }

  async listBackups(): Promise<BackupInfo[]> {
    try {
      await this.ensureBackupDirectory();
      const files = await fs.readdir(this.backupDir);
      const backups: BackupInfo[] = [];

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
      logger.error("backup.list_failed", { error });
      return [];
    }
  }

  async getStats(): Promise<BackupStats> {
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

      // Security: ensure path is within backup directory
      const normalizedPath = path.normalize(filepath);
      if (!normalizedPath.startsWith(path.normalize(this.backupDir))) {
        logger.error("backup.verify_invalid_path", { filename });
        return false;
      }

      const stats = await fs.stat(filepath);

      if (stats.size === 0) {
        logger.error("backup.verify_empty", { filename });
        return false;
      }

      await new Promise<void>((resolve, reject) => {
        const readStream = createReadStream(filepath);
        const gunzip = createGunzip();

        gunzip.on("error", (error) => {
          reject(new Error(`Gzip verification error: ${error.message}`));
        });

        readStream.on("error", (error) => {
          reject(new Error(`Read stream error: ${error.message}`));
        });

        gunzip.on("end", () => {
          resolve();
        });

        readStream.pipe(gunzip).on("data", () => {});
      });

      logger.info("backup.verified", { filename });
      return true;
    }
    catch (error) {
      logger.error("backup.verify_failed", { filename, error });
      return false;
    }
  }

  async restoreBackup(filename: string): Promise<BackupResult> {
    try {
      const filepath = path.join(this.backupDir, filename);

      // Security: ensure path is within backup directory
      const normalizedPath = path.normalize(filepath);
      if (!normalizedPath.startsWith(path.normalize(this.backupDir))) {
        return { success: false, error: "Invalid backup file path" };
      }

      await fs.access(filepath);

      logger.warn("backup.restore_started", { filename });

      await new Promise<void>((resolve, reject) => {
        const gunzip = createGunzip();
        const readStream = createReadStream(filepath);
        const psql = spawn("psql", [env.DATABASE_URL]);

        readStream.pipe(gunzip).pipe(psql.stdin);

        psql.stderr.on("data", (data) => {
          logger.warn("backup.psql_stderr", { data: String(data) });
        });

        psql.on("error", (error) => {
          reject(new Error(`psql process error: ${error.message}`));
        });

        psql.on("exit", (code) => {
          if (code !== 0) {
            reject(new Error(`psql exited with code ${code}`));
          }
          else {
            resolve();
          }
        });
      });

      logger.info("backup.restore_completed", { filename });
      return { success: true };
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("backup.restore_failed", { filename, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  async deleteBackup(filename: string): Promise<BackupResult> {
    try {
      const filepath = path.join(this.backupDir, filename);

      // Security: ensure path is within backup directory
      const normalizedPath = path.normalize(filepath);
      if (!normalizedPath.startsWith(path.normalize(this.backupDir))) {
        return { success: false, error: "Invalid backup file path" };
      }

      await fs.unlink(filepath);
      logger.info("backup.deleted", { filename });
      return { success: true };
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("backup.delete_failed", { filename, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  private async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.access(this.backupDir);
    }
    catch {
      await fs.mkdir(this.backupDir, { recursive: true });
      logger.info("backup.dir_created", { dir: this.backupDir });
    }
  }
}

export const backupService = new BackupService();
