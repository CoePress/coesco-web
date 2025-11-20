import { CronJob } from "cron";

import { env } from "@/config/env";
import { assetService, backupService, microsoftService, sessionService } from "@/services";
import { logger } from "@/utils/logger";

export class CronService {
  private jobs: CronJob[] = [];
  private runningJobs: Set<string> = new Set();

  async initialize(): Promise<void> {
    this.jobs.push(
      new CronJob(
        "0 0 * * *",
        this.wrapJob("sync-employees", async () => {
          await microsoftService.sync();
        }),
        null,
        true,
        "America/New_York",
      ),
    );

    if (env.BACKUP_ENABLED) {
      this.jobs.push(
        new CronJob(
          "0 2 * * *",
          this.wrapJob("database-backup", async () => {
            await backupService.createBackup();
          }),
          null,
          true,
          "America/New_York",
        ),
      );
      logger.info("Database backup cron job scheduled for 2:00 AM daily");
    }

    this.jobs.push(
      new CronJob(
        "0 3 * * *",
        this.wrapJob("session-cleanup", async () => {
          await sessionService.deleteExpiredSessions();
        }),
        null,
        true,
        "America/New_York",
      ),
    );
    logger.info("Session cleanup cron job scheduled for 3:00 AM daily");

    this.jobs.push(
      new CronJob(
        "0 4 * * *",
        this.wrapJob("asset-cleanup", async () => {
          const count = await assetService.cleanupDeletedAssets(30);
          logger.info(`Asset cleanup completed: ${count} assets permanently deleted`);
        }),
        null,
        true,
        "America/New_York",
      ),
    );
    logger.info("Asset cleanup cron job scheduled for 4:00 AM daily");
  }

  async stop(): Promise<void> {
    logger.info("Stopping cron jobs..");

    this.jobs.forEach(job => job.stop());
    this.jobs = [];

    while (this.runningJobs.size > 0) {
      logger.info(`Waiting for ${this.runningJobs.size} jobs to complete..`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    logger.info("All cron jobs stopped");
  }

  private wrapJob(name: string, handler: () => Promise<void> | void) {
    return async () => {
      if (this.runningJobs.has(name)) {
        logger.info(`Job ${name} already running, skipping...`);
        return;
      }

      this.runningJobs.add(name);
      const startTime = Date.now();

      try {
        logger.info(`Starting job: ${name}`);
        await handler();
        const duration = Date.now() - startTime;
        logger.info(`Job ${name} completed in ${duration}ms`);
      }
      catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`Job ${name} failed after ${duration}ms:`, error);
      }
      finally {
        this.runningJobs.delete(name);
      }
    };
  }
}
