import { exec } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

import { env } from "@/config/env";

import { BackupService } from "../backup.service";

jest.mock("node:child_process");
jest.mock("node:fs/promises");
jest.mock("@/utils/logger");

describe("backupService", () => {
  let backupService: BackupService;
  const mockExec = exec as jest.MockedFunction<typeof exec>;
  const mockFs = fs as jest.Mocked<typeof fs>;

  beforeEach(() => {
    jest.clearAllMocks();
    backupService = new BackupService();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe("constructor", () => {
    it("should use env variables for backupDir and retentionDays", () => {
      expect(backupService.backupDirectory).toBe(env.BACKUP_DIR || path.join(process.cwd(), "backups"));
      expect(backupService.retention).toBe(env.BACKUP_RETENTION_DAYS || 14);
    });
  });

  describe("initialize", () => {
    it("should create backup directory", async () => {
      mockFs.mkdir.mockResolvedValue(undefined);

      await backupService.initialize();

      expect(mockFs.mkdir).toHaveBeenCalledWith(
        backupService.backupDirectory,
        { recursive: true },
      );
    });

    it("should throw error if directory creation fails", async () => {
      const error = new Error("Permission denied");
      mockFs.mkdir.mockRejectedValue(error);

      await expect(backupService.initialize()).rejects.toThrow("Permission denied");
    });
  });

  describe("createBackup", () => {
    beforeEach(() => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.stat.mockResolvedValue({
        size: 1024 * 1024 * 5,
        mtimeMs: Date.now(),
      } as any);
    });

    it("should create backup successfully", async () => {
      mockExec.mockImplementation((cmd, callback: any) => {
        callback(null, { stdout: "", stderr: "" });
        return {} as any;
      });

      const result = await backupService.createBackup();

      expect(result.success).toBe(true);
      expect(result.filename).toMatch(/^backup-\d{4}-\d{2}-\d{2}\.sql\.gz$/);
      expect(mockExec).toHaveBeenCalled();
    });

    it("should return error if backup command fails", async () => {
      mockExec.mockImplementation((cmd, callback: any) => {
        callback(new Error("pg_dump failed"), null);
        return {} as any;
      });

      const result = await backupService.createBackup();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should trigger cleanup after successful backup", async () => {
      mockFs.readdir.mockResolvedValue([]);
      mockExec.mockImplementation((cmd, callback: any) => {
        callback(null, { stdout: "", stderr: "" });
        return {} as any;
      });

      const cleanupSpy = jest.spyOn(backupService, "cleanupOldBackups");

      await backupService.createBackup();

      expect(cleanupSpy).toHaveBeenCalled();
    });
  });

  describe("cleanupOldBackups", () => {
    it("should delete backups older than retention period", async () => {
      const oldDate = Date.now() - (20 * 24 * 60 * 60 * 1000);
      const recentDate = Date.now() - (5 * 24 * 60 * 60 * 1000);

      mockFs.readdir.mockResolvedValue([
        "backup-2024-01-01.sql.gz",
        "backup-2024-01-15.sql.gz",
        "other-file.txt",
      ] as any);

      mockFs.stat
        .mockResolvedValueOnce({ mtimeMs: oldDate } as any)
        .mockResolvedValueOnce({ mtimeMs: recentDate } as any);

      mockFs.unlink.mockResolvedValue(undefined);

      await backupService.cleanupOldBackups();

      expect(mockFs.unlink).toHaveBeenCalledTimes(1);
      expect(mockFs.unlink).toHaveBeenCalledWith(
        expect.stringContaining("backup-2024-01-01.sql.gz"),
      );
    });

    it("should skip non-backup files", async () => {
      mockFs.readdir.mockResolvedValue([
        "other-file.txt",
        "backup.sql",
        "data.gz",
      ] as any);

      await backupService.cleanupOldBackups();

      expect(mockFs.stat).not.toHaveBeenCalled();
      expect(mockFs.unlink).not.toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      mockFs.readdir.mockRejectedValue(new Error("Read error"));

      await expect(backupService.cleanupOldBackups()).resolves.not.toThrow();
    });
  });

  describe("listBackups", () => {
    it("should return sorted list of backups", async () => {
      mockFs.readdir.mockResolvedValue([
        "backup-2024-01-01.sql.gz",
        "backup-2024-01-15.sql.gz",
        "other-file.txt",
      ] as any);

      mockFs.stat
        .mockResolvedValueOnce({
          size: 1024,
          mtime: new Date("2024-01-01"),
        } as any)
        .mockResolvedValueOnce({
          size: 2048,
          mtime: new Date("2024-01-15"),
        } as any);

      const result = await backupService.listBackups();

      expect(result).toHaveLength(2);
      expect(result[0].filename).toBe("backup-2024-01-15.sql.gz");
      expect(result[1].filename).toBe("backup-2024-01-01.sql.gz");
    });

    it("should return empty array on error", async () => {
      mockFs.readdir.mockRejectedValue(new Error("Read error"));

      const result = await backupService.listBackups();

      expect(result).toEqual([]);
    });
  });

  describe("getBackupStats", () => {
    it("should calculate stats correctly", async () => {
      mockFs.readdir.mockResolvedValue([
        "backup-2024-01-01.sql.gz",
        "backup-2024-01-15.sql.gz",
      ] as any);

      mockFs.stat
        .mockResolvedValueOnce({
          size: 1024,
          mtime: new Date("2024-01-01"),
        } as any)
        .mockResolvedValueOnce({
          size: 2048,
          mtime: new Date("2024-01-15"),
        } as any);

      const result = await backupService.getBackupStats();

      expect(result.totalBackups).toBe(2);
      expect(result.totalSize).toBe(3072);
      expect(result.oldestBackup).toEqual(new Date("2024-01-01"));
      expect(result.newestBackup).toEqual(new Date("2024-01-15"));
    });

    it("should handle empty backups", async () => {
      mockFs.readdir.mockResolvedValue([] as any);

      const result = await backupService.getBackupStats();

      expect(result.totalBackups).toBe(0);
      expect(result.totalSize).toBe(0);
      expect(result.oldestBackup).toBeUndefined();
      expect(result.newestBackup).toBeUndefined();
    });
  });

  describe("verifyBackup", () => {
    it("should verify valid backup", async () => {
      mockFs.stat.mockResolvedValue({ size: 1024 } as any);
      mockExec.mockImplementation((cmd, callback: any) => {
        callback(null, { stdout: "", stderr: "" });
        return {} as any;
      });

      const result = await backupService.verifyBackup("backup-2024-01-01.sql.gz");

      expect(result).toBe(true);
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining("gzip -t"),
        expect.any(Function),
      );
    });

    it("should reject empty backup file", async () => {
      mockFs.stat.mockResolvedValue({ size: 0 } as any);

      const result = await backupService.verifyBackup("backup-2024-01-01.sql.gz");

      expect(result).toBe(false);
      expect(mockExec).not.toHaveBeenCalled();
    });

    it("should reject corrupted backup", async () => {
      mockFs.stat.mockResolvedValue({ size: 1024 } as any);
      mockExec.mockImplementation((cmd, callback: any) => {
        callback(new Error("gzip: invalid"), null);
        return {} as any;
      });

      const result = await backupService.verifyBackup("backup-2024-01-01.sql.gz");

      expect(result).toBe(false);
    });
  });

  describe("restoreBackup", () => {
    it("should restore backup successfully", async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockExec.mockImplementation((cmd, callback: any) => {
        callback(null, { stdout: "", stderr: "" });
        return {} as any;
      });

      const result = await backupService.restoreBackup("backup-2024-01-01.sql.gz");

      expect(result.success).toBe(true);
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining("gunzip -c"),
        expect.any(Function),
      );
    });

    it("should return error if file does not exist", async () => {
      mockFs.access.mockRejectedValue(new Error("File not found"));

      const result = await backupService.restoreBackup("non-existent.sql.gz");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should return error if restore command fails", async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockExec.mockImplementation((cmd, callback: any) => {
        callback(new Error("psql failed"), null);
        return {} as any;
      });

      const result = await backupService.restoreBackup("backup-2024-01-01.sql.gz");

      expect(result.success).toBe(false);
      expect(result.error).toBe("psql failed");
    });
  });

  describe("getBackupFiles", () => {
    beforeEach(() => {
      mockFs.access.mockResolvedValue(undefined);
    });

    it("should return paginated backup files", async () => {
      const files = Array.from({ length: 30 }, (_, i) =>
        `backup-2024-01-${String(i + 1).padStart(2, "0")}.sql.gz`);
      mockFs.readdir.mockResolvedValue(files as any);

      const result = await backupService.getBackupFiles(1, 25);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(25);
      expect(result.meta.total).toBe(30);
      expect(result.meta.totalPages).toBe(2);
      expect(result.meta.page).toBe(1);
    });

    it("should return second page correctly", async () => {
      const files = Array.from({ length: 30 }, (_, i) =>
        `backup-2024-01-${String(i + 1).padStart(2, "0")}.sql.gz`);
      mockFs.readdir.mockResolvedValue(files as any);

      const result = await backupService.getBackupFiles(2, 25);

      expect(result.data).toHaveLength(5);
      expect(result.meta.page).toBe(2);
    });

    it("should filter non-backup files", async () => {
      mockFs.readdir.mockResolvedValue([
        "backup-2024-01-01.sql.gz",
        "other-file.txt",
        "data.sql",
      ] as any);

      const result = await backupService.getBackupFiles();

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toBe("backup-2024-01-01.sql.gz");
    });

    it("should handle errors gracefully", async () => {
      mockFs.access.mockRejectedValue(new Error("Directory error"));

      const result = await backupService.getBackupFiles();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });

  describe("getBackupFile", () => {
    it("should return backup file path", async () => {
      mockFs.access.mockResolvedValue(undefined);

      const result = await backupService.getBackupFile("backup-2024-01-01.sql.gz");

      expect(result.success).toBe(true);
      expect(result.data?.path).toContain("backup-2024-01-01.sql.gz");
      expect(result.data?.isGzipped).toBe(true);
    });

    it("should detect non-gzipped files", async () => {
      mockFs.access.mockResolvedValue(undefined);

      const result = await backupService.getBackupFile("backup-2024-01-01.sql");

      expect(result.data?.isGzipped).toBe(false);
    });

    it("should prevent path traversal attacks", async () => {
      mockFs.access.mockResolvedValue(undefined);

      const result = await backupService.getBackupFile("../../etc/passwd");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid backup file path");
    });

    it("should return error if file does not exist", async () => {
      mockFs.access.mockRejectedValue(new Error("File not found"));

      const result = await backupService.getBackupFile("non-existent.sql.gz");

      expect(result.success).toBe(false);
      expect(result.error).toBe("File not found");
    });
  });

  describe("ensureBackupDirectory", () => {
    it("should not create directory if it exists", async () => {
      mockFs.access.mockResolvedValue(undefined);

      await backupService.ensureBackupDirectory();

      expect(mockFs.mkdir).not.toHaveBeenCalled();
    });

    it("should create directory if it does not exist", async () => {
      mockFs.access.mockRejectedValue(new Error("Does not exist"));
      mockFs.mkdir.mockResolvedValue(undefined);

      await backupService.ensureBackupDirectory();

      expect(mockFs.mkdir).toHaveBeenCalledWith(
        backupService.backupDirectory,
        { recursive: true },
      );
    });
  });
});
