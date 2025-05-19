import { createDateRange } from "@/utils";
import { logger } from "@/utils/logger";
import { emailService, employeeService } from ".";
import { CronJob } from "cron";
import { ISendEmailOptions } from "@/types/schema.types";

export class CronService {
  private jobs: CronJob[] = [];
  private runningJobs: Set<string> = new Set();

  constructor() {
    this.start();
  }

  start(): void {
    logger.info("Starting cron jobs..");

    // Sync employees every day at midnight est
    this.jobs.push(
      new CronJob(
        "0 0 * * *",
        this.wrapJob("sync-employees", async () => {
          await employeeService.syncEmployees();
        }),
        null,
        true,
        "America/New_York"
      )
    );

    // Email production report every Monday at 8am est
    this.jobs.push(
      new CronJob(
        "0 8 * * 0",
        this.wrapJob("send-production-report", this.sendProductionReport),
        null,
        true,
        "America/New_York"
      )
    );

    logger.info(`Started ${this.jobs.length} cron jobs`);
  }

  async stop(): Promise<void> {
    logger.info("Stopping cron jobs..");

    this.jobs.forEach((job) => job.stop());

    while (this.runningJobs.size > 0) {
      logger.info(`Waiting for ${this.runningJobs.size} jobs to complete..`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    this.jobs = [];
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
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`Job ${name} failed after ${duration}ms:`, error);
      } finally {
        this.runningJobs.delete(name);
      }
    };
  }

  private async sendProductionReport(): Promise<void> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date();

    const dateRange = createDateRange(
      startDate.toISOString(),
      endDate.toISOString()
    );

    const productionReport = {};

    const recipients = ["jar@cpec.com"];

    const options: ISendEmailOptions = {
      template: "production-report",
      data: {
        productionReport,
      },
      to: recipients,
      from: "noreply@cpec.com",
      subject: "Production Report",
      attachments: [],
    };

    await emailService.sendEmail(options);

    logger.info("Generating production report...");
  }
}
