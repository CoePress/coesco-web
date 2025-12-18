import fs from "node:fs/promises";
import path from "node:path";

import type { DatabaseName, DatabaseSchema } from "../lib/odbc-types";

import logger from "../lib/logger";
import { connectionManager, legacyService } from "../lib/odbc";

const OUTPUT_DIR = path.join(__dirname, "../../schemas");

async function ensureOutputDir(): Promise<void> {
  try {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
  }
  catch {
    // Directory already exists
  }
}

async function saveSchema(schema: DatabaseSchema): Promise<void> {
  const filePath = path.join(OUTPUT_DIR, `${schema.database}.json`);
  await fs.writeFile(filePath, JSON.stringify(schema, null, 2));
  logger.info(`Saved schema to ${filePath}`);
}

async function extractAllSchemas(): Promise<void> {
  const databases: DatabaseName[] = ["std", "job", "quote"];

  await ensureOutputDir();

  for (const db of databases) {
    logger.info(`Extracting schema for ${db.toUpperCase()}...`);
    const schema = await legacyService.getDatabaseSchema(db);

    if (schema) {
      await saveSchema(schema);
      logger.info(
        `${db.toUpperCase()}: ${schema.tables.length} tables, `
        + `${schema.tables.reduce((sum, t) => sum + t.columns.length, 0)} total columns`,
      );
    }
    else {
      logger.warn(`Failed to extract schema for ${db.toUpperCase()}`);
    }
  }
}

async function extractSingleSchema(database: DatabaseName): Promise<void> {
  await ensureOutputDir();

  logger.info(`Extracting schema for ${database.toUpperCase()}...`);
  const schema = await legacyService.getDatabaseSchema(database);

  if (schema) {
    await saveSchema(schema);
    logger.info(
      `${database.toUpperCase()}: ${schema.tables.length} tables, `
      + `${schema.tables.reduce((sum, t) => sum + t.columns.length, 0)} total columns`,
    );
  }
  else {
    logger.warn(`Failed to extract schema for ${database.toUpperCase()}`);
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const targetDb = args[0] as DatabaseName | undefined;

  try {
    await connectionManager.initialize();

    if (targetDb && ["std", "job", "quote"].includes(targetDb)) {
      await extractSingleSchema(targetDb);
    }
    else {
      await extractAllSchemas();
    }

    logger.info("Schema extraction complete");
  }
  catch (err) {
    logger.error("Schema extraction failed:", err);
    process.exit(1);
  }
  finally {
    await connectionManager.close();
  }
}

main();
