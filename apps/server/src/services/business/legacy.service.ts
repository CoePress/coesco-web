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
    this.stdConnection = await odbc.connect(stdConnStr);
    this.jobConnection = await odbc.connect(jobConnStr);
    this.quoteConnection = await odbc.connect(quoteConnStr);
  }

  async create(database: string, table: string, data: any) {
    return;
    const query = `
      INSERT INTO PUB.${table} 
      (ID) VALUES (${data})
    `;

    try {
      const result = await this.getDatabaseConnection(database)?.query(query);
      // logger.log(result?.[0].id);
      return true;
    }
    catch (err) {
      logger.log("Error creating data:", err);
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
      const result = await this.getDatabaseConnection(database)?.query(query);
      return result;
    }
    catch (err) {
      logger.log("Error fetching data:", err);
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
      const result: any = await this.getDatabaseConnection(database)?.query(query);

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
      const result = await this.getDatabaseConnection(database)?.query(query);
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
      logger.log("Error fetching paginated data:", err);
      return {
        records: [],
        hasMore: false,
        nextOffset: offset,
      };
    }
  }

  async getById(database: string, table: string, id: string, fields?: string[] | null) {
    const fieldSelection = fields && fields.length > 0 ? fields.join(",") : "*";

    const query = `
      SELECT ${fieldSelection}
      FROM PUB.${table}
      WHERE ID = '${id}'
    `;

    try {
      const result = await this.getDatabaseConnection(database)?.query(query);
      return result?.[0];
    }
    catch (err) {
      logger.log("Error fetching data:", err);
      return null;
    }
  }

  async update(database: string, table: string, id: string, data: Record<string, any>) {
    return;
    if (!data || Object.keys(data).length === 0) {
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

    const query = `
      UPDATE PUB.${table}
      SET ${setClause}
      WHERE ID = '${id}'
    `;

    try {
      await this.getDatabaseConnection(database)?.query(query);
      return true;
    }
    catch (err) {
      logger.error("Error updating database: ", err);
      return false;
    }
  }

  // Dangerous, unreachable code for now
  async delete(database: string, table: string, id: string) {
    return;
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

  async getTables(database: "quote" | "std" | "job") {
    const query = `
      SELECT "_File-Name"
      FROM PUB."_File"
      WHERE "_Tbl-Type" = 'T'
      ORDER BY "_File-Name"
    `;

    try {
      const result = await this.getDatabaseConnection(database)?.query(query);
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
      const result = await this.getDatabaseConnection(database)?.query(query);

      return result?.columns.map(col => col.name);
    }
    catch (err) {
      logger.error("Error fetching table columns: ", err);
      return "";
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
