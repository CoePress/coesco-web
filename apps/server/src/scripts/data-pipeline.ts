/* eslint-disable node/prefer-global/process */
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { env } from "@/config/env";
import { legacyService } from "@/services";
import { logger } from "@/utils/logger";

export const mainDatabase = new PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
});

export async function closeDatabaseConnections() {
  await mainDatabase.$disconnect();
  await legacyService.close();
}

interface FieldMapping {
  from: string;
  to: string;
  transform?: (value: any, record?: any) => any;
  defaultValue?: any;
  required?: boolean;
}

interface TableMapping {
  sourceDatabase: "quote" | "std" | "job";
  sourceTable: string;
  targetTable: string;
  fieldMappings: FieldMapping[];
  filter?: (record: any) => boolean;
  beforeSave?: (mappedData: any, originalRecord: any) => any;
  afterSave?: (savedRecord: any, originalRecord: any) => Promise<void>;
  batchSize?: number;
  skipDuplicates?: boolean;
  duplicateCheck?: (mappedData: any) => any;
}

interface MigrationResult {
  total: number;
  created: number;
  skipped: number;
  errors: number;
  errorDetails: Array<{ record: any; error: any }>;
}

export async function migrateWithMapping(mapping: TableMapping): Promise<MigrationResult> {
  const result: MigrationResult = {
    total: 0,
    created: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
  };

  try {
    logger.info(`Starting migration: ${mapping.sourceDatabase}.${mapping.sourceTable} → ${mapping.targetTable}`);

    const params = {
      filter: null,
      limit: null,
      sort: null,
      order: null,
    };

    const sourceRecords: any = await legacyService.getAll(
      mapping.sourceDatabase,
      mapping.sourceTable,
      params,
    );

    if (!sourceRecords || sourceRecords.length === 0) {
      logger.warn(`No records found in ${mapping.sourceTable}`);
      return result;
    }

    result.total = sourceRecords.length;
    logger.info(`Found ${result.total} records to migrate`);

    const batchSize = mapping.batchSize || 100;
    const batches = Math.ceil(sourceRecords.length / batchSize);

    for (let batch = 0; batch < batches; batch++) {
      const start = batch * batchSize;
      const end = Math.min(start + batchSize, sourceRecords.length);
      const batchRecords = sourceRecords.slice(start, end);

      logger.info(`Processing batch ${batch + 1}/${batches} (records ${start + 1}-${end})`);

      for (const record of batchRecords) {
        try {
          // Apply filter if provided
          if (mapping.filter && !mapping.filter(record)) {
            result.skipped++;
            continue;
          }

          // Map fields
          const mappedData: any = {};
          let skipRecord = false;

          for (const fieldMap of mapping.fieldMappings) {
            const sourceValue = record[fieldMap.from];

            // Check required fields
            if (fieldMap.required && (sourceValue === null || sourceValue === undefined)) {
              logger.warn(`Required field ${fieldMap.from} is missing in record`);
              skipRecord = true;
              break;
            }

            // Apply transformation or use default value
            let targetValue;
            if (fieldMap.transform) {
              targetValue = fieldMap.transform(sourceValue, record);
            }
            else if (sourceValue !== null && sourceValue !== undefined) {
              targetValue = sourceValue;
            }
            else if (fieldMap.defaultValue !== undefined) {
              targetValue = fieldMap.defaultValue;
            }
            else {
              targetValue = null;
            }

            mappedData[fieldMap.to] = targetValue;
          }

          if (skipRecord) {
            result.skipped++;
            continue;
          }

          // Apply beforeSave hook if provided
          const dataToSave = mapping.beforeSave
            ? mapping.beforeSave(mappedData, record)
            : mappedData;

          // Check for duplicates if configured
          if (mapping.skipDuplicates) {
            const duplicateCheck = mapping.duplicateCheck
              ? mapping.duplicateCheck(dataToSave)
              : dataToSave;

            const existingRecord = await (mainDatabase as any)[mapping.targetTable].findFirst({
              where: duplicateCheck,
            });

            if (existingRecord) {
              logger.debug(`Skipping duplicate record: ${JSON.stringify(duplicateCheck)}`);
              result.skipped++;
              continue;
            }
          }

          // Save to database
          const savedRecord = await (mainDatabase as any)[mapping.targetTable].create({
            data: dataToSave,
          });

          result.created++;

          // Apply afterSave hook if provided
          if (mapping.afterSave) {
            await mapping.afterSave(savedRecord, record);
          }

          logger.debug(`Created record ${result.created}/${result.total}`);
        }
        catch (error) {
          logger.error(`Error processing record:`, error);
          result.errors++;
          result.errorDetails.push({ record, error });
        }
      }
    }

    logger.info(
      `Migration complete: ${result.created} created, ${result.skipped} skipped, ${result.errors} errors`,
    );
  }
  catch (error) {
    logger.error(`Fatal error during migration:`, error);
    throw error;
  }

  return result;
}

export async function cleanOrderGaps(
  tableName: string,
  orderField: string,
  whereCondition?: any,
): Promise<void> {
  try {
    logger.info(`Cleaning order gaps in ${tableName}.${orderField}...`);

    // Get all records ordered by the order field
    const records = await (mainDatabase as any)[tableName].findMany({
      where: whereCondition || {},
      orderBy: { [orderField]: "asc" },
    });

    if (!records || records.length === 0) {
      logger.warn(`No records found in ${tableName}`);
      return;
    }

    // Update each record with sequential order
    let updateCount = 0;
    for (let i = 0; i < records.length; i++) {
      const newOrder = i + 1;
      const currentOrder = records[i][orderField];

      if (currentOrder !== newOrder) {
        await (mainDatabase as any)[tableName].update({
          where: { id: records[i].id },
          data: { [orderField]: newOrder },
        });
        updateCount++;
        logger.info(`Updated ${tableName} record ${records[i].id}: ${currentOrder} → ${newOrder}`);
      }
    }

    logger.info(`Order cleanup complete: ${updateCount} records updated in ${tableName}.${orderField}`);
  }
  catch (error) {
    logger.error(`Error cleaning order gaps in ${tableName}.${orderField}:`, error);
    throw error;
  }
}

export async function extractDatabaseSchema(database: "quote" | "std" | "job"): Promise<void> {
  try {
    const tables = await legacyService.getTables(database);
    logger.info(`Found ${tables?.length || 0} tables in ${database} database`);

    if (!tables || tables.length === 0) {
      logger.warn(`No tables found in ${database} database`);
      return;
    }

    const schemaData: Array<{ table: string; fields: string[] }> = [];

    for (const table of tables) {
      logger.info(`Processing table: ${table}`);

      const fields = await legacyService.getFields(database, table);

      if (fields && fields.length > 0) {
        schemaData.push({
          table,
          fields: fields as string[],
        });
        logger.info(`  Found ${fields.length} fields`);
      }
      else {
        logger.warn(`  No fields found for table: ${table}`);
      }
    }

    let output = `DATABASE SCHEMA ANALYSIS - ${database.toUpperCase()}\n`;
    output += "========================\n\n";
    output += `Total Tables: ${schemaData.length}\n`;
    output += `Generated: ${new Date().toISOString()}\n\n`;

    schemaData.forEach(({ table, fields }) => {
      output += `TABLE: ${table}\n`;
      output += `Fields (${fields.length}):\n`;
      fields.forEach((field) => {
        output += `  - ${field}\n`;
      });
      output += "\n";
    });

    output += "\n=== FIELD INDEX ===\n";
    const allFields = new Set<string>();
    schemaData.forEach(({ table, fields }) => {
      fields.forEach((field) => {
        allFields.add(`${table}.${field}`);
      });
    });

    Array.from(allFields).sort().forEach((field) => {
      output += `${field}\n`;
    });

    const filename = `${database}_schema_${Date.now()}.txt`;
    const filepath = join(process.cwd(), filename);

    writeFileSync(filepath, output, "utf8");

    logger.info(`Schema data saved to: ${filepath}`);
    logger.info(`Total unique fields: ${allFields.size}`);
  }
  catch (error) {
    logger.error(`Error extracting ${database} schema:`, error);
    throw error;
  }
}

export async function migrateCoilTypes(): Promise<MigrationResult> {
  const mapping: TableMapping = {
    sourceDatabase: "quote",
    sourceTable: "CoilType",
    targetTable: "coilType",
    fieldMappings: [
      {
        from: "CoilDesc",
        to: "description",
        required: true,
      },
      {
        from: "CoilMult",
        to: "multiplier",
        transform: (value) => value || 1,
      },
      {
        from: "SortOrder",
        to: "sortOrder",
        transform: (value) => Number.parseInt(value) || 999,
      },
      {
        from: "IsArchived",
        to: "isArchived",
        transform: (value) => value === "1",
      },
    ],
    skipDuplicates: true,
    duplicateCheck: (data) => ({
      AND: [
        { description: data.description },
        { multiplier: data.multiplier },
        { sortOrder: data.sortOrder },
        { isArchived: data.isArchived },
      ],
    }),
    batchSize: 50,
  };

  const result = await migrateWithMapping(mapping);

  // Clean up order gaps after migration
  if (result.created > 0) {
    await cleanOrderGaps("coilType", "sortOrder");
  }

  return result;
}

export async function migrateOptionCategories(): Promise<MigrationResult> {
  const mapping: TableMapping = {
    sourceDatabase: "quote",
    sourceTable: "OptGroup",
    targetTable: "optionCategory",
    fieldMappings: [
      {
        from: "GrpID",
        to: "oldId",
        transform: (value) => value?.toString(),
      },
      {
        from: "GrpName",
        to: "name",
        transform: (value) => value?.trim(),
        required: true,
      },
      {
        from: "GrpDescription",
        to: "description",
        defaultValue: null,
      },
      {
        from: "Multiple",
        to: "multiple",
        transform: (value) => value?.toLowerCase() === "multiple",
      },
      {
        from: "Mandatory",
        to: "mandatory",
        transform: (value) => value?.toLowerCase() === "mandatory",
      },
      {
        from: "GrpOrder",
        to: "order",
        transform: (value) => Number.parseInt(value) || 0,
      },
    ],
    skipDuplicates: true,
    duplicateCheck: (data) => ({
      AND: [
        { name: data.name },
        { description: data.description },
        { multiple: data.multiple },
        { mandatory: data.mandatory },
        { order: data.order },
        { oldId: data.oldId },
      ],
    }),
    batchSize: 50,
  };

  const result = await migrateWithMapping(mapping);

  // Clean up order gaps after migration
  if (result.created > 0) {
    await cleanOrderGaps("optionCategory", "order");
  }

  return result;
}

// Example: Create a custom migration with complex transformations
export async function migrateCustomTable(): Promise<MigrationResult> {
  const mapping: TableMapping = {
    sourceDatabase: "std",
    sourceTable: "OldCustomers",
    targetTable: "customers",
    fieldMappings: [
      {
        from: "CustID",
        to: "id",
        transform: (value) => Number.parseInt(value),
      },
      {
        from: "CustName",
        to: "name",
        transform: (value) => value?.trim().toUpperCase(),
        required: true,
      },
      {
        from: "CustEmail",
        to: "email",
        transform: (value) => value?.toLowerCase().trim(),
      },
      {
        from: "Active",
        to: "isActive",
        transform: (value) => value === "Y" || value === "1",
        defaultValue: true,
      },
    ],
    // Filter out inactive records during migration
    filter: (record) => record.Active !== "N" && record.Active !== "0",
    // Enrich data before saving
    beforeSave: (data, original) => {
      data.createdAt = new Date();
      data.updatedAt = new Date();
      data.legacyId = original.CustID;
      return data;
    },
    // Post-processing after save
    afterSave: async (saved, original) => {
      // Log successful migrations to audit table
      logger.info(`Migrated customer ${original.CustID} to ${saved.id}`);
    },
    skipDuplicates: true,
    duplicateCheck: (data) => ({ email: data.email }),
    batchSize: 100,
  };

  return await migrateWithMapping(mapping);
}

async function main() {
  try {
    await legacyService.initialize();

    // Example usage:
    // const schemaResult = await extractDatabaseSchema("quote");
    const coilResult = await migrateCoilTypes();
    const optionResult = await migrateOptionCategories();
    // const customResult = await migrateCustomTable();

    // Log results
    logger.info("Migration Results:", {
      coilTypes: coilResult,
      optionCategories: optionResult,
      // custom: customResult,
    });
  }
  catch (error) {
    logger.error("Error in main:", error);
  }
  finally {
    await closeDatabaseConnections();
    process.exit(0);
  }
}

main();
