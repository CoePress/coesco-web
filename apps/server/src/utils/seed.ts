/* eslint-disable node/prefer-global/process */
import { microsoftService } from "@/services";

import { logger } from "./logger";

async function seed() {
  await microsoftService.sync();

  logger.info("All seeding completed successfully");
  process.exit(0);
}

seed().catch((error) => {
  logger.error("Fatal error during seeding:", error);
  process.exit(1);
});
