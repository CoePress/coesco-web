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
  beforeSave?: (mappedData: any, originalRecord: any) => any | Promise<any>;
  afterSave?: (savedRecord: any, originalRecord: any) => Promise<void>;
  batchSize?: number; // For Prisma operations
  legacyFetchSize?: number; // For legacy DB fetch operations
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

export async function enrichMigratedData(
  targetTable: string,
  sourceDatabase: "quote" | "std" | "job",
  sourceTable: string,
  matchField: { target: string; source: string },
  enrichmentMappings: Array<{ sourceField: string; targetPath: string; transform?: (value: any) => any }>,
): Promise<{ updated: number; errors: number }> {
  const result = { updated: 0, errors: 0 };

  try {
    logger.info(`Starting enrichment: ${sourceDatabase}.${sourceTable} → ${targetTable}`);

    const params = {
      filter: null,
      sort: null,
      order: null,
      offset: 0,
    };

    // Get total count first
    const totalCount = await legacyService.getCount(sourceDatabase, sourceTable, params);
    const legacyFetchSize = 5000;
    const expectedBatches = Math.ceil(totalCount / legacyFetchSize);

    logger.info(`Found ${totalCount} enrichment records, expecting ${expectedBatches} batches of ${legacyFetchSize}`);

    let hasMore = true;
    let totalProcessed = 0;
    let currentBatch = 0;

    while (hasMore) {
      // Get paginated source records for enrichment
      const paginatedResult = await legacyService.getAllPaginated(sourceDatabase, sourceTable, params, legacyFetchSize);

      if (!paginatedResult.records || paginatedResult.records.length === 0) {
        logger.warn(`No more enrichment records found in ${sourceTable}`);
        break;
      }

      const sourceRecords = paginatedResult.records;
      totalProcessed += sourceRecords.length;
      currentBatch++;

      logger.info(`Processing enrichment batch ${currentBatch}/${expectedBatches}: ${sourceRecords.length} records (offset: ${params.offset})`);

      // Process each source record
      for (const sourceRecord of sourceRecords) {
        try {
          const matchValue = (sourceRecord as any)[matchField.source];
          if (!matchValue)
            continue;

          // Find target record to update
          // Handle nested path in matchField.target (e.g., "legacy.masterId")
          const targetPathParts = matchField.target.split(".");

          const targetRecord = targetPathParts.length > 1
            ? await (mainDatabase as any)[targetTable].findMany().then((records: any[]) => {
                return records.find((r: any) => {
                  let value = r;
                  for (const part of targetPathParts) {
                    value = value?.[part];
                  }
                  return value === matchValue;
                });
              })
            : await (mainDatabase as any)[targetTable].findFirst({
                where: { [matchField.target]: matchValue },
              });

          if (!targetRecord) {
            logger.debug(`No matching record found for ${matchField.source}=${matchValue}`);
            continue;
          }

          // Build update data
          const updateData: any = {};
          for (const mapping of enrichmentMappings) {
            const sourceValue = sourceRecord[mapping.sourceField];
            const transformedValue = mapping.transform ? mapping.transform(sourceValue) : sourceValue;

            // Handle nested paths (e.g., "legacy.companyId")
            const pathParts = mapping.targetPath.split(".");
            if (pathParts.length > 1) {
              let current = updateData;
              for (let i = 0; i < pathParts.length - 1; i++) {
                if (!current[pathParts[i]]) {
                // Get existing value for JSON fields
                  if (pathParts[i] === "legacy" && targetRecord.legacy) {
                    current[pathParts[i]] = { ...targetRecord.legacy };
                  }
                  else {
                    current[pathParts[i]] = {};
                  }
                }
                current = current[pathParts[i]];
              }
              current[pathParts[pathParts.length - 1]] = transformedValue;
            }
            else {
              updateData[mapping.targetPath] = transformedValue;
            }
          }

          // Update the record
          await (mainDatabase as any)[targetTable].update({
            where: { id: targetRecord.id },
            data: updateData,
          });

          result.updated++;
          logger.debug(`Updated record ${targetRecord.id} with enrichment data`);
        }
        catch (error) {
          logger.error(`Error enriching record:`, error);
          result.errors++;
        }
      }

      // Update pagination parameters
      hasMore = paginatedResult.hasMore;
      params.offset = paginatedResult.nextOffset;

      logger.info(`Enrichment batch ${currentBatch}/${expectedBatches} complete. Total processed: ${totalProcessed}, Updated: ${result.updated}, Errors: ${result.errors}`);
    }

    logger.info(`Enrichment complete: ${result.updated} updated, ${result.errors} errors from ${totalProcessed} total records`);
  }
  catch (error) {
    logger.error(`Fatal error during enrichment:`, error);
    throw error;
  }

  return result;
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
      sort: null,
      order: null,
      offset: 0,
    };

    // Get total count first
    const totalCount = await legacyService.getCount(mapping.sourceDatabase, mapping.sourceTable, params);
    const legacyFetchSize = mapping.legacyFetchSize || 5000;
    const expectedBatches = Math.ceil(totalCount / legacyFetchSize);

    logger.info(`Found ${totalCount} records, expecting ${expectedBatches} batches of ${legacyFetchSize}`);

    let hasMore = true;
    let totalProcessed = 0;
    let currentBatch = 0;

    while (hasMore) {
      const paginatedResult = await legacyService.getAllPaginated(
        mapping.sourceDatabase,
        mapping.sourceTable,
        params,
        legacyFetchSize,
      );

      if (!paginatedResult.records || paginatedResult.records.length === 0) {
        logger.warn(`No more records found in ${mapping.sourceTable}`);
        break;
      }

      const sourceRecords = paginatedResult.records;
      totalProcessed += sourceRecords.length;
      currentBatch++;

      logger.info(`Processing batch ${currentBatch}/${expectedBatches}: ${sourceRecords.length} records (offset: ${params.offset})`);

      for (const record of sourceRecords) {
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
            ? await mapping.beforeSave(mappedData, record)
            : mappedData;

          // Skip if beforeSave returned null (e.g., missing references)
          if (dataToSave === null) {
            result.skipped++;
            continue;
          }

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

          // Clean up any temporary fields that start with _temp
          const cleanedData = Object.fromEntries(
            Object.entries(dataToSave).filter(([key]) => !key.startsWith("_temp")),
          );

          // Save to database
          logger.debug(`About to create ${mapping.targetTable} with data:`, JSON.stringify(cleanedData, null, 2));
          const savedRecord = await (mainDatabase as any)[mapping.targetTable].create({
            data: cleanedData,
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

      // Update pagination parameters
      hasMore = paginatedResult.hasMore;
      params.offset = paginatedResult.nextOffset;

      logger.info(`Batch ${currentBatch}/${expectedBatches} complete. Total processed: ${totalProcessed}, Created: ${result.created}, Skipped: ${result.skipped}, Errors: ${result.errors}`);
    }

    result.total = totalProcessed;
    logger.info(
      `Migration complete: ${result.created} created, ${result.skipped} skipped, ${result.errors} errors from ${result.total} total records`,
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

export function trimWhitespace(input: string): string {
  return input.trim();
}

export function replaceInternalWhitespace(input: string): string {
  return input.replace(/\s+/g, "-");
}

export async function findReferencedRecord(
  targetTable: string,
  whereCondition: any,
): Promise<any> {
  try {
    const record = await (mainDatabase as any)[targetTable].findFirst({
      where: whereCondition,
    });
    return record;
  }
  catch (error) {
    logger.error(`Error finding referenced record in ${targetTable}:`, error);
    return null;
  }
}

// Migrations
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
        transform: value => value || 1,
      },
      {
        from: "SortOrder",
        to: "sortOrder",
        transform: value => Number.parseInt(value) || 999,
      },
      {
        from: "IsArchived",
        to: "isArchived",
        transform: value => value === "1",
      },
      {
        from: "CoilID",
        to: "legacyId",
        transform: value => value?.toString(),
      },
    ],
    skipDuplicates: true,
    duplicateCheck: data => ({
      AND: [
        { description: data.description },
        { multiplier: data.multiplier },
        { sortOrder: data.sortOrder },
        { isArchived: data.isArchived },
      ],
    }),
    batchSize: 100,
  };

  const result = await migrateWithMapping(mapping);

  // if (result.created > 0) {
  //   await cleanOrderGaps("coilType", "sortOrder");
  // }

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
        to: "legacyId",
        transform: value => value?.toString(),
      },
      {
        from: "GrpName",
        to: "name",
        transform: value => value?.trim(),
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
        transform: value => value?.toLowerCase() === "multiple",
      },
      {
        from: "Mandatory",
        to: "mandatory",
        transform: value => value?.toLowerCase() === "mandatory",
      },
      {
        from: "GrpOrder",
        to: "order",
        transform: value => Number.parseInt(value) || 0,
      },
    ],
    skipDuplicates: true,
    duplicateCheck: data => ({
      name: data.name,
    }),
    batchSize: 100,
  };

  const result = await migrateWithMapping(mapping);

  // Clean up order gaps after migration
  if (result.created > 0) {
    await cleanOrderGaps("optionCategory", "order");
  }

  return result;
}

export async function migrateModels(): Promise<MigrationResult> {
  const mapping: TableMapping = {
    sourceDatabase: "quote",
    sourceTable: "EquipList",
    targetTable: "model",
    fieldMappings: [
      {
        from: "Model",
        to: "model",
        transform: (value) => {
          return replaceInternalWhitespace(trimWhitespace(value));
        },
      },
      {
        from: "Description",
        to: "description",
      },
    ],
    beforeSave: (data, original) => {
      data.data = {
        maxWidth: original.MaxWidth,
        minThickness: original.MinThick,
        maxThickness: original.MaxThick,
        ratio: original.Ratio,
        plusRatio: original.PlusRatio,
        maxSpeed: original.MaxSpeed,
        plusMaxSpeed: original.PlusMaxSpeed,
        acceleration: original.Accel,
        rollDiameter: original.RollDiam,
        airDiameter: original.AirDiam,
        pinchDiameter: original.PinchDiam,
        rollNumber: original.RollNum,
        rollType: original.RollType,
        loopLength: original.LoopLength,
        coilOutsideDiameter: original.CoilOD,
        coilWeight: original.CoilWeight,
        stroke: original.Stroke,
        strokesPerMinute: original.SPM,
        standardCost: original.StdCost,
        percentMargin: original.PerMrg,
        price: original.Price,
        equipmentType: original.EquipType,
        commission: original.Comm,
        leadTime: 112,
      };
      data.createdAt = new Date(original.CreateDate || original.ModifyDate);
      data.updatedAt = new Date(original.ModifyDate || original.CreateDate);
      data.createdById = original.CreateInit.toLowerCase() || "system";
      data.updatedById = original.ModifyInit.toLowerCase() || "system";
      return data;
    },
    skipDuplicates: true,
    duplicateCheck: data => ({
      model: data.model,
    }),
    batchSize: 100,
  };

  const result = await migrateWithMapping(mapping);

  return result;
}

export async function migrateCompanies(): Promise<MigrationResult> {
  const mapping: TableMapping = {
    sourceDatabase: "std",
    sourceTable: "CompanyMaster",
    targetTable: "company",
    fieldMappings: [
      {
        from: "CompanyName",
        to: "name",
        required: true,
      },
    ],
    beforeSave: (data, original) => {
      data.legacy = {
        masterId: original.Master_Id,
      };
      data.createdAt = new Date(original.CreateDate || original.ModifyDate);
      data.updatedAt = new Date(original.ModifyDate || original.CreateDate);
      data.createdById = original.CreateInit?.toLowerCase() || "system";
      data.updatedById = original.ModifyInit?.toLowerCase() || "system";
      return data;
    },
    skipDuplicates: true,
    duplicateCheck: data => ({
      name: data.name,
    }),
    batchSize: 100,
  };

  const result = await migrateWithMapping(mapping);

  // Enrich with CompanyXRef data
  if (result.created > 0) {
    logger.info("Enriching companies with CompanyXRef data...");

    const enrichmentResult = await enrichMigratedData(
      "company",
      "std",
      "CompanyXRef",
      { target: "legacy.masterId", source: "Master_Id" },
      [
        { sourceField: "Company_ID", targetPath: "legacy.companyId", transform: value => value?.toString() },
      ],
    );

    logger.info(`Company enrichment complete: ${enrichmentResult.updated} records updated`);
  }

  return result;
}

export async function migrateQuotes(): Promise<MigrationResult> {
  const mapping: TableMapping = {
    sourceDatabase: "quote",
    sourceTable: "QData",
    targetTable: "quoteHeader",
    fieldMappings: [
      {
        from: "QYear",
        to: "year",
        transform: value => value?.toString(),
      },
      {
        from: "QNum",
        to: "number",
        transform: value => value?.toString(),
      },
      {
        from: "CoeRSM",
        to: "rsmId",
        transform: value => value?.toString(),
      },
      {
        from: "C_Company",
        to: "customerId",
        transform: value => value?.toString(),
      },
      {
        from: "C_Contact",
        to: "customerContactId",
        transform: value => value?.toString(),
      },
      {
        from: "C_Address",
        to: "customerAddressId",
        transform: value => value?.toString(),
      },
      {
        from: "D_Company",
        to: "dealerId",
        transform: value => value?.toString(),
      },
      {
        from: "D_Contact",
        to: "dealerContactId",
        transform: value => value?.toString(),
      },
      {
        from: "D_Address",
        to: "dealerAddressId",
        transform: value => value?.toString(),
      },
      {
        from: "Priority",
        to: "priority",
      },
      {
        from: "Confidence",
        to: "confidence",
      },
    ],
    beforeSave: (data, original) => {
      data.createdAt = new Date(original.CreateDate || original.ModifyDate);
      data.updatedAt = new Date(original.ModifyDate || original.CreateDate);
      data.createdById = original.CreateInit.toLowerCase() || "system";
      data.updatedById = original.ModifyInit.toLowerCase() || "system";
      return data;
    },
    skipDuplicates: true,
    duplicateCheck: data => ({
      AND: [
        { year: data.year },
        { number: data.number },
      ],
    }),
    batchSize: 100,
  };

  const result = await migrateWithMapping(mapping);

  return result;
}

export async function migrateQuoteRevisions(): Promise<MigrationResult> {
  const mapping: TableMapping = {
    sourceDatabase: "quote",
    sourceTable: "QRev",
    targetTable: "quoteDetails",
    fieldMappings: [
      {
        from: "QRev",
        to: "revision",
        transform: value => value?.toString().trim(),
        required: true,
      },
      {
        from: "QDate",
        to: "quoteDate",
        transform: value => new Date(value),
        required: true,
      },
    ],
    beforeSave: async (data, original) => {
      const quoteHeader = await findReferencedRecord("quoteHeader", {
        year: original.QYear?.toString(),
        number: original.QNum?.toString(),
      });

      if (!quoteHeader) {
        logger.warn(`No quoteHeader found for QYear: ${original.QYear}, QNum: ${original.QNum}`);
        return null;
      }

      // Store the ID for duplicate check (will be accessed via closure)
      data._tempQuoteHeaderId = quoteHeader.id;

      data.quoteHeader = {
        connect: { id: quoteHeader.id },
      };
      data.createdAt = new Date(original.CreateDate || original.ModifyDate || new Date());
      data.updatedAt = new Date(original.ModifyDate || original.CreateDate || new Date());
      data.createdById = original.CreateInit?.toLowerCase() || "system";
      data.updatedById = original.ModifyInit?.toLowerCase() || "system";

      logger.debug(`Setting quoteHeaderId: ${quoteHeader.id} for QYear: ${original.QYear}, QNum: ${original.QNum}, QRev: ${original.QRev}`);

      return data;
    },
    filter: (record) => {
      // Only process records with valid QYear, QNum, and QRev
      return record.QYear && record.QNum && record.QRev;
    },
    skipDuplicates: true,
    duplicateCheck: data => ({
      AND: [
        { quoteHeaderId: data._tempQuoteHeaderId },
        { revision: data.revision },
      ],
    }),
    batchSize: 100,
  };

  const result = await migrateWithMapping(mapping);
  return result;
}

export async function migrateQuoteNotes(): Promise<MigrationResult> {
  const mapping: TableMapping = {
    sourceDatabase: "quote",
    sourceTable: "QtNotes",
    targetTable: "quoteNote",
    fieldMappings: [
      {
        from: "Note",
        to: "note",
        transform: value => trimWhitespace(value),
      },
    ],
    beforeSave: async (data, original) => {
      // First find the quoteHeader
      const quoteHeader = await findReferencedRecord("quoteHeader", {
        year: original.QYear?.toString(),
        number: original.QNum?.toString(),
      });

      if (!quoteHeader) {
        logger.warn(`No quoteHeader found for QYear: ${original.QYear}, QNum: ${original.QNum}`);
        return null;
      }

      // Then find the specific quoteDetails by quoteHeaderId and revision
      const quote = await findReferencedRecord("quoteDetails", {
        quoteHeaderId: quoteHeader.id,
        revision: original.QRev?.toString() || "A",
      });

      if (!quote) {
        logger.warn(`No quoteDetails found for QYear: ${original.QYear}, QNum: ${original.QNum}, QRev: ${original.QRev || "A"}`);
        return null;
      }

      data._tempQuoteDetailsId = quote.id;

      data.quote = {
        connect: { id: quote.id },
      };
      data.createdAt = new Date(original.NoteDate);
      data.updatedAt = new Date(original.NoteDate);
      data.createdById = original.CoeRSM.toString() || "system";
      data.updatedById = original.CoeRSM.toString() || "system";
      return data;
    },
    skipDuplicates: true,
    duplicateCheck: data => ({
      AND: [
        { quoteDetailsId: data._tempQuoteDetailsId },
        { note: data.note },
      ],
    }),
    batchSize: 100,
  };

  const result = await migrateWithMapping(mapping);

  return result;
}

// Example: Create a custom migration with complex transformations
// export async function migrateCustomTable(): Promise<MigrationResult> {
//   const mapping: TableMapping = {
//     sourceDatabase: "std",
//     sourceTable: "OldCustomers",
//     targetTable: "customers",
//     fieldMappings: [
//       {
//         from: "CustID",
//         to: "id",
//         transform: value => Number.parseInt(value),
//       },
//       {
//         from: "CustName",
//         to: "name",
//         transform: value => value?.trim().toUpperCase(),
//         required: true,
//       },
//       {
//         from: "CustEmail",
//         to: "email",
//         transform: value => value?.toLowerCase().trim(),
//       },
//       {
//         from: "Active",
//         to: "isActive",
//         transform: value => value === "Y" || value === "1",
//         defaultValue: true,
//       },
//     ],
//     // Filter out inactive records during migration
//     filter: record => record.Active !== "N" && record.Active !== "0",
//     // Enrich data before saving
//     beforeSave: (data, original) => {
//       data.createdAt = new Date();
//       data.updatedAt = new Date();
//       data.legacyId = original.CustID;
//       return data;
//     },
//     // Post-processing after save
//     afterSave: async (saved, original) => {
//       // Log successful migrations to audit table
//       logger.info(`Migrated customer ${original.CustID} to ${saved.id}`);
//     },
//     skipDuplicates: true,
//     duplicateCheck: data => ({ email: data.email }),
//     batchSize: 100,
//   };

//   return await migrateWithMapping(mapping);
// }

async function main() {
  try {
    await legacyService.initialize();

    // const schema = await extractDatabaseSchema("std");
    // const coilResult = await migrateCoilTypes();
    // const optionResult = await migrateOptionCategories();
    // const modelResult = await migrateModels();
    // const companyResult = await migrateCompanies();
    const quoteHeaders = await migrateQuotes();
    const quotes = await migrateQuoteRevisions();
    const quoteNotes = await migrateQuoteNotes();

    logger.info("Migration Results:", {
      quoteHeaders,
      quotes,
      quoteNotes,
      // schema,
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
