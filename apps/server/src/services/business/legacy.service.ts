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

export class LegacyService {
  private stdConnection?: odbc.Connection;
  private jobConnection?: odbc.Connection;
  private quoteConnection?: odbc.Connection;

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

  async initialize() {
    // Helper function to attempt connection with 500ms timeout
    const connectFast = async (connStr: string, dbName: string) => {
      try {
        const connectionPromise = odbc.connect(connStr);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Connection timeout after 1500ms`)), 1500),
        );

        const connection = await Promise.race([connectionPromise, timeoutPromise]) as odbc.Connection;
        logger.info(`Successfully connected to ${dbName} database`);
        return connection;
      }
      catch (err) {
        logger.warn(`Failed to connect to ${dbName} database, continuing without it`);
        return undefined;
      }
    };

    // Connect to all databases in parallel with 1500ms timeout each
    const [std, job, quote] = await Promise.all([
      connectFast(stdConnStr, "STD"),
      connectFast(jobConnStr, "JOB"),
      connectFast(quoteConnStr, "QUOTE"),
    ]);

    this.stdConnection = std;
    this.jobConnection = job;
    this.quoteConnection = quote;
  }

  async create(database: string, table: string, data: any) {
    if (!data || Object.keys(data).length === 0) {
      return false;
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

    console.log(query);

    try {
      const result = await this.getDatabaseConnection(database)?.query(query);
      return true;
    }
    catch (err) {
      logger.error("Error creating data:", err);
      return false;
    }
  }

  async getAll(database: string, table: string, params: any) {
    const limit = params.limit ? `FETCH FIRST ${params.limit} ROWS ONLY` : "";

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
        return null;
      }
      const result = await connection.query(query);
      return result;
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

      const count = result?.[0]?.total
        ?? result?.[0]?.TOTAL
        ?? result?.[0]?.Total
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

      // More accurate pagination check: if we got fewer records than requested,
      // we've reached the end. Only set hasMore to true if we got exactly
      // the batch size AND we know there could be more records
      const hasMore = records.length === batchSize;
      const nextOffset = offset + records.length;

      // Include total count if provided in params (passed from data-pipeline)
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
    const whereConditions = Object.entries(filters).map(([field, value]) => {
      const escapedField = field.replace(/\W/g, "");
      const escapedValue = String(value).replace(/'/g, "''");
      return `${escapedField} = '${escapedValue}'`;
    });

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    const query = `
      SELECT *
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
      console.error(`Error fetching ${table} where ${filterDescription}:`, err);
      return null;
    }
  }

  async update(database: string, table: string, id: string, data: Record<string, any>) {
    if (!data || Object.keys(data).length === 0) {
      return false;
    }

    // Determine the correct ID field name based on the table
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

    // Build SET clause
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
      const escapedValue = String(value).replace(/'/g, "''"); // Sanitize value
      return `"${escapedField}" = '${escapedValue}'`;
    });

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    const query = `
      DELETE FROM PUB.${table}
      ${whereClause}
    `;

    console.log(query);

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

      const maxValue = result?.[0]?.LargestValue
        ?? result?.[0]?.LARGESTVALUE
        ?? result?.[0]?.largestvalue
        ?? null;

      return maxValue !== null ? Number(maxValue) : null;
    }
    catch (err) {
      logger.error(`Error getting max value for field ${field} in table ${table}:`, err);
      return null;
    }
  }

  async close() {
    try {
      await this.stdConnection?.close();
      await this.jobConnection?.close();
      await this.quoteConnection?.close();
    }
    catch (err) {
      logger.error(err);
    }
  }
}
