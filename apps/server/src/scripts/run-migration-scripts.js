/* eslint-disable no-console */
/* eslint-disable node/prefer-global/process */
const { PrismaClient } = require("@prisma/client");
const { readdir, stat } = require("node:fs/promises");
const { join } = require("node:path");

const prisma = new PrismaClient();

async function runMigrationScripts() {
  try {
    console.log("🔍 Checking for migration scripts...\n");

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

      const jsScriptPath = join(migrationPath, "post-migration.js");

      let scriptPath = null;

      try {
        await stat(jsScriptPath);
        scriptPath = jsScriptPath;
      }
      catch {
        continue;
      }

      scriptsFound++;

      const existingExecution = await prisma.$queryRawUnsafe(
        `SELECT "migrationName" FROM "_MigrationScripts" WHERE "migrationName" = $1`,
        migrationFolder,
      );

      if (existingExecution.length > 0) {
        console.log(`⏭️  ${migrationFolder}: Already executed, skipping`);
        scriptsSkipped++;
        continue;
      }

      console.log(`🚀 ${migrationFolder}: Executing post-migration script...`);

      try {
        const script = require(scriptPath);
        const scriptFunction = script.default || script;

        if (typeof scriptFunction !== "function") {
          throw new TypeError("Script must export a default function");
        }

        await scriptFunction(prisma);

        await prisma.$executeRawUnsafe(
          `INSERT INTO "_MigrationScripts" ("migrationName") VALUES ($1)`,
          migrationFolder,
        );

        console.log(`✅ ${migrationFolder}: Completed successfully\n`);
        scriptsExecuted++;
      }
      catch (error) {
        console.error(`❌ ${migrationFolder}: Failed to execute`);
        console.error(error);
        throw new Error(`Migration script failed for ${migrationFolder}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    console.log("━".repeat(50));
    console.log(`📊 Summary:`);
    console.log(`   Total scripts found: ${scriptsFound}`);
    console.log(`   Scripts executed: ${scriptsExecuted}`);
    console.log(`   Scripts skipped: ${scriptsSkipped}`);
    console.log("━".repeat(50));

    if (scriptsExecuted === 0 && scriptsFound === 0) {
      console.log("ℹ️  No migration scripts found. This is normal if you haven't created any yet.\n");
    }
    else if (scriptsExecuted === 0 && scriptsSkipped > 0) {
      console.log("ℹ️  All migration scripts have already been executed.\n");
    }
    else {
      console.log("✨ Migration scripts completed successfully!\n");
    }
  }
  catch (error) {
    console.error("\n💥 Fatal error running migration scripts:");
    console.error(error);
    process.exit(1);
  }
  finally {
    await prisma.$disconnect();
  }
}

runMigrationScripts();
