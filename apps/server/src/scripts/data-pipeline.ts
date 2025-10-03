/* eslint-disable node/prefer-global/process */
import type { ItemType } from "@prisma/client";

import { PrismaClient, QuoteRevisionStatus, QuoteStatus } from "@prisma/client";
import bcrypt from "bcrypt";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { env } from "@/config/env";
import { LegacyService } from "@/services/business/legacy.service";
import { logger } from "@/utils/logger";

let legacyService = new LegacyService();

const mainDatabase = new PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
  log: ["warn", "error"],
  errorFormat: "pretty",
});

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
  batchSize?: number;
  legacyFetchSize?: number;
  concurrency?: number;
  skipDuplicates?: boolean;
  duplicateCheck?: (mappedData: any) => any;
  sort?: string | string[];
  order?: "ASC" | "DESC";
}

interface MigrationResult {
  total: number;
  created: number;
  skipped: number;
  errors: number;
  errorDetails: Array<{ record: any; error: any }>;
}

export async function closeDatabaseConnections() {
  await mainDatabase.$disconnect();
  await legacyService.close();
}

async function migrateWithMapping(mapping: TableMapping): Promise<MigrationResult> {
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
      sort: mapping.sort || null,
      order: mapping.order || null,
      offset: 0,
    };

    const totalCount = await legacyService.getCount(mapping.sourceDatabase, mapping.sourceTable, params);
    const legacyFetchSize = mapping.legacyFetchSize || 5000;
    const expectedBatches = Math.ceil(totalCount / legacyFetchSize);

    logger.info(`Found ${totalCount} records, expecting ${expectedBatches} batches of ${legacyFetchSize}`);

    let totalProcessed = 0;
    let currentBatch = 0;

    while (totalProcessed < totalCount) {
      const paginatedResult = await legacyService.getAllPaginated(
        mapping.sourceDatabase,
        mapping.sourceTable,
        { ...params, totalCount },
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

      const createBatchSize = 1000;
      const recordBatches = [];

      for (let i = 0; i < sourceRecords.length; i += createBatchSize) {
        recordBatches.push(sourceRecords.slice(i, i + createBatchSize));
      }

      for (let i = 0; i < recordBatches.length; i++) {
        await processSingleBatch(recordBatches[i], mapping, result, i);
      }

      params.offset = paginatedResult.nextOffset;

      if (!paginatedResult.hasMore || paginatedResult.records.length < legacyFetchSize) {
        logger.info(`No more records to process. Breaking pagination loop.`);
        break;
      }

      logger.info(`Batch ${currentBatch}/${expectedBatches} complete. Total processed: ${totalProcessed}/${totalCount}, Created: ${result.created}, Skipped: ${result.skipped}, Errors: ${result.errors}`);
    }

    result.total = totalProcessed;
    logger.info(
      `Migration complete: ${result.created} created, ${result.skipped} skipped, ${result.errors} errors from ${result.total} total records`,
    );
  }
  catch (error: any) {
    logger.error(`Fatal error during migration ${mapping.sourceTable}:`, error.message);
    throw error;
  }

  return result;
}

async function processSingleBatch(
  batchRecords: any[],
  mapping: TableMapping,
  result: MigrationResult,
  batchIndex: number,
): Promise<void> {
  const recordsToCreate: any = [];

  for (const record of batchRecords) {
    try {
      if (mapping.filter && !mapping.filter(record)) {
        result.skipped++;
        continue;
      }

      const mappedData: any = {};
      let skipRecord = false;

      for (const fieldMap of mapping.fieldMappings) {
        const sourceValue = record[fieldMap.from];

        if (fieldMap.required && (sourceValue === null || sourceValue === undefined)) {
          logger.warn(`Required field ${fieldMap.from} is missing in record`);
          skipRecord = true;
          break;
        }

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

      const dataToSave = mapping.beforeSave
        ? await mapping.beforeSave(mappedData, record)
        : mappedData;

      if (dataToSave === null) {
        result.skipped++;
        continue;
      }

      const cleanedData = Object.fromEntries(
        Object.entries(dataToSave).filter(([key]) => !key.startsWith("_temp")),
      );

      recordsToCreate.push(cleanedData);
    }
    catch (error: any) {
      logger.error(`Error processing record in batch ${batchIndex}:`, error.message);
      result.errors++;
      result.errorDetails.push({ record: { id: record.id }, error: error.message });
    }
  }

  if (recordsToCreate.length > 0) {
    const maxRetries = 3;
    let attempt = 0;
    let success = false;

    while (attempt < maxRetries && !success) {
      try {
        if (attempt > 0) {
          const delay = Math.random() * 1000 + (attempt * 500); // 500-1500ms increasing delay
          await new Promise(resolve => setTimeout(resolve, delay));
          logger.debug(`Retrying batch ${batchIndex}, attempt ${attempt + 1}/${maxRetries} after ${delay.toFixed(0)}ms delay`);
        }

        await mainDatabase.$transaction(async (tx) => {
          const createResult = await (tx as any)[mapping.targetTable].createMany({
            data: recordsToCreate,
            skipDuplicates: mapping.skipDuplicates || false,
          });
          result.created += createResult.count;

          const expectedTotal = recordsToCreate.length;
          const actualCreated = createResult.count;
          result.skipped += (expectedTotal - actualCreated);
        }, {
          maxWait: 5000,
          timeout: 20000,
        });

        success = true;
        logger.debug(`Bulk processed ${recordsToCreate.length} records in batch ${batchIndex}`);
      }
      catch (bulkError) {
        attempt++;
        const errorMessage = (bulkError as any).message || bulkError;

        const isDeadlock = errorMessage.includes("deadlock") || errorMessage.includes("40P01");

        if (isDeadlock && attempt < maxRetries) {
          logger.warn(`Deadlock detected in batch ${batchIndex}, retrying (${attempt}/${maxRetries})`);
          continue;
        }
        else {
          logger.error(`Bulk insert failed in batch ${batchIndex} after ${attempt} attempts:`, errorMessage);
          result.errors += recordsToCreate.length;
          break;
        }
      }
    }
  }
}

async function cleanOrderGaps(
  tableName: string,
  orderField: string,
  whereCondition?: any,
): Promise<void> {
  try {
    logger.info(`Cleaning order gaps in ${tableName}.${orderField}...`);

    const records = await (mainDatabase as any)[tableName].findMany({
      where: whereCondition || {},
      orderBy: { [orderField]: "asc" },
    });

    if (!records || records.length === 0) {
      logger.warn(`No records found in ${tableName}`);
      return;
    }

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

async function _extractDatabaseSchema(database: "quote" | "std" | "job"): Promise<void> {
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

function trimWhitespace(input: string): string {
  return input.trim();
}

function replaceInternalWhitespace(input: string): string {
  return input.replace(/\s+/g, "-");
}

function createDateFromSeconds(baseDate: Date | string, secondsSinceMidnight: number): string {
  const date = new Date(baseDate);
  date.setHours(0, 0, 0, 0);
  date.setSeconds(secondsSinceMidnight);
  return date.toISOString();
}

async function findReferencedRecord(
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

async function _findEmployeeByNumberOrInitials(identifier: string): Promise<any> {
  try {
    let employee = await mainDatabase.employee.findFirst({
      where: { number: identifier },
    });

    if (!employee) {
      employee = await mainDatabase.employee.findFirst({
        where: { initials: identifier.toUpperCase() },
      });
    }

    return employee;
  }
  catch (error) {
    logger.error(`Error finding employee by identifier ${identifier}:`, error);
    return null;
  }
}

function _formatModelNumbers(modelNumbers: string[]): string[] {
  const groups = new Map<string, string[]>();

  modelNumbers.forEach((model) => {
    const match = model.match(/^([A-Z]+-\d+(?:-\d+)*)/);
    if (match) {
      const basePattern = match[1];
      if (!groups.has(basePattern)) {
        groups.set(basePattern, []);
      }
      groups.get(basePattern)!.push(model);
    }
  });

  const result: string[] = [];

  groups.forEach((models) => {
    if (models.length < 2) {
      result.push(...models);
      return;
    }

    const commonPrefix = findLongestCommonPrefix(models);

    models.forEach((model) => {
      if (model.length > commonPrefix.length) {
        const suffix = model.substring(commonPrefix.length);
        const formatted = suffix.startsWith("-") ? `${commonPrefix}${suffix}` : `${commonPrefix}-${suffix}`;
        result.push(formatted);
      }
      else {
        result.push(model);
      }
    });
  });

  return result;
}

function findLongestCommonPrefix(strings: string[]): string {
  if (strings.length === 0)
    return "";

  let prefix = strings[0];

  for (let i = 1; i < strings.length; i++) {
    while (!strings[i].startsWith(prefix)) {
      prefix = prefix.substring(0, prefix.length - 1);
      if (prefix === "")
        return "";
    }
  }

  return prefix;
}

// Migrations
async function _migrateCoilTypes(): Promise<MigrationResult> {
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

  if (result.created > 0) {
    await cleanOrderGaps("coilType", "sortOrder");
  }

  return result;
}

async function _migrateProductClasses(): Promise<MigrationResult> {
  const parentMapping: TableMapping = {
    sourceDatabase: "quote",
    sourceTable: "EquGroupInfo",
    targetTable: "productClass",
    fieldMappings: [
      {
        from: "GroupDesc",
        to: "name",
        transform: value => value?.toString().trim(),
        required: true,
      },
    ],
    beforeSave: async (data, original) => {
      const equFamily = original.EquFamily?.toString().trim() || "";
      const equGroup = original.EquGroup?.toString().trim() || "";

      if (equFamily !== "") {
        return null;
      }

      const code = equGroup || original.GroupDesc?.toString().replace(/\s+/g, "-").toUpperCase();
      logger.info(`PARENT: Group="${equGroup}" -> Code="${code}"`);

      data.code = code;
      data.description = original.Desc1 || original.GroupDesc || "";
      data.depth = 0;
      data.parentId = null;
      return data;
    },
    skipDuplicates: true,
    duplicateCheck: data => ({
      code: data.code,
      parentId: null,
    }),
    batchSize: 100,
  };

  logger.info("Migrating parent product classes...");
  const parentResult = await migrateWithMapping(parentMapping);

  const childMapping: TableMapping = {
    sourceDatabase: "quote",
    sourceTable: "EquGroupInfo",
    targetTable: "productClass",
    fieldMappings: [
      {
        from: "GroupDesc",
        to: "name",
        transform: value => value?.toString().trim(),
        required: true,
      },
    ],
    beforeSave: async (data, original) => {
      const equFamily = original.EquFamily?.toString().trim() || "";

      if (equFamily === "") {
        return null; // Skip - no EquFamily
      }

      // Skip n/a records
      if (equFamily.toLowerCase() === "n/a") {
        return null;
      }

      const cleanFamily = replaceInternalWhitespace(equFamily);
      const segments = cleanFamily.split("-");
      const parentCode = segments[0];
      const childCode = segments[1] || segments[0];

      let parent = await findReferencedRecord("productClass", {
        code: parentCode,
        parentId: null,
      });

      // Create missing parent if not found
      if (!parent) {
        logger.warn(`Creating missing parent: Code="${parentCode}"`);

        try {
          parent = await mainDatabase.productClass.create({
            data: {
              code: parentCode,
              name: parentCode, // Use code as name
              description: "", // No description
              depth: 0,
              parentId: null,
            },
          });
        }
        catch (error) {
          logger.error(`Failed to create parent ${parentCode}: ${error}`);
          return null;
        }
      }

      // Combine parent and child codes to create the full code path
      const fullCode = `${parentCode}-${childCode}`;

      data.code = fullCode;
      data.parentId = parent.id;
      data.depth = 1;
      data.description = original.Desc2 || "";
      return data;
    },
    skipDuplicates: true,
    duplicateCheck: data => ({
      code: data.code,
      parentId: data.parentId,
    }),
    batchSize: 100,
  };

  logger.info("Migrating child product classes...");
  const childResult = await migrateWithMapping(childMapping);

  const result: MigrationResult = {
    total: parentResult.total + childResult.total,
    created: parentResult.created + childResult.created,
    skipped: parentResult.skipped + childResult.skipped,
    errors: parentResult.errors + childResult.errors,
    errorDetails: [...parentResult.errorDetails, ...childResult.errorDetails],
  };

  return result;
}

async function _migrateOptionCategories(): Promise<MigrationResult> {
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
        to: "displayOrder",
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

  if (result.created > 0) {
    await cleanOrderGaps("optionCategory", "displayOrder");
  }

  return result;
}

async function _migrateOptionHeaders(): Promise<MigrationResult> {
  let archivedCategory = await findReferencedRecord("optionCategory", {
    name: "Archived",
  });

  if (!archivedCategory) {
    logger.info("Creating 'Archived' option category for unmapped options");
    archivedCategory = await mainDatabase.optionCategory.create({
      data: {
        name: "Archived",
        description: "Options without category mapping from legacy system",
        multiple: false,
        mandatory: false,
        displayOrder: 9999,
      },
    });
  }

  const mapping: TableMapping = {
    sourceDatabase: "std",
    sourceTable: "StdOptDesc",
    targetTable: "optionHeader",
    fieldMappings: [
      {
        from: "DescID",
        to: "legacyId",
        transform: value => value?.toString(),
      },
      {
        from: "Description",
        to: "description",
        transform: value => value?.trim(),
      },
    ],
    beforeSave: async (data, original) => {
      let optionCategoryId = null;

      // Use OptionGrpID from StdOptDesc to find the category
      const optionGrpId = original.OptionGrpID?.toString();

      if (!optionGrpId) {
        logger.warn(`No OptionGrpID found for StdOptDesc.DescID: ${original.DescID}, using Archived category`);
        optionCategoryId = archivedCategory.id;
      }
      else {
        // Find category by the OptionGrpID (which should match OptionOrder.OrderID based on your notes)
        const optionCategory = await findReferencedRecord("optionCategory", {
          legacyId: optionGrpId,
        });

        if (!optionCategory) {
          logger.warn(`No optionCategory found for OptionGrpID: ${optionGrpId}, using Archived category`);
          optionCategoryId = archivedCategory.id;
        }
        else {
          optionCategoryId = optionCategory.id;
        }
      }

      data.name = "Temporary Option Name";
      data.optionCategoryId = optionCategoryId;
      data.createdAt = new Date(original.CreateDate || original.ModifyDate || new Date());
      data.updatedAt = new Date(original.ModifyDate || original.CreateDate || new Date());
      data.createdById = original.CreateInit?.toLowerCase() || "system";
      data.updatedById = original.ModifyInit?.toLowerCase() || "system";

      return data;
    },
    skipDuplicates: true,
    duplicateCheck: data => ({
      legacyId: data.legacyId,
    }),
    batchSize: 100,
  };

  const result = await migrateWithMapping(mapping);

  return result;
}

async function _migrateOptionDetails(): Promise<MigrationResult> {
  const mapping: TableMapping = {
    sourceDatabase: "quote",
    sourceTable: "EquipOpt",
    targetTable: "optionDetails",
    fieldMappings: [
      {
        from: "Price",
        to: "price",
        transform: value => value ? Number.parseFloat(value) : 0,
      },
    ],
    beforeSave: async (data, original) => {
      const modelNumber = replaceInternalWhitespace(trimWhitespace(original.Model));

      const optionHeader = await findReferencedRecord("optionHeader", {
        legacyId: original.ID?.toString(),
      });

      if (!optionHeader) {
        logger.warn(`No optionHeader found for EquipOpt.ID: ${original.ID}`);
        return null;
      }

      data.optionHeaderId = optionHeader.id;

      const item = await findReferencedRecord("item", {
        modelNumber,
      });

      if (item) {
        data.itemId = item.id;
        data.productClassId = null;
        logger.debug(`Found item for model: ${modelNumber}`);
      }
      else {
        let productClass = await findReferencedRecord("productClass", {
          code: modelNumber,
        });

        if (!productClass) {
          productClass = await findReferencedRecord("productClass", {
            code: modelNumber,
            parentId: null,
          });
        }

        if (productClass) {
          data.productClassId = productClass.id;
          data.itemId = null;
          logger.debug(`Found product class for model: ${modelNumber}`);
        }
        else {
          logger.warn(`No item or product class found for model: ${modelNumber} in EquipOpt.ID: ${original.ID}`);
          return null;
        }
      }

      data.createdAt = new Date(original.CreateDate || original.ModifyDate || new Date());
      data.updatedAt = new Date(original.ModifyDate || original.CreateDate || new Date());
      data.createdById = original.CreateInit?.toLowerCase() || "system";
      data.updatedById = original.ModifyInit?.toLowerCase() || "system";

      return data;
    },
    filter: (record) => {
      // Only process records that have both an ID and Model
      return record.ID && record.Model;
    },
    skipDuplicates: true,
    duplicateCheck: (data) => {
      // Create unique check based on which type of relation exists
      if (data.itemId) {
        return {
          optionHeaderId: data.optionHeaderId,
          itemId: data.itemId,
          productClassId: null,
        };
      }
      else {
        return {
          optionHeaderId: data.optionHeaderId,
          productClassId: data.productClassId,
          itemId: null,
        };
      }
    },
    batchSize: 100,
  };

  const result = await migrateWithMapping(mapping);

  return result;
}

async function _migrateEquipListToItems(): Promise<MigrationResult> {
  const mapping: TableMapping = {
    sourceDatabase: "quote",
    sourceTable: "EquipList",
    targetTable: "item",
    sort: "Model",
    order: "ASC",
    fieldMappings: [
      {
        from: "Model",
        to: "modelNumber",
        transform: value => trimWhitespace(value),
      },
      {
        from: "Description",
        to: "description",
      },
    ],
    beforeSave: (data, original) => {
      data.specifications = {
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
      };
      data.leadTime = 112;
      data.type = "Equipment" as ItemType;
      data.createdAt = new Date(original.CreateDate || original.ModifyDate);
      data.updatedAt = new Date(original.ModifyDate || original.CreateDate);
      data.createdById = original.CreateInit?.toLowerCase() || "system";
      data.updatedById = original.ModifyInit?.toLowerCase() || "system";
      return data;
    },
    skipDuplicates: true,
    duplicateCheck: data => ({
      modelNumber: data.modelNumber, // Fixed: was "model", should be "modelNumber"
    }),
    batchSize: 100,
  };

  const result = await migrateWithMapping(mapping);

  return result;
}

async function _migrateQuotes(): Promise<MigrationResult> {
  const mapping: TableMapping = {
    sourceDatabase: "quote",
    sourceTable: "QData",
    targetTable: "quote",
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
      const closed = original.Canceled === "1" || original.LostToComp === "1" || original.Shipped === "1";

      if (closed) {
        data.status = QuoteStatus.CLOSED;
      }

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

async function updateQuoteRevisionStatuses(): Promise<void> {
  try {
    logger.info("Updating quote revision statuses...");

    const quotes = await mainDatabase.quote.findMany({
      select: { id: true },
    });

    let updateCount = 0;

    for (const quote of quotes) {
      const revisions = await mainDatabase.quoteRevision.findMany({
        where: { quoteId: quote.id },
        orderBy: { revision: "desc" },
      });

      if (revisions.length <= 1)
        continue;

      for (let i = 1; i < revisions.length; i++) {
        await mainDatabase.quoteRevision.update({
          where: { id: revisions[i].id },
          data: { status: QuoteRevisionStatus.REVISED },
        });
        updateCount++;
      }
    }

    logger.info(`Updated ${updateCount} quote revisions to REVISED status`);
  }
  catch (error) {
    logger.error("Error updating quote revision statuses:", error);
    throw error;
  }
}

async function _migrateQuoteRevisions(): Promise<MigrationResult> {
  const mapping: TableMapping = {
    sourceDatabase: "quote",
    sourceTable: "QRev",
    targetTable: "quoteRevision",
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
      const quote = await findReferencedRecord("quote", {
        year: original.QYear?.toString(),
        number: original.QNum?.toString(),
      });

      if (!quote) {
        logger.warn(`No quote found for QYear: ${original.QYear}, QNum: ${original.QNum}`);
        return null;
      }

      data._tempQuoteId = quote.id;

      data.quoteId = quote.id;
      data.status = QuoteRevisionStatus.DRAFT; // Default all to DRAFT initially
      data.createdAt = new Date(original.CreateDate || original.ModifyDate || new Date());
      data.updatedAt = new Date(original.ModifyDate || original.CreateDate || new Date());
      data.createdById = original.CreateInit?.toLowerCase() || "system";
      data.updatedById = original.ModifyInit?.toLowerCase() || "system";

      return data;
    },
    filter: (record) => {
      return record.QYear && record.QNum && record.QRev;
    },
    skipDuplicates: true,
    duplicateCheck: data => ({
      AND: [
        { quoteId: data._tempQuoteId },
        { revision: data.revision },
      ],
    }),
    batchSize: 100,
  };

  const result = await migrateWithMapping(mapping);

  await updateQuoteRevisionStatuses();

  return result;
}

async function _migrateQuoteItems(): Promise<MigrationResult> {
  const mapping: TableMapping = {
    sourceDatabase: "quote",
    sourceTable: "QRev",
    targetTable: "quoteItem",
    fieldMappings: [
      {
        from: "Model",
        to: "model",
        transform: value => value?.toString().trim(),
        required: true,
      },
      {
        from: "BasePrice",
        to: "unitPrice",
        transform: value => Number.parseFloat(value) || 0,
        required: true,
      },
      {
        from: "Sfx",
        to: "lineNumber",
        transform: value => Number.parseInt(value) || 1,
        required: true,
      },
    ],
    beforeSave: async (data, original) => {
      const quote = await findReferencedRecord("quote", {
        year: original.QYear?.toString(),
        number: original.QNum?.toString(),
      });

      if (!quote) {
        logger.warn(`No quote found for QYear: ${original.QYear}, QNum: ${original.QNum}`);
        return null;
      }

      const quoteRevision = await findReferencedRecord("quoteRevision", {
        quoteId: quote.id,
        revision: original.QRev?.toString().trim(),
      });

      if (!quoteRevision) {
        logger.warn(`No quoteRevision found for quote ${quote.id}, revision: ${original.QRev}`);
        return null;
      }

      data._tempQuoteRevisionId = quoteRevision.id;
      data._tempLineNumber = data.lineNumber;

      data.quoteRevisionId = quoteRevision.id;
      data.createdAt = new Date(original.CreateDate || original.ModifyDate || new Date());
      data.updatedAt = new Date(original.ModifyDate || original.CreateDate || new Date());
      data.createdById = original.CreateInit?.toLowerCase() || "system";
      data.updatedById = original.ModifyInit?.toLowerCase() || "system";

      // TODO: Add logic to map itemId

      return data;
    },
    filter: (record) => {
      return record.QYear && record.QNum && record.QRev && record.Sfx && record.Model?.toString().trim();
    },
    skipDuplicates: true,
    duplicateCheck: data => ({
      AND: [
        { quoteRevisionId: data._tempQuoteRevisionId },
        { lineNumber: data._tempLineNumber },
      ],
    }),
    batchSize: 100,
  };

  const result = await migrateWithMapping(mapping);
  return result;
}

async function _migrateCustomQuoteItems(): Promise<MigrationResult> {
  const mapping: TableMapping = {
    sourceDatabase: "quote",
    sourceTable: "OtherEqu",
    targetTable: "quoteItem",
    fieldMappings: [

      {
        from: "EqName",
        to: "name",
        transform: value => value?.toString().trim(),
      },
      {
        from: "EqDesc",
        to: "description",
        transform: value => value?.toString().trim(),
      },
      {
        from: "Model",
        to: "model",
        transform: value => value?.toString().trim(),
        required: true,
      },
      {
        from: "EqPrice",
        to: "unitPrice",
        transform: value => Number.parseFloat(value) || 0,
      },
      {
        from: "Sfx",
        to: "lineNumber",
        transform: value => Number.parseInt(value),
        required: true,
      },
    ],
    beforeSave: async (data, original) => {
      const quote = await findReferencedRecord("quote", {
        year: original.QYear?.toString(),
        number: original.QNum?.toString(),
      });

      if (!quote) {
        logger.warn(`No quote found for QYear: ${original.QYear}, QNum: ${original.QNum}`);
        return null;
      }

      const quoteRevision = await findReferencedRecord("quoteRevision", {
        quoteId: quote.id,
        revision: original.QRev?.toString().trim(),
      });

      if (!quoteRevision) {
        logger.warn(`No quoteRevision found for quote ${quote.id}, revision: ${original.QRev}`);
        return null;
      }

      data._tempQuoteRevisionId = quoteRevision.id;
      data._tempLineNumber = data.lineNumber;

      data.quoteRevisionId = quoteRevision.id;
      data.isCustom = true;
      data.createdAt = new Date(original.CreateDate || original.ModifyDate || new Date());
      data.updatedAt = new Date(original.ModifyDate || original.CreateDate || new Date());
      data.createdById = original.CreateInit?.toLowerCase() || "system";
      data.updatedById = original.ModifyInit?.toLowerCase() || "system";

      // TODO: Add logic to map itemId

      return data;
    },
    filter: (record) => {
      return record.QYear && record.QNum && record.QRev && record.Sfx;
    },
    skipDuplicates: true,
    duplicateCheck: data => ({
      AND: [
        { quoteRevisionId: data._tempQuoteRevisionId },
        { lineNumber: data._tempLineNumber },
      ],
    }),
    batchSize: 100,
  };

  const result = await migrateWithMapping(mapping);
  return result;
}

async function _migrateQuoteTerms(): Promise<MigrationResult> {
  const mapping: TableMapping = {
    sourceDatabase: "quote",
    sourceTable: "QtTerms",
    targetTable: "quoteTerms",
    fieldMappings: [
      {
        from: "Percent",
        to: "percentage",
        transform: value => value ? Number.parseInt(value) : null,
      },
      {
        from: "NetDays",
        to: "netDays",
        transform: value => Number.parseInt(value) || 0,
      },
      {
        from: "Amount",
        to: "amount",
        transform: value => value ? Number.parseFloat(value) : null,
      },
      {
        from: "Verbage",
        to: "verbiage",
        transform: value => value?.trim() || null,
      },
      {
        from: "DueOrder",
        to: "dueOrder",
        transform: value => value ? Number.parseInt(value) : null,
      },
      {
        from: "CustomTerms",
        to: "customTerms",
        transform: value => value?.trim() || null,
      },
      {
        from: "NotToExceed",
        to: "notToExceed",
        transform: value => value ? Number.parseFloat(value) : null,
      },
    ],
    beforeSave: async (data, original) => {
      const quote = await findReferencedRecord("quote", {
        year: original.QYear?.toString(),
        number: original.QNum?.toString(),
      });

      if (!quote) {
        logger.warn(`No quote found for QYear: ${original.QYear}, QNum: ${original.QNum}`);
        return null;
      }

      const quoteRevision = await findReferencedRecord("quoteRevision", {
        quoteId: quote.id,
        revision: original.QRev?.toString().toUpperCase() || "A",
      });

      if (!quoteRevision) {
        logger.warn(`No quoteRevision found for QYear: ${original.QYear}, QNum: ${original.QNum}, QRev: ${original.QRev || "A"}`);
        return null;
      }

      data._tempQuoteRevisionId = quoteRevision.id;

      data.quoteRevisionId = quoteRevision.id;
      data.createdAt = new Date();
      data.updatedAt = new Date();

      return data;
    },
    skipDuplicates: true,
    duplicateCheck: data => ({
      AND: [
        { quoteRevisionId: data._tempQuoteRevisionId },
        { netDays: data.netDays },
        { dueOrder: data.dueOrder },
      ],
    }),
    batchSize: 100,
  };

  const result = await migrateWithMapping(mapping);

  return result;
}

async function _migrateQuoteNotes(): Promise<MigrationResult> {
  const mapping: TableMapping = {
    sourceDatabase: "quote",
    sourceTable: "notes",
    targetTable: "quoteNote",
    fieldMappings: [
      {
        from: "NoteBody",
        to: "body",
        transform: value => value?.toString().trim(),
        required: true,
      },
    ],
    beforeSave: async (data, original) => {
      const noteIndex = original.NoteIndex?.toString().trim();
      if (!noteIndex) {
        logger.warn("Missing NoteIndex");
        return null;
      }

      const parts = noteIndex.split("-");
      if (parts.length < 2) {
        logger.warn(`Invalid NoteIndex format: ${noteIndex}`);
        return null;
      }

      let year = parts[0];
      let number = parts[1];
      const revision = parts[2] || "A";

      number = Number.parseInt(number).toString();

      if (year === "0000") {
        year = "2000";
      }
      else if (year.startsWith("00") && year.length === 4) {
        const yearNum = Number.parseInt(year);
        year = yearNum < 50 ? `20${year.slice(2)}` : `19${year.slice(2)}`;
      }

      const quote = await findReferencedRecord("quote", {
        year,
        number,
      });

      if (!quote) {
        logger.warn(`No quote found for year: ${year}, number: ${number}`);
        return null;
      }

      const quoteRevision = await findReferencedRecord("quoteRevision", {
        quoteId: quote.id,
        revision,
      });

      if (!quoteRevision) {
        logger.warn(`No quoteRevision found for quote ${quote.id}, revision: ${revision}`);
        return null;
      }

      const timestamp = createDateFromSeconds(original.NoteDate, original.NoteTime);

      data._tempQuoteRevisionId = quoteRevision.id;

      data.quoteRevisionId = quoteRevision.id;
      data.createdAt = timestamp || new Date();
      data.updatedAt = timestamp || new Date();
      data.createdById = original.NoteCreater?.toString() || "system";
      data.updatedById = original.NoteCreater?.toString() || "system";

      return data;
    },
    filter: (record) => {
      const excludedSubjects = [
        "New Quotation Created",
        "Quotation Previewed",
        "Quotation Printed",
        "Quotation Exported to Word",
      ];

      return record.NoteType === "Quote"
        && record.NoteIndex
        && !excludedSubjects.some(excluded => record.NoteSubject?.includes(excluded))
        && !record.NoteBody?.includes("Original Values");
    },
    skipDuplicates: true,
    duplicateCheck: data => ({
      AND: [
        { quoteRevisionId: data._tempQuoteRevisionId },
        { body: data.body },
        { createdAt: data.createdAt },
      ],
    }),
    batchSize: 50,
  };

  const result = await migrateWithMapping(mapping);
  return result;
}

export async function _migrateDepartments(legacyServiceInstance?: LegacyService): Promise<MigrationResult> {
  const originalService = legacyService;

  if (legacyServiceInstance) {
    legacyService = legacyServiceInstance;
  }
  else {
    await legacyService.initialize();
  }

  const mapping: TableMapping = {
    sourceDatabase: "std",
    sourceTable: "Employee",
    targetTable: "department",
    fieldMappings: [
      {
        from: "DeptCode",
        to: "code",
        transform: value => value?.toString().trim(),
        required: true,
      },
    ],
    beforeSave: async (data, original) => {
      const code = original.DeptCode?.toString().trim();

      if (!code || code === "") {
        return null;
      }

      const existingDept = await findReferencedRecord("department", { code });
      if (existingDept) {
        return null;
      }

      data.name = code;
      data.description = code;
      data.createdById = "system";
      data.updatedById = "system";
      return data;
    },
    skipDuplicates: true,
    duplicateCheck: data => ({
      code: data.code,
    }),
    batchSize: 100,
  };

  const result = await migrateWithMapping(mapping);

  legacyService = originalService;

  return result;
}

// used elsewhere
export async function _migrateEmployees(legacyServiceInstance?: LegacyService): Promise<MigrationResult> {
  const originalService = legacyService;

  if (legacyServiceInstance) {
    legacyService = legacyServiceInstance;
  }
  else {
    await legacyService.initialize();
  }
  const hash = await bcrypt.hash("Password123!", 10);

  const userMapping: TableMapping = {
    sourceDatabase: "std",
    sourceTable: "Employee",
    targetTable: "user",
    fieldMappings: [],
    beforeSave: async (data, original) => {
      if (!original.EmpInitials || original.EmpInitials.trim() === "") {
        return null;
      }

      const username = original.EmpInitials.toLowerCase();

      const existingUser = await findReferencedRecord("user", { username });
      if (existingUser) {
        logger.info(`User exists: ${username}`);
        return null;
      }

      data.username = username;
      data.password = hash;
      data.microsoftId = null;
      data.role = "USER";
      data.isActive = true;
      return data;
    },
    skipDuplicates: true,
    batchSize: 100,
  };

  logger.info("Creating users for employees...");
  const userResult = await migrateWithMapping(userMapping);

  const employeeMapping: TableMapping = {
    sourceDatabase: "std",
    sourceTable: "Employee",
    targetTable: "employee",
    fieldMappings: [
      {
        from: "EmpNum",
        to: "number",
        transform: value => value?.toString().trim(),
        required: true,
      },
      {
        from: "EmpFirstName",
        to: "firstName",
        transform: value => value?.trim(),
        required: true,
      },
      {
        from: "EmpLastName",
        to: "lastName",
        transform: value => value?.trim(),
        required: true,
      },
      {
        from: "EmpInitials",
        to: "initials",
        transform: value => value?.trim(),
        required: true,
      },
      {
        from: "Emptitle",
        to: "title",
        transform: value => value?.trim(),
        required: true,
      },
      {
        from: "HireDate",
        to: "hireDate",
        transform: value => value ? new Date(value) : null,
      },
      {
        from: "StartDate",
        to: "startDate",
        transform: value => value ? new Date(value) : null,
      },
      {
        from: "TermDate",
        to: "terminationDate",
        transform: value => value ? new Date(value) : null,
      },
      {
        from: "Salaried",
        to: "isSalaried",
        transform: value => value === true || value === "true" || value === 1 || value === "1",
      },
    ],
    beforeSave: async (data, original) => {
      if (!original.EmpInitials || original.EmpInitials.trim() === "") {
        return null;
      }

      const username = original.EmpInitials.toLowerCase();

      const user = await findReferencedRecord("user", { username });
      if (!user) {
        logger.error(`No user found for employee: ${username}`);
        return null;
      }

      data.userId = user.id;
      data.email = `${original.EmpInitials}@cpec.com`;

      const deptCode = original.DeptCode?.toString().trim();
      if (deptCode && deptCode !== "") {
        const department = await findReferencedRecord("department", { code: deptCode });
        if (department) {
          data.departmentId = department.id;
        }
        else {
          logger.warn(`No department found for code: ${deptCode}`);
        }
      }

      data.createdAt = new Date(original.CreateDate || original.ModifyDate || new Date());
      data.updatedAt = new Date(original.ModifyDate || original.CreateDate || new Date());
      data.createdById = original.CreateInit?.toLowerCase() || "system";
      data.updatedById = original.ModifyInit?.toLowerCase() || "system";
      return data;
    },
    skipDuplicates: true,
    duplicateCheck: data => ({
      number: data.number,
    }),
    batchSize: 100,
  };

  logger.info("Creating employees...");
  const employeeResult = await migrateWithMapping(employeeMapping);

  logger.info("Updating employee references...");
  const allEmployees = await mainDatabase.employee.findMany({
    select: { id: true, createdById: true, updatedById: true, initials: true },
  });

  const initialsMap = new Map<string, string>();
  for (const emp of allEmployees) {
    if (emp.initials) {
      initialsMap.set(emp.initials.toLowerCase(), emp.id);
    }
  }

  let updatedCount = 0;
  for (const employee of allEmployees) {
    const updates: any = {};

    if (employee.createdById && employee.createdById !== "system") {
      const createdByEmployeeId = initialsMap.get(employee.createdById);
      if (createdByEmployeeId) {
        updates.createdById = createdByEmployeeId;
      }
    }

    if (employee.updatedById && employee.updatedById !== "system") {
      const updatedByEmployeeId = initialsMap.get(employee.updatedById);
      if (updatedByEmployeeId) {
        updates.updatedById = updatedByEmployeeId;
      }
    }

    if (Object.keys(updates).length > 0) {
      await mainDatabase.employee.update({
        where: { id: employee.id },
        data: updates,
      });
      updatedCount++;
    }
  }

  logger.info(`Updated ${updatedCount} employee references`);

  const result: MigrationResult = {
    total: userResult.total + employeeResult.total,
    created: userResult.created + employeeResult.created,
    skipped: userResult.skipped + employeeResult.skipped,
    errors: userResult.errors + employeeResult.errors,
    errorDetails: [...userResult.errorDetails, ...employeeResult.errorDetails],
  };

  // Restore original service
  legacyService = originalService;

  return result;
}

export async function _migrateEmployeeManagers(legacyServiceInstance?: LegacyService): Promise<MigrationResult> {
  const originalService = legacyService;

  if (legacyServiceInstance) {
    legacyService = legacyServiceInstance;
  }
  else {
    await legacyService.initialize();
  }

  const _migrateEmployeeManagersInternal = async (): Promise<MigrationResult> => {
    const mapping: TableMapping = {
      sourceDatabase: "std",
      sourceTable: "EmpMgr",
      targetTable: "employee",
      fieldMappings: [],
      beforeSave: async (data, original) => {
        const empNum = original.EmpNum?.toString().trim();
        const mgrNum = original.MgrNum?.toString().trim();

        if (!empNum || !mgrNum) {
          return null;
        }

        const employee = await findReferencedRecord("employee", { number: empNum });
        const manager = await findReferencedRecord("employee", { number: mgrNum });

        if (!employee) {
          logger.warn(`Employee not found for number: ${empNum}`);
          return null;
        }

        if (!manager) {
          logger.warn(`Manager not found for number: ${mgrNum}`);
          return null;
        }

        return {
          id: employee.id,
          managerId: manager.id,
        };
      },
      batchSize: 100,
    };

    const result: MigrationResult = {
      total: 0,
      created: 0,
      skipped: 0,
      errors: 0,
      errorDetails: [],
    };

    try {
      logger.info("Starting employee manager relationship migration...");

      const params = {
        filter: null,
        sort: null,
        order: null,
        offset: 0,
        page: 1,
        limit: 10000,
      };

      const totalCount = await legacyService.getCount("std", "EmpMgr", params);
      logger.info(`Found ${totalCount} manager relationships`);

      const response = await legacyService.getAll("std", "EmpMgr", params);

      if (!response || !response.data || response.data.length === 0) {
        logger.warn("No manager relationships found");
        return result;
      }

      const records = response.data;
      result.total = records.length;

      for (const record of records) {
        try {
          const mappedData = await mapping.beforeSave?.({}, record);

          if (!mappedData) {
            result.skipped++;
            continue;
          }

          await mainDatabase.employee.update({
            where: { id: mappedData.id },
            data: { managerId: mappedData.managerId },
          });

          result.created++;
        }
        catch (error: any) {
          logger.error(`Error updating manager for employee ${record.EmpNum}:`, error.message);
          result.errors++;
          result.errorDetails.push({ record: { EmpNum: record.EmpNum }, error: error.message });
        }
      }

      logger.info(`Manager migration complete: ${result.created} updated, ${result.skipped} skipped, ${result.errors} errors`);
    }
    catch (error: any) {
      logger.error("Fatal error during manager migration:", error.message);
      throw error;
    }

    return result;
  };

  const result = await _migrateEmployeeManagersInternal();

  legacyService = originalService;

  return result;
}

async function main() {
  const startTime = Date.now();
  try {
    logger.info("Starting data pipeline migration...");
    await legacyService.initialize();
    // const coilTypes = await _migrateCoilTypes();
    // const productClasses = await _migrateProductClasses();
    // const equipmentItems = await _migrateEquipListToItems();
    // const optionCategories = await _migrateOptionCategories();
    // const optionHeaders = await _migrateOptionHeaders();
    // const optionDetails = await _migrateOptionDetails();
    const quoteHeaders = await _migrateQuotes();
    const quotes = await _migrateQuoteRevisions();
    // const quoteItems = await _migrateQuoteItems();
    // const customQuoteItems = await _migrateCustomQuoteItems();
    // const quoteTerms = await _migrateQuoteTerms();
    // const quoteNotes = await _migrateQuoteNotes();

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    logger.info(`Migration Results (${duration}s):`);
    // logger.info(`Coil Types: ${coilTypes.created} created, ${coilTypes.skipped} skipped, ${coilTypes.errors} errors`);
    // logger.info(`Product Classes: ${productClasses.created} created, ${productClasses.skipped} skipped, ${productClasses.errors} errors`);
    // logger.info(`Equipment Items: ${equipmentItems.created} created, ${equipmentItems.skipped} skipped, ${equipmentItems.errors} errors`);
    // logger.info(`Option Categories: ${optionCategories.created} created, ${optionCategories.skipped} skipped, ${optionCategories.errors} errors`);
    // logger.info(`Option Headers: ${optionHeaders.created} created, ${optionHeaders.skipped} skipped, ${optionHeaders.errors} errors`);
    // logger.info(`Option Details: ${optionDetails.created} created, ${optionDetails.skipped} skipped, ${optionDetails.errors} errors`);
    logger.info(`Quote Headers: ${quoteHeaders.created} created, ${quoteHeaders.skipped} skipped, ${quoteHeaders.errors} errors`);
    logger.info(`Quote Revisions: ${quotes.created} created, ${quotes.skipped} skipped, ${quotes.errors} errors`);
    // logger.info(`Quote Items: ${quoteItems.created} created, ${quoteItems.skipped} skipped, ${quoteItems.errors} errors`);
    // logger.info(`Custom Quote Items: ${customQuoteItems.created} created, ${customQuoteItems.skipped} skipped, ${customQuoteItems.errors} errors`);
    // logger.info(`Quote Terms: ${quoteTerms.created} created, ${quoteTerms.skipped} skipped, ${quoteTerms.errors} errors`);
    // logger.info(`Quote Notes: ${quoteNotes.created} created, ${quoteNotes.skipped} skipped, ${quoteNotes.errors} errors`);
  }
  catch (error) {
    logger.error("Error in main:", error);
  }
  finally {
    await closeDatabaseConnections();
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}
