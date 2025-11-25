import { PrismaClient } from "@prisma/client";

import { env } from "@/config/env";
import { LegacyService } from "@/services/core/legacy.service";
import { logger } from "@/utils/logger";

export type LegacyDatabase = "quote" | "std" | "job";

export interface FieldMapping {
  from: string;
  to: string;
  transform?: (value: any, record?: any) => any;
  defaultValue?: any;
  required?: boolean;
}

export interface MigrationConfig {
  sourceDatabase: LegacyDatabase;
  sourceTable: string;
  targetTable: string;
  fieldMappings: FieldMapping[];
  filter?: (record: any) => boolean;
  beforeSave?: (data: any, original: any, ctx: MigrationContext) => any | Promise<any>;
  afterBatch?: (ctx: MigrationContext) => void | Promise<void>;
  batchSize?: number;
  legacyFetchSize?: number;
  skipDuplicates?: boolean;
  sort?: string;
  order?: "ASC" | "DESC";
}

export interface MigrationResult {
  total: number;
  created: number;
  skipped: number;
  errors: number;
}

export interface MigrationContext {
  db: PrismaClient;
  legacy: LegacyService;
  findRecord: <T>(table: string, where: any) => Promise<T | null>;
  cache: Map<string, any>;
}

export interface Migration {
  name: string;
  run: (ctx: MigrationContext) => Promise<MigrationResult>;
}

const db = new PrismaClient({
  datasources: { db: { url: env.DATABASE_URL } },
  log: ["warn", "error"],
});

const legacy = new LegacyService();
const recordCache = new Map<string, any>();

export async function createContext(): Promise<MigrationContext> {
  await legacy.initialize();

  return {
    db,
    legacy,
    cache: new Map(),
    findRecord: async <T>(table: string, where: any): Promise<T | null> => {
      const key = `${table}:${JSON.stringify(where)}`;
      if (recordCache.has(key))
        return recordCache.get(key);

      try {
        const record = await (db as any)[table].findFirst({ where });
        if (record)
          recordCache.set(key, record);
        return record;
      }
      catch {
        return null;
      }
    },
  };
}

export async function closeConnections(): Promise<void> {
  await db.$disconnect();
  await legacy.close();
  recordCache.clear();
}

export async function runMigration(config: MigrationConfig, ctx: MigrationContext): Promise<MigrationResult> {
  const result: MigrationResult = { total: 0, created: 0, skipped: 0, errors: 0 };
  const { sourceDatabase, sourceTable, targetTable, legacyFetchSize = 5000 } = config;

  logger.info(`Migration: ${sourceDatabase}.${sourceTable} → ${targetTable}`);

  const params = { filter: null, sort: config.sort || null, order: config.order || null, offset: 0 };
  const totalCount = await legacy.getCount(sourceDatabase, sourceTable, params);

  logger.info(`Found ${totalCount} records`);

  let processed = 0;

  while (processed < totalCount) {
    const page = await legacy.getAllPaginated(sourceDatabase, sourceTable, { ...params, totalCount }, legacyFetchSize);

    if (!page.records?.length)
      break;

    const records = page.records;
    processed += records.length;

    const toCreate: any[] = [];

    for (const record of records) {
      try {
        if (config.filter && !config.filter(record)) {
          result.skipped++;
          continue;
        }

        const mapped: any = {};
        let skip = false;

        for (const field of config.fieldMappings) {
          const val = record[field.from];
          if (field.required && val == null) {
            skip = true;
            break;
          }
          mapped[field.to] = field.transform ? field.transform(val, record) : val ?? field.defaultValue ?? null;
        }

        if (skip) {
          result.skipped++;
          continue;
        }

        const final = config.beforeSave ? await config.beforeSave(mapped, record, ctx) : mapped;

        if (!final) {
          result.skipped++;
          continue;
        }

        const clean = Object.fromEntries(Object.entries(final).filter(([k]) => !k.startsWith("_")));
        toCreate.push(clean);
      }
      catch (err: any) {
        result.errors++;
        logger.error(`Record error: ${err.message}`);
      }
    }

    if (toCreate.length) {
      try {
        const created = await db.$transaction(async (tx) => {
          const res = await (tx as any)[targetTable].createMany({
            data: toCreate,
            skipDuplicates: config.skipDuplicates ?? true,
          });
          return res.count;
        });

        result.created += created;
        result.skipped += toCreate.length - created;
      }
      catch (err: any) {
        result.errors += toCreate.length;
        logger.error(`Batch error: ${err.message}`);
      }
    }

    if (config.afterBatch)
      await config.afterBatch(ctx);

    params.offset = page.nextOffset;
    if (!page.hasMore)
      break;

    logger.info(`Progress: ${processed}/${totalCount} | Created: ${result.created} | Skipped: ${result.skipped}`);
  }

  result.total = processed;
  logger.info(`Done: ${result.created} created, ${result.skipped} skipped, ${result.errors} errors`);

  return result;
}

export async function runMigrations(migrations: Migration[]): Promise<void> {
  const ctx = await createContext();
  const start = Date.now();

  try {
    for (const migration of migrations) {
      logger.info(`\n=== ${migration.name} ===`);
      await migration.run(ctx);
    }
  }
  finally {
    await closeConnections();
    logger.info(`\nTotal time: ${((Date.now() - start) / 1000).toFixed(1)}s`);
  }
}
