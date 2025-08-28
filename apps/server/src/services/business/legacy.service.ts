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
    const order = params.order == null ? "" : params.order;
    const sort = (params.sort ? `ORDER BY ${params.sort} ${params.order === "" ? "" : params.order}` : "");

    return sort;
  }

  async initialize() {
    this.stdConnection = await odbc.connect(stdConnStr);
    this.jobConnection = await odbc.connect(jobConnStr);
    this.quoteConnection = await odbc.connect(quoteConnStr);
  }

  async create(database: string, table: string, data: any) {
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

  async update(database: string, table: string, field: string, id: string, newValue: string) {
    const query = `
      UPDATE PUB.${table}
      SET ${field} = '${newValue}'
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
    }
    catch (err) {
      logger.error(err);
    }
  }
}
