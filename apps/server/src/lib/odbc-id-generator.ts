import { randomUUID } from "node:crypto";

import type { DatabaseName, IdMapEntry } from "./odbc-types";

import logger from "./logger";
import { legacyService } from "./odbc-service";

/**
 * ID Map configuration for auto-generating IDs on legacy tables.
 * Add entries here when tables need auto-generated primary keys.
 */
const ID_MAP: IdMapEntry[] = [
  {
    database: "std",
    table: "Journey_Contact",
    ids: [{ field: "ID", type: "uuid" }],
  },
  {
    database: "std",
    table: "Journey",
    ids: [{ field: "ID", type: "uuid" }],
  },
  {
    database: "std",
    table: "Company",
    ids: [
      { field: "Company_ID", type: "int" },
      { field: "id", type: "uuid" },
    ],
  },
  {
    database: "std",
    table: "Journey_Log",
    ids: [{ field: "ID", type: "uuid" }],
  },
  {
    database: "std",
    table: "Address",
    ids: [{ field: "id", type: "uuid" }],
  },
];

export class IdGenerator {
  private idMap: IdMapEntry[];

  constructor(idMap: IdMapEntry[] = ID_MAP) {
    this.idMap = idMap;
  }

  /**
   * Get the ID configuration for a specific table
   */
  getTableConfig(database: DatabaseName, table: string): IdMapEntry | undefined {
    return this.idMap.find(
      entry => entry.database === database && entry.table.toLowerCase() === table.toLowerCase(),
    );
  }

  /**
   * Generate a unique UUID, verifying it doesn't exist in the table
   */
  async generateUniqueUuid(
    database: DatabaseName,
    table: string,
    field: string,
    maxAttempts = 10,
  ): Promise<string> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const id = randomUUID();

      try {
        const existing = await legacyService.getByFilter(database, table, { [field]: id });
        if (!existing || existing.length === 0) {
          return id;
        }
      }
      catch {
        // If check fails, assume ID is unique
        return id;
      }
    }

    throw new Error(`Failed to generate unique UUID for ${table}.${field} after ${maxAttempts} attempts`);
  }

  /**
   * Generate the next integer ID by finding MAX + 1
   */
  async generateNextIntId(
    database: DatabaseName,
    table: string,
    field: string,
  ): Promise<number> {
    try {
      const maxValue = await legacyService.getMaxValue(database, table, field);
      return (maxValue ?? 0) + 1;
    }
    catch (err) {
      logger.error(`Error generating int ID for ${table}.${field}:`, err);
      // Fallback to random large number
      return Math.floor(Math.random() * 900000) + 100000;
    }
  }

  /**
   * Auto-populate IDs for a data object based on the ID map configuration.
   * Only generates IDs for fields that are empty/null/undefined.
   */
  async populateIds(
    database: DatabaseName,
    table: string,
    data: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const config = this.getTableConfig(database, table);
    if (!config) {
      return data;
    }

    const result = { ...data };

    for (const idConfig of config.ids) {
      const currentValue = result[idConfig.field];

      // Only generate if field is empty
      if (currentValue !== null && currentValue !== undefined && currentValue !== "") {
        continue;
      }

      try {
        if (idConfig.type === "uuid") {
          result[idConfig.field] = await this.generateUniqueUuid(
            database,
            table,
            idConfig.field,
          );
        }
        else if (idConfig.type === "int") {
          result[idConfig.field] = await this.generateNextIntId(
            database,
            table,
            idConfig.field,
          );
        }

        logger.info(`Generated ${idConfig.type} ID for ${table}.${idConfig.field}: ${result[idConfig.field]}`);
      }
      catch (err) {
        logger.error(`Failed to generate ID for ${table}.${idConfig.field}:`, err);
        throw err;
      }
    }

    return result;
  }
}

export const idGenerator = new IdGenerator();
