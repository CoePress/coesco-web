/* eslint-disable dot-notation */
import { CronJob } from "cron";

import * as envModule from "@/config/env";
import { backupService, microsoftService, sessionService } from "@/services";

import { CronService } from "../cron.service";

jest.mock("cron");
jest.mock("@/services", () => ({
  backupService: {
    createBackup: jest.fn(),
  },
  microsoftService: {
    sync: jest.fn(),
  },
  sessionService: {
    deleteExpiredSessions: jest.fn(),
  },
}));
jest.mock("@/utils/logger");

describe("cronService", () => {
  let cronService: CronService;
  let mockCronJob: jest.MockedClass<typeof CronJob>;
  let cronInstances: any[];

  beforeEach(() => {
    jest.clearAllMocks();
    cronInstances = [];

    mockCronJob = CronJob as jest.MockedClass<typeof CronJob>;
    mockCronJob.mockImplementation((schedule, handler, onComplete, start, timezone) => {
      const instance = {
        schedule,
        handler,
        onComplete,
        start,
        timezone,
        stop: jest.fn(),
      };
      cronInstances.push(instance);
      return instance as any;
    });

    cronService = new CronService();
  });

  describe("initialize", () => {
    it("should create sync-employees cron job", async () => {
      await cronService.initialize();

      expect(CronJob).toHaveBeenCalledWith(
        "0 0 * * *",
        expect.any(Function),
        null,
        true,
        "America/New_York",
      );
    });

    it("should create database-backup cron job when BACKUP_ENABLED is true", async () => {
      Object.defineProperty(envModule.env, "BACKUP_ENABLED", {
        value: true,
        writable: true,
        configurable: true,
      });

      await cronService.initialize();

      const backupJobCall = cronInstances.find(job => job.schedule === "0 2 * * *");
      expect(backupJobCall).toBeDefined();
      expect(backupJobCall?.timezone).toBe("America/New_York");
    });

    it("should not create database-backup cron job when BACKUP_ENABLED is false", async () => {
      Object.defineProperty(envModule.env, "BACKUP_ENABLED", {
        value: false,
        writable: true,
        configurable: true,
      });

      await cronService.initialize();

      const backupJobCall = cronInstances.find(job => job.schedule === "0 2 * * *");
      expect(backupJobCall).toBeUndefined();
    });

    it("should create session-cleanup cron job", async () => {
      await cronService.initialize();

      expect(CronJob).toHaveBeenCalledWith(
        "0 3 * * *",
        expect.any(Function),
        null,
        true,
        "America/New_York",
      );
    });

    it("should create all enabled jobs", async () => {
      Object.defineProperty(envModule.env, "BACKUP_ENABLED", {
        value: true,
        writable: true,
        configurable: true,
      });

      await cronService.initialize();

      expect(cronInstances).toHaveLength(3);
    });
  });

  describe("stop", () => {
    it("should stop all cron jobs", async () => {
      await cronService.initialize();

      await cronService.stop();

      cronInstances.forEach((job) => {
        expect(job.stop).toHaveBeenCalled();
      });
    });

    it("should clear jobs array after stopping", async () => {
      await cronService.initialize();

      await cronService.stop();

      expect(cronService["jobs"]).toHaveLength(0);
    });

    it("should wait for running jobs to complete", async () => {
      await cronService.initialize();

      cronService["runningJobs"].add("test-job");

      const stopPromise = cronService.stop();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(cronService["jobs"]).toHaveLength(0);

      cronService["runningJobs"].delete("test-job");

      await stopPromise;
    });
  });

  describe("wrapJob", () => {
    it("should execute job handler successfully", async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);

      await cronService.initialize();

      const wrappedJob = cronService["wrapJob"]("test-job", mockHandler);
      await wrappedJob();

      expect(mockHandler).toHaveBeenCalled();
    });

    it("should prevent concurrent job execution", async () => {
      const mockHandler = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100)),
      );

      const wrappedJob = cronService["wrapJob"]("test-job", mockHandler);

      const promise1 = wrappedJob();
      const promise2 = wrappedJob();

      await Promise.all([promise1, promise2]);

      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it("should track running jobs", async () => {
      const mockHandler = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 50)),
      );

      const wrappedJob = cronService["wrapJob"]("test-job", mockHandler);

      const promise = wrappedJob();

      expect(cronService["runningJobs"].has("test-job")).toBe(true);

      await promise;

      expect(cronService["runningJobs"].has("test-job")).toBe(false);
    });

    it("should remove job from running set after completion", async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);

      const wrappedJob = cronService["wrapJob"]("test-job", mockHandler);
      await wrappedJob();

      expect(cronService["runningJobs"].has("test-job")).toBe(false);
    });

    it("should remove job from running set after error", async () => {
      const mockHandler = jest.fn().mockRejectedValue(new Error("Job failed"));

      const wrappedJob = cronService["wrapJob"]("test-job", mockHandler);
      await wrappedJob();

      expect(cronService["runningJobs"].has("test-job")).toBe(false);
    });

    it("should handle job errors gracefully", async () => {
      const mockHandler = jest.fn().mockRejectedValue(new Error("Job failed"));

      const wrappedJob = cronService["wrapJob"]("test-job", mockHandler);

      await expect(wrappedJob()).resolves.not.toThrow();
    });
  });

  describe("job handlers", () => {
    it("should call microsoftService.sync for sync-employees job", async () => {
      await cronService.initialize();

      const syncJob = cronInstances.find(job => job.schedule === "0 0 * * *");
      await syncJob.handler();

      expect(microsoftService.sync).toHaveBeenCalled();
    });

    it("should call backupService.createBackup for database-backup job", async () => {
      Object.defineProperty(envModule.env, "BACKUP_ENABLED", {
        value: true,
        writable: true,
        configurable: true,
      });

      await cronService.initialize();

      const backupJob = cronInstances.find(job => job.schedule === "0 2 * * *");
      await backupJob.handler();

      expect(backupService.createBackup).toHaveBeenCalled();
    });

    it("should call sessionService.deleteExpiredSessions for session-cleanup job", async () => {
      await cronService.initialize();

      const cleanupJob = cronInstances.find(job => job.schedule === "0 3 * * *");
      await cleanupJob.handler();

      expect(sessionService.deleteExpiredSessions).toHaveBeenCalled();
    });
  });

  describe("job schedules", () => {
    it("should schedule sync-employees at midnight", async () => {
      await cronService.initialize();

      const syncJob = cronInstances.find(job => job.schedule === "0 0 * * *");
      expect(syncJob).toBeDefined();
      expect(syncJob?.start).toBe(true);
    });

    it("should schedule database-backup at 2 AM", async () => {
      Object.defineProperty(envModule.env, "BACKUP_ENABLED", {
        value: true,
        writable: true,
        configurable: true,
      });

      await cronService.initialize();

      const backupJob = cronInstances.find(job => job.schedule === "0 2 * * *");
      expect(backupJob).toBeDefined();
      expect(backupJob?.start).toBe(true);
    });

    it("should schedule session-cleanup at 3 AM", async () => {
      await cronService.initialize();

      const cleanupJob = cronInstances.find(job => job.schedule === "0 3 * * *");
      expect(cleanupJob).toBeDefined();
      expect(cleanupJob?.start).toBe(true);
    });

    it("should use America/New_York timezone for all jobs", async () => {
      await cronService.initialize();

      cronInstances.forEach((job) => {
        expect(job.timezone).toBe("America/New_York");
      });
    });
  });
});
