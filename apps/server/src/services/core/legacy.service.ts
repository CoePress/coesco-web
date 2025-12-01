import * as fs from "node:fs";
import * as path from "node:path";
import odbc from "odbc";

import { env } from "@/config/env";
import { logger } from "@/utils/logger";

const stdConnStr = `
  Driver=${env.ODBC_DRIVER};
  HostName=${env.STD_HOST};
  PortNumber=${env.STD_PORT};
  DatabaseName=${env.STD_DB};
  UID=${env.PROSQL_USER};
  PWD=${env.PROSQL_PASSWORD};
`;

const jobConnStr = `
  Driver=${env.ODBC_DRIVER};
  HostName=${env.JOB_HOST};
  PortNumber=${env.JOB_PORT};
  DatabaseName=${env.JOB_DB};
  UID=${env.PROSQL_USER};
  PWD=${env.PROSQL_PASSWORD};
`;

const quoteConnStr = `
  Driver=${env.ODBC_DRIVER};
  HostName=${env.QUOTE_HOST};
  PortNumber=${env.QUOTE_PORT};
  DatabaseName=${env.QUOTE_DB};
  UID=${env.PROSQL_USER};
  PWD=${env.PROSQL_PASSWORD};
`;

interface IdMapEntry {
  database: string;
  table: string;
  ids: Array<{
    field: string;
    type: "uuid" | "int";
  }>;
}

export class LegacyService {
  private stdConnection?: odbc.Connection;
  private jobConnection?: odbc.Connection;
  private quoteConnection?: odbc.Connection;
  private idMap?: IdMapEntry[];
  private connectionCheckInterval?: NodeJS.Timeout;

  private validateFieldName(field: string): string {
    if (!/^\w+$/.test(field)) {
      throw new Error(`Invalid field name: ${field}`);
    }
    return field;
  }

  private formatValue(value: any): string {
    if (value === null || value === undefined)
      return "NULL";
    if (typeof value === "number")
      return String(value);
    return `'${String(value).replace(/'/g, "''")}'`;
  }

  private buildConditionSQL(condition: any): string {
    const operator = condition.operator;

    if (operator === "and" || operator === "or") {
      if (!condition.conditions || !Array.isArray(condition.conditions)) {
        throw new Error(`${operator} operator requires conditions array`);
      }
      const clauses = condition.conditions
        .map((c: any) => this.buildConditionSQL(c))
        .filter(Boolean);

      if (clauses.length === 0)
        return "";
      if (clauses.length === 1)
        return clauses[0];
      return `(${clauses.join(` ${operator.toUpperCase()} `)})`;
    }

    if (!condition.field) {
      throw new Error("Field is required for non-logical operators");
    }

    const field = this.validateFieldName(condition.field);

    switch (operator) {
      case "equals":
        return `${field} = ${this.formatValue(condition.value)}`;
      case "notEquals":
        return `${field} <> ${this.formatValue(condition.value)}`;
      case "gt":
        return `${field} > ${this.formatValue(condition.value)}`;
      case "gte":
        return `${field} >= ${this.formatValue(condition.value)}`;
      case "lt":
        return `${field} < ${this.formatValue(condition.value)}`;
      case "lte":
        return `${field} <= ${this.formatValue(condition.value)}`;
      case "contains":
        return `UPPER(${field}) LIKE UPPER('%${String(condition.value || "").replace(/'/g, "''")}%')`;
      case "startsWith":
        return `UPPER(${field}) LIKE UPPER('${String(condition.value || "").replace(/'/g, "''")}%')`;
      case "endsWith":
        return `UPPER(${field}) LIKE UPPER('%${String(condition.value || "").replace(/'/g, "''")}')`;
      case "in":
        if (!condition.values || !Array.isArray(condition.values) || condition.values.length === 0)
          return "";
        return `${field} IN (${condition.values.map((v: any) => this.formatValue(v)).join(", ")})`;
      case "notIn":
        if (!condition.values || !Array.isArray(condition.values) || condition.values.length === 0)
          return "";
        return `${field} NOT IN (${condition.values.map((v: any) => this.formatValue(v)).join(", ")})`;
      case "isNull":
        return `${field} IS NULL`;
      case "isNotNull":
        return `${field} IS NOT NULL`;
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  }

  private buildFilterSQL(filter: any): string {
    if (filter.filters && Array.isArray(filter.filters)) {
      return filter.filters
        .map((condition: any) => this.buildConditionSQL(condition))
        .filter(Boolean)
        .join(" AND ");
    }
    if (filter.operator)
      return this.buildConditionSQL(filter);
    return "";
  }

  private getDatabaseConnection(db: string) {
    switch (db) {
      case "job":
        return this.jobConnection;
      case "std":
        return this.stdConnection;
      case "quote":
        return this.quoteConnection;
      default:
        return this.stdConnection;
    }
  }

  private buildOrderQuery(params: any) {
    if (!params.sort) {
      return "";
    }

    const order = params.order?.toUpperCase() === "DESC" ? "DESC" : "ASC";
    return `ORDER BY ${params.sort} ${order}`;
  }

  private loadIdMap() {
    if (this.idMap) {
      return this.idMap;
    }

    try {
      const idMapPath = path.join(process.cwd(), "src/config/legacy-service-id-map.json");
      const idMapData = fs.readFileSync(idMapPath, "utf8");
      this.idMap = JSON.parse(idMapData);
      return this.idMap;
    }
    catch (err) {
      logger.error("Error loading ID map:", err);
      return [];
    }
  }

  private async generateUniqueUuid(database: string, table: string, field: string): Promise<string> {
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      const newId = crypto.randomUUID();

      try {
        const existingRecords = await this.getAllByCustomFilter(database, table, { [field]: newId });

        if (!existingRecords || !Array.isArray(existingRecords) || existingRecords.length === 0) {
          return newId;
        }
      }
      catch (error) {
        logger.warn("Error checking UUID uniqueness, using generated ID:", error);
        return newId;
      }

      attempts++;
    }

    throw new Error(`Failed to generate unique UUID for table ${table} field ${field} after ${maxAttempts} attempts`);
  }

  private async generateUniqueNumericId(database: string, table: string, field: string): Promise<number> {
    try {
      const maxValue = await this.getMaxValue(database, table, field);
      return (maxValue || 0) + 1;
    }
    catch (error) {
      logger.error("Error getting max ID:", error);
      return Math.floor(Math.random() * 1000000) + 1;
    }
  }

  private async reconnect(database: string): Promise<odbc.Connection | undefined> {
    let connStr: string;
    let dbName: string;

    switch (database) {
      case "std":
        connStr = stdConnStr;
        dbName = "STD";
        break;
      case "job":
        connStr = jobConnStr;
        dbName = "JOB";
        break;
      case "quote":
        connStr = quoteConnStr;
        dbName = "QUOTE";
        break;
      default:
        return undefined;
    }

    try {
      logger.info(`Attempting to reconnect to ${dbName} database...`);
      const connectionPromise = odbc.connect(connStr);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Connection timeout after 10000ms`)), 10000),
      );

      const connection = await Promise.race([connectionPromise, timeoutPromise]) as odbc.Connection;
      logger.info(`Successfully reconnected to ${dbName} database`);

      if (database === "std")
        this.stdConnection = connection;
      else if (database === "job")
        this.jobConnection = connection;
      else if (database === "quote")
        this.quoteConnection = connection;

      return connection;
    }
    catch (err) {
      logger.error(`Failed to reconnect to ${dbName} database:`, err);
      return undefined;
    }
  }

  private startConnectionCheck() {
    this.connectionCheckInterval = setInterval(async () => {
      for (const db of ["std", "job", "quote"]) {
        const conn = this.getDatabaseConnection(db);
        if (!conn) {
          logger.warn(`No connection for ${db} database, attempting to reconnect...`);
          await this.reconnect(db);
        }
        else {
          try {
            await conn.query("SELECT 1 FROM PUB.\"_File\" FETCH FIRST 1 ROW ONLY");
          }
          catch (err) {
            logger.warn(`No connection to ${db} database, attempting to reconnect...`);
            await this.reconnect(db);
          }
        }
      }
    }, 60000);
  }

  async initialize() {
    // Helper function to attempt connection with 500ms timeout
    const connectFast = async (connStr: string, dbName: string) => {
      try {
        logger.info(`Attempting to connect to ${dbName} database...`);
        const connectionPromise = odbc.connect(connStr);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Connection timeout after 1500ms`)), 10000),
        );

        const connection = await Promise.race([connectionPromise, timeoutPromise]) as odbc.Connection;
        logger.info(`Successfully connected to ${dbName} database`);
        return connection;
      }
      catch (err) {
        logger.error(`Failed to connect to ${dbName} database:`, err);
        logger.warn(`Continuing without ${dbName} database connection`);
        return undefined;
      }
    };

    logger.info("Initializing legacy service database connections...");

    // Connect to all databases in parallel with 1500ms timeout each
    const [std, job, quote] = await Promise.all([
      connectFast(stdConnStr, "STD"),
      connectFast(jobConnStr, "JOB"),
      connectFast(quoteConnStr, "QUOTE"),
    ]);

    this.stdConnection = std;
    this.jobConnection = job;
    this.quoteConnection = quote;

    const connectedDatabases = [
      std ? "STD" : null,
      job ? "JOB" : null,
      quote ? "QUOTE" : null,
    ].filter(Boolean);

    if (connectedDatabases.length === 0) {
      logger.error("Failed to connect to any databases");
    }
    else {
      logger.info(`Successfully connected to: ${connectedDatabases.join(", ")}`);
    }

    logger.info("Starting health check service (checking every 60 seconds)...");
    this.startConnectionCheck();
  }

  async create(database: string, table: string, data: any) {
    if (!data || Object.keys(data).length === 0) {
      return false;
    }

    // Auto-generate IDs based on the ID map
    const idMap = this.loadIdMap();
    const tableConfig = idMap?.find(entry => entry.database === database && entry.table === table);

    if (tableConfig) {
      for (const idConfig of tableConfig.ids) {
        // Only generate ID if the field is not already provided
        if (!(idConfig.field in data) || data[idConfig.field] === null || data[idConfig.field] === undefined || data[idConfig.field] === "") {
          try {
            if (idConfig.type === "uuid") {
              data[idConfig.field] = await this.generateUniqueUuid(database, table, idConfig.field);
            }
            else if (idConfig.type === "int") {
              data[idConfig.field] = await this.generateUniqueNumericId(database, table, idConfig.field);
            }
            logger.info(`Auto-generated ${idConfig.type} ID for ${table}.${idConfig.field}: ${data[idConfig.field]}`);
          }
          catch (error) {
            logger.error(`Failed to generate ID for ${table}.${idConfig.field}:`, error);
            return false;
          }
        }
      }
    }

    // Filter out fields with empty string values, especially for date fields
    const filteredData = Object.entries(data).reduce((acc, [key, value]) => {
      // Skip empty strings for date fields and other empty values
      if (value === "" || value === null || value === undefined) {
        return acc;
      }
      acc[key] = value;
      return acc;
    }, {} as Record<string, any>);

    // Get the field names and values from the filtered data object
    const fields = Object.keys(filteredData);
    const values = Object.values(filteredData);

    if (fields.length === 0) {
      return false;
    }

    // Build the field list for the INSERT statement with quoted field names
    const fieldList = fields.map(field => `"${field}"`).join(", ");

    // Build the values list with proper escaping
    const valueList = values.map((value) => {
      if (value === null || value === undefined) {
        return "NULL";
      }
      else if (typeof value === "string") {
        return `'${value.replace(/'/g, "''")}'`;
      }
      else {
        return String(value);
      }
    }).join(", ");

    const query = `
      INSERT INTO PUB.${table} 
      (${fieldList}) VALUES (${valueList})
    `;

    try {
      const result = await this.getDatabaseConnection(database)?.query(query);
      return filteredData;
    }
    catch (err) {
      logger.error("Error creating data:", err);
      return false;
    }
  }

  async getAll(database: string, table: string, params: any) {
    const page = params.page || 1;
    const limit = params.limit || 25;
    const offset = (page - 1) * limit;

    let fieldSelection = "*";
    if (params.fields && typeof params.fields === "string") {
      const fields = params.fields.split(",").map((field: string) => `"${field.trim()}"`);
      fieldSelection = fields.join(", ");
    }

    let whereClause = "";

    if (params.filter) {
      if (typeof params.filter === "object") {
        const sql = this.buildFilterSQL(params.filter);
        if (sql) {
          whereClause = `WHERE ${sql}`;
        }
      }
      else if (typeof params.filter === "string") {
        whereClause = `WHERE ${params.filter}`;
      }
    }

    const countQuery = `
      SELECT COUNT(*) as total
      FROM PUB.${table}
      ${whereClause}
    `;

    const dataQuery = `
      SELECT ${fieldSelection}
      FROM PUB.${table}
      ${whereClause}
      ${this.buildOrderQuery(params)}
      OFFSET ${offset} ROWS FETCH FIRST ${limit} ROWS ONLY
    `;

    try {
      const connection = this.getDatabaseConnection(database);
      if (!connection) {
        logger.warn(`No connection available for database: ${database}`);
        return null;
      }

      const [countResult, dataResult] = await Promise.all([
        connection.query(countQuery),
        connection.query(dataQuery),
      ]) as [any[], any[]];

      const countRow = countResult?.[0] as Record<string, any> | undefined;
      const total = countRow?.total
        ?? countRow?.TOTAL
        ?? countRow?.Total
        ?? 0;

      const totalCount = Number(total) || 0;
      const totalPages = Math.ceil(totalCount / limit);

      return {
        data: dataResult || [],
        meta: {
          page,
          limit,
          total: totalCount,
          totalPages,
        },
      };
    }
    catch (err) {
      logger.error("Error fetching data:", err);
      return null;
    }
  }

  async getCount(database: string, table: string, params: any): Promise<number> {
    let whereClause = "";
    if (params.filter) {
      const [field, value] = params.filter.split("=");
      const comparator = "=";
      whereClause = `WHERE ${field} ${comparator} ${value}`;
    }

    const query = `
    SELECT COUNT(*) as total
    FROM PUB.${table}
    ${whereClause}
  `;

    try {
      const connection = this.getDatabaseConnection(database);
      if (!connection) {
        logger.warn(`No connection available for database: ${database}`);
        return 0;
      }
      const result: any = await connection.query(query);

      const countRow = (result as any[])?.[0] as any;
      const count = countRow?.total
        ?? countRow?.TOTAL
        ?? countRow?.Total
        ?? 0;
      return Number(count) || 0;
    }
    catch (err) {
      logger.error("Error getting count:", err);
      return 0;
    }
  }

  async getAllPaginated(
    database: string,
    table: string,
    params: any,
    batchSize: number = 1000,
  ): Promise<{ records: any[]; hasMore: boolean; nextOffset: number; totalCount?: number }> {
    const offset = params.offset || 0;
    const limit = `OFFSET ${offset} ROWS FETCH FIRST ${batchSize} ROWS ONLY`;

    let whereClause = "";
    if (params.filter) {
      const [field, value] = params.filter.split("=");
      const comparator = "=";
      whereClause = `WHERE ${field} ${comparator} ${value}`;
    }

    const query = `
    SELECT *
    FROM PUB.${table}
    ${whereClause}
    ${this.buildOrderQuery(params)}
    ${limit}
  `;

    try {
      const connection = this.getDatabaseConnection(database);
      if (!connection) {
        logger.warn(`No connection available for database: ${database}`);
        return {
          records: [],
          hasMore: false,
          nextOffset: offset,
        };
      }
      const result = await connection.query(query);
      const records = result || [];

      const hasMore = records.length === batchSize;
      const nextOffset = offset + records.length;

      const totalCount = params.totalCount;

      return {
        records,
        hasMore,
        nextOffset,
        totalCount,
      };
    }
    catch (err) {
      logger.error("Error fetching paginated data:", err);
      return {
        records: [],
        hasMore: false,
        nextOffset: offset,
      };
    }
  }

  async getById(database: string, table: string, id: string, fields?: string[] | null) {
    const fieldSelection = fields && fields.length > 0 ? fields.join(",") : "*";

    // To help prevent bullshit temporarily
    // TODO: This can be updated to use a mapping
    let idField = "ID";
    if (table.toLowerCase() === "company") {
      idField = "Company_ID";
    }
    else if (table.toLowerCase() === "contacts") {
      idField = "Cont_ID";
    }

    const query = `
      SELECT ${fieldSelection}
      FROM PUB.${table}
      WHERE ${idField} = '${id}'
    `;

    try {
      const connection = this.getDatabaseConnection(database);
      if (!connection) {
        logger.warn(`No connection available for database: ${database}`);
        return null;
      }
      const result = await connection.query(query);
      return result?.[0];
    }
    catch (err) {
      logger.error("Error fetching data:", err);
      return null;
    }
  }

  async getAllByCustomFilter(database: string, table: string, filters: Record<string, string>, params?: any) {
    const limit = params?.limit ? `FETCH FIRST ${params.limit} ROWS ONLY` : "";

    let fieldSelection = "*";
    if (params?.fields && typeof params.fields === "string") {
      const fields = params.fields.split(",").map((field: string) => `"${field.trim()}"`);
      fieldSelection = fields.join(", ");
    }

    const whereConditions = Object.entries(filters).map(([field, value]) => {
      const escapedField = field.replace(/\W/g, "");
      const stringValue = String(value);

      if (stringValue.startsWith("NOT:")) {
        const actualValue = stringValue.substring(4).replace(/'/g, "''");
        return `${escapedField} <> '${actualValue}'`;
      }

      const escapedValue = stringValue.replace(/'/g, "''");

      if (escapedValue.includes("%") || escapedValue.includes("_")) {
        return `UPPER(${escapedField}) LIKE UPPER('${escapedValue}')`;
      }
      else {
        return `${escapedField} = '${escapedValue}'`;
      }
    });

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    const query = `
      SELECT ${fieldSelection}
      FROM PUB.${table}
      ${whereClause}
      ${params ? this.buildOrderQuery(params) : ""}
      ${limit}
    `;

    try {
      const result = await this.getDatabaseConnection(database)?.query(query);
      return result;
    }
    catch (err) {
      const filterDescription = Object.entries(filters).map(([field, value]) => `${field} = ${value}`).join(" AND ");
      logger.error(`Error fetching ${table} where ${filterDescription}:`, err);
      return null;
    }
  }

  async update(database: string, table: string, id: string, data: Record<string, any>) {
    if (!data || Object.keys(data).length === 0) {
      return false;
    }

    let idField = "ID";
    if (table.toLowerCase() === "company") {
      idField = "Company_ID";
    }
    else if (table.toLowerCase() === "contacts") {
      idField = "Cont_ID";
    }

    const setClause = Object.entries(data)
      .map(([field, value]) => {
        if (value === null) {
          return `${field} = NULL`;
        }
        else if (typeof value === "string") {
          return `${field} = '${value.replace(/'/g, "''")}'`;
        }
        else {
          return `${field} = ${value}`;
        }
      })
      .join(", ");

    const query = `
      UPDATE PUB.${table}
      SET ${setClause}
      WHERE ${idField} = '${id}'
    `;

    try {
      const connection = this.getDatabaseConnection(database);
      if (!connection) {
        logger.warn(`No connection available for database: ${database}`);
        return false;
      }
      await connection.query(query);
      return true;
    }
    catch (err) {
      logger.error("Error updating database: ", err);
      return false;
    }
  }

  async updateByCustomFilter(database: string, table: string, filters: Record<string, string>, data: Record<string, any>) {
    if (!data || Object.keys(data).length === 0) {
      return false;
    }

    if (!filters || Object.keys(filters).length === 0) {
      return false;
    }

    const setClause = Object.entries(data)
      .map(([field, value]) => {
        if (value === null) {
          return `${field} = NULL`;
        }
        else if (typeof value === "string") {
          return `${field} = '${value.replace(/'/g, "''")}'`;
        }
        else {
          return `${field} = ${value}`;
        }
      })
      .join(", ");

    const whereConditions = Object.entries(filters).map(([field, value]) => {
      const escapedField = field.replace(/\W/g, "");
      const escapedValue = String(value).replace(/'/g, "''");
      return `${escapedField} = '${escapedValue}'`;
    });

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    const query = `
      UPDATE PUB.${table}
      SET ${setClause}
      ${whereClause}
    `;

    try {
      const result = await this.getDatabaseConnection(database)?.query(query);
      return true;
    }
    catch (err) {
      const filterDescription = Object.entries(filters).map(([field, value]) => `${field} = ${value}`).join(" AND ");
      logger.error(`Error updating ${table} where ${filterDescription}:`, err);
      return false;
    }
  }

  async delete(database: string, table: string, id: string) {
    const query = `
      DELETE FROM PUB.${table}
      WHERE ID = '${id}'
    `;

    try {
      await this.getDatabaseConnection(database)?.query(query);
      return true;
    }
    catch (err) {
      logger.error("Error deleting record: ", err);
      return false;
    }
  }

  async deleteByCustomFilter(database: string, table: string, filters: Record<string, string>) {
    if (!filters || Object.keys(filters).length === 0) {
      return false;
    }

    const whereConditions = Object.entries(filters).map(([field, value]) => {
      const escapedField = field.replace(/[^\w#]/g, ""); // Sanitize field name (allow # for fields like RefSerial#)
      const escapedValue = String(value).replace(/'/g, "''");
      return `"${escapedField}" = '${escapedValue}'`;
    });

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    const query = `
      DELETE FROM PUB.${table}
      ${whereClause}
    `;

    try {
      const result = await this.getDatabaseConnection(database)?.query(query);
      return true;
    }
    catch (err) {
      const filterDescription = Object.entries(filters).map(([field, value]) => `${field} = ${value}`).join(" AND ");
      logger.error(`Error deleting from ${table} where ${filterDescription}:`, err);
      return false;
    }
  }

  async getTables(database: "quote" | "std" | "job") {
    const query = `
      SELECT "_File-Name"
      FROM PUB."_File"
      WHERE "_Tbl-Type" = 'T'
      ORDER BY "_File-Name"
    `;

    try {
      const connection = this.getDatabaseConnection(database);
      if (!connection) {
        logger.warn(`No connection available for database: ${database}`);
        return null;
      }
      const result = await connection.query(query);
      const tableNames = result?.map((row: any) => row["_File-Name"]);

      return tableNames;
    }
    catch (err) {
      logger.error(`Error fetching tables of database: ${database} with error${err}`);
      return null;
    }
  }

  async getFields(database: string, table: string) {
    const query = `
      SELECT * FROM Pub.${table}
      FETCH FIRST 1 ROW ONLY
    `;

    try {
      const connection = this.getDatabaseConnection(database);
      if (!connection) {
        logger.warn(`No connection available for database: ${database}`);
        return "";
      }
      const result = await connection.query(query);

      return result?.columns.map(col => col.name);
    }
    catch (err) {
      logger.error("Error fetching table columns: ", err);
      return "";
    }
  }

  async getMaxValue(database: string, table: string, field: string): Promise<number | null> {
    const query = `
      SELECT MAX(${field}) AS LargestValue
      FROM PUB.${table}
    `;

    try {
      const result: any = await this.getDatabaseConnection(database)?.query(query);

      const maxRow = (result as any[])?.[0] as any;
      const maxValue = maxRow?.LargestValue
        ?? maxRow?.LARGESTVALUE
        ?? maxRow?.largestvalue
        ?? null;

      return maxValue !== null ? Number(maxValue) : null;
    }
    catch (err) {
      logger.error(`Error getting max value for field ${field} in table ${table}:`, err);
      return null;
    }
  }

  async getQuoteValue(quoteKeyValue: string): Promise<{ quoteValue: number; revision: string; lineItems: Array<{ lineItem: string; description: string; price: number }> }> {
    if (!quoteKeyValue) {
      return { quoteValue: 0, revision: "", lineItems: [] };
    }

    const parts = quoteKeyValue.split("-");
    if (parts.length < 2) {
      return { quoteValue: 0, revision: "", lineItems: [] };
    }

    const qyear = Number.parseInt(parts[0], 10);
    const qnum = Number.parseInt(parts[1], 10);

    if (Number.isNaN(qyear) || Number.isNaN(qnum)) {
      return { quoteValue: 0, revision: "", lineItems: [] };
    }

    const qyear2Digit = qyear < 100 ? qyear : qyear % 100;
    const qyear4Digit = qyear < 100 ? 2000 + qyear : qyear;

    const summaryQuery = `
      SELECT QRev, SUM(salesprice) as total
      FROM PUB.qrevcostsheet
      WHERE (qyear = ${qyear2Digit} OR qyear = ${qyear4Digit}) AND qnum = ${qnum}
      GROUP BY QRev
      ORDER BY QRev DESC
    `;

    try {
      const connection = this.quoteConnection;
      if (!connection) {
        return { quoteValue: 0, revision: "", lineItems: [] };
      }

      const summaryResult = await connection.query(summaryQuery);

      if (!summaryResult || summaryResult.length === 0) {
        return { quoteValue: 0, revision: "", lineItems: [] };
      }

      const revisions = summaryResult
        .map((row: any) => ({
          qrev: String(row.QRev ?? row.qrev ?? row.QREV ?? row.Qrev ?? "").trim(),
          total: row.total ?? row.TOTAL ?? row.Total ?? 0,
        }))
        .map((r: any) => ({
          qrev: r.qrev || "a",
          total: r.total,
        }));

      revisions.sort((a: any, b: any) => b.qrev.localeCompare(a.qrev));
      const selectedRow = revisions[0];
      const selectedRevision = selectedRow.qrev;

      const lineItemsQuery = `
        SELECT lineItem, Description, salesprice
        FROM PUB.qrevcostsheet
        WHERE (qyear = ${qyear2Digit} OR qyear = ${qyear4Digit})
          AND qnum = ${qnum}
          AND (QRev = '${selectedRevision.replace(/'/g, "''")}' OR (QRev IS NULL AND '${selectedRevision}' = 'a'))
        ORDER BY lineItem
      `;

      const lineItemsResult = await connection.query(lineItemsQuery);

      const lineItems = (lineItemsResult || []).map((row: any) => ({
        lineItem: String(row.lineItem ?? row.LINEITEM ?? row.LineItem ?? "").trim() || "-",
        description: String(row.Description ?? row.DESCRIPTION ?? row.description ?? "").trim() || "-",
        price: Number(row.salesprice ?? row.SALESPRICE ?? row.SalesPrice ?? 0),
      }));

      const finalValue = Number(selectedRow.total) || 0;

      return { quoteValue: finalValue, revision: selectedRevision, lineItems };
    }
    catch (err) {
      logger.error("[getQuoteValue] Error fetching quote value:", err);
      return { quoteValue: 0, revision: "", lineItems: [] };
    }
  }

  async close() {
    try {
      if (this.connectionCheckInterval) {
        clearInterval(this.connectionCheckInterval);
        logger.info("Health check service stopped");
      }
      await this.stdConnection?.close();
      await this.jobConnection?.close();
      await this.quoteConnection?.close();
    }
    catch (err) {
      logger.error(err);
    }
  }
}
