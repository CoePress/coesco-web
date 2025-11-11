/* eslint-disable node/prefer-global/process */
import { PrismaClient } from "@prisma/client";
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

import { logger } from "@/utils/logger";

const prisma = new PrismaClient();

async function runMigrationScripts() {
  try {
    logger.info("🔍 Checking for migration scripts...\n");

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "_MigrationScripts" (
        "migrationName" TEXT PRIMARY KEY,
        "executedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    const migrationsDir = join(__dirname, "../../prisma/migrations");
    const migrationFolders = await readdir(migrationsDir);

    const sortedMigrations = migrationFolders
      .filter(folder => /^\d{14}_/.test(folder))
      .sort();

    let scriptsFound = 0;
    let scriptsExecuted = 0;
    let scriptsSkipped = 0;

    for (const migrationFolder of sortedMigrations) {
      const migrationPath = join(migrationsDir, migrationFolder);
      const migrationStat = await stat(migrationPath);

      if (!migrationStat.isDirectory())
        continue;

      const tsScriptPath = join(migrationPath, "post-migration.ts");
      const jsScriptPath = join(migrationPath, "post-migration.js");

      let scriptPath: string | null = null;

      try {
        await stat(tsScriptPath);
        scriptPath = tsScriptPath;
      }
      catch {
        try {
          await stat(jsScriptPath);
          scriptPath = jsScriptPath;
        }
        catch {
          continue;
        }
      }

      scriptsFound++;

      const existingExecution = await prisma.$queryRawUnsafe<Array<{ migrationName: string }>>(
        `SELECT "migrationName" FROM "_MigrationScripts" WHERE "migrationName" = $1`,
        migrationFolder,
      );

      if (existingExecution.length > 0) {
        logger.info(`⏭️  ${migrationFolder}: Already executed, skipping`);
        scriptsSkipped++;
        continue;
      }

      logger.info(`🚀 ${migrationFolder}: Executing post-migration script...`);

      try {
        const script = await import(scriptPath);
        const scriptFunction = script.default || script;

        if (typeof scriptFunction !== "function") {
          throw new TypeError("Script must export a default function");
        }

        await scriptFunction(prisma);

        await prisma.$executeRawUnsafe(
          `INSERT INTO "_MigrationScripts" ("migrationName") VALUES ($1)`,
          migrationFolder,
        );

        logger.info(`✅ ${migrationFolder}: Completed successfully\n`);
        scriptsExecuted++;
      }
      catch (error) {
        logger.error(`❌ ${migrationFolder}: Failed to execute`);
        logger.error(error);
        throw new Error(`Migration script failed for ${migrationFolder}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    logger.info("━".repeat(50));
    logger.info(`📊 Summary:`);
    logger.info(`   Total scripts found: ${scriptsFound}`);
    logger.info(`   Scripts executed: ${scriptsExecuted}`);
    logger.info(`   Scripts skipped: ${scriptsSkipped}`);
    logger.info("━".repeat(50));

    if (scriptsExecuted === 0 && scriptsFound === 0) {
      logger.info("ℹ️  No migration scripts found. This is normal if you haven't created any yet.\n");
    }
    else if (scriptsExecuted === 0 && scriptsSkipped > 0) {
      logger.info("ℹ️  All migration scripts have already been executed.\n");
    }
    else {
      logger.info("✨ Migration scripts completed successfully!\n");
    }
  }
  catch (error) {
    logger.error("\n💥 Fatal error running migration scripts:");
    logger.error(error);
    process.exit(1);
  }
  finally {
    await prisma.$disconnect();
  }
}

runMigrationScripts();
