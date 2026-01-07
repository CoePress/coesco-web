import cron from "node-cron";

import logger from "./logger";

export interface CronJob {
  name: string;
  schedule: string;
  enabled?: boolean;
  run: () => Promise<void> | void;
}

export function startCron(jobs: CronJob[]) {
  for (const job of jobs) {
    if (job.enabled === false)
      continue;

    if (!cron.validate(job.schedule)) {
      throw new Error(`Invalid cron schedule for ${job.name}: ${job.schedule}`);
    }

    cron.schedule(job.schedule, async () => {
      try {
        await job.run();
      }
      catch (err) {
        logger.error("cron.job_failed", { job: job.name, err });
      }
    });

    logger.info("cron.job_registered", { job: job.name, schedule: job.schedule });
  }

  logger.info("cron.started", { jobs: jobs.filter(j => j.enabled !== false).length });
}
