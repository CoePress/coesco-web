import type { Connection } from "odbc";

import type {
  DatabaseName,
  FilterCondition,
  FilterParams,
  PaginatedResult,
  PaginationParams,
} from "./odbc-types";

import logger from "./logger";
import { connectionManager } from "./odbc-connection";

export class LegacyService {
  private getConnection(database: DatabaseName): Connection | undefined {
    return connectionManager.get(database);
  }

  private validateFieldName(field: string): string {
    if (!/^\w+$/.test(field)) {
      throw new Error(`Invalid field name: ${field}`);
    }
    return field;
  }

  private formatValue(value: unknown): string {
    if (value === null || value === undefined)
      return "NULL";
    if (typeof value === "number")
      return String(value);
    return `'${String(value).replace(/'/g, "''")}'`;
  }

  private buildConditionSQL(condition: FilterCondition): string {
    const { operator } = condition;

    if (operator === "and" || operator === "or") {
      if (!condition.conditions?.length) {
        throw new Error(`${operator} operator requires conditions array`);
      }
      const clauses = condition.conditions.map(c => this.buildConditionSQL(c)).filter(Boolean);
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
    const value = condition.value;

    switch (operator) {
      case "equals":
        return `${field} = ${this.formatValue(value)}`;
      case "notEquals":
        return `${field} <> ${this.formatValue(value)}`;
      case "gt":
        return `${field} > ${this.formatValue(value)}`;
      case "gte":
        return `${field} >= ${this.formatValue(value)}`;
      case "lt":
        return `${field} < ${this.formatValue(value)}`;
      case "lte":
        return `${field} <= ${this.formatValue(value)}`;
      case "contains":
        return `UPPER(${field}) LIKE UPPER('%${String(value ?? "").replace(/'/g, "''")}%')`;
      case "startsWith":
        return `UPPER(${field}) LIKE UPPER('${String(value ?? "").replace(/'/g, "''")}%')`;
      case "endsWith":
        return `UPPER(${field}) LIKE UPPER('%${String(value ?? "").replace(/'/g, "''")}')`;
      case "in":
        if (!condition.values?.length)
          return "";
        return `${field} IN (${condition.values.map(v => this.formatValue(v)).join(", ")})`;
      case "notIn":
        if (!condition.values?.length)
          return "";
        return `${field} NOT IN (${condition.values.map(v => this.formatValue(v)).join(", ")})`;
      case "isNull":
        return `${field} IS NULL`;
      case "isNotNull":
        return `${field} IS NOT NULL`;
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  }

  private buildFilterSQL(filter: FilterParams): string {
    if (filter.filters?.length) {
      return filter.filters
        .map(condition => this.buildConditionSQL(condition))
        .filter(Boolean)
        .join(" AND ");
    }
    if (filter.operator) {
      return this.buildConditionSQL(filter as FilterCondition);
    }
    return "";
  }

  private buildOrderSQL(params: PaginationParams): string {
    if (!params.sort)
      return "";
    const order = params.order?.toUpperCase() === "DESC" ? "DESC" : "ASC";
    return `ORDER BY ${this.validateFieldName(params.sort)} ${order}`;
  }

  private buildFieldSelection(fields?: string): string {
    if (!fields)
      return "*";
    return fields
      .split(",")
      .map(f => `"${f.trim()}"`)
      .join(", ");
  }

  async getAll(
    database: DatabaseName,
    table: string,
    params: PaginationParams & { filter?: FilterParams },
  ): Promise<PaginatedResult | null> {
    const connection = this.getConnection(database);
    if (!connection) {
      logger.warn(`No connection for ${database}`);
      return null;
    }

    const page = params.page ?? 1;
    const limit = params.limit ?? 25;
    const offset = (page - 1) * limit;

    const fieldSelection = this.buildFieldSelection(params.fields);
    let whereClause = "";

    if (params.filter) {
      const sql = this.buildFilterSQL(params.filter);
      if (sql)
        whereClause = `WHERE ${sql}`;
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
      ${this.buildOrderSQL(params)}
      OFFSET ${offset} ROWS FETCH FIRST ${limit} ROWS ONLY
    `;

    try {
      const [countResult, dataResult] = (await Promise.all([
        connection.query(countQuery),
        connection.query(dataQuery),
      ])) as [Record<string, unknown>[], Record<string, unknown>[]];

      const countRow = countResult?.[0] as Record<string, unknown> | undefined;
      const total
        = (countRow?.total as number)
          ?? (countRow?.TOTAL as number)
          ?? (countRow?.Total as number)
          ?? 0;

      const totalCount = Number(total) || 0;
      const totalPages = Math.ceil(totalCount / limit);

      return {
        data: dataResult ?? [],
        meta: { page, limit, total: totalCount, totalPages },
      };
    }
    catch (err) {
      logger.error("Error in getAll:", err);
      return null;
    }
  }

  async getById(
    database: DatabaseName,
    table: string,
    idField: string,
    id: string,
    fields?: string,
  ): Promise<Record<string, unknown> | null> {
    const connection = this.getConnection(database);
    if (!connection) {
      logger.warn(`No connection for ${database}`);
      return null;
    }

    const fieldSelection = this.buildFieldSelection(fields);

    const query = `
      SELECT ${fieldSelection}
      FROM PUB.${table}
      WHERE ${this.validateFieldName(idField)} = '${id.replace(/'/g, "''")}'
    `;

    try {
      const result = await connection.query(query);
      return (result?.[0] as Record<string, unknown>) ?? null;
    }
    catch (err) {
      logger.error("Error in getById:", err);
      return null;
    }
  }

  async getByFilter(
    database: DatabaseName,
    table: string,
    filters: Record<string, string>,
    params?: PaginationParams,
  ): Promise<Record<string, unknown>[] | null> {
    const connection = this.getConnection(database);
    if (!connection) {
      logger.warn(`No connection for ${database}`);
      return null;
    }

    const fieldSelection = this.buildFieldSelection(params?.fields);
    const limit = params?.limit ? `FETCH FIRST ${params.limit} ROWS ONLY` : "";

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
      return `${escapedField} = '${escapedValue}'`;
    });

    const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(" AND ")}` : "";

    const query = `
      SELECT ${fieldSelection}
      FROM PUB.${table}
      ${whereClause}
      ${params ? this.buildOrderSQL(params) : ""}
      ${limit}
    `;

    try {
      const result = await connection.query(query);
      return (result as Record<string, unknown>[]) ?? null;
    }
    catch (err) {
      logger.error("Error in getByFilter:", err);
      return null;
    }
  }

  async create(
    database: DatabaseName,
    table: string,
    data: Record<string, unknown>,
  ): Promise<Record<string, unknown> | false> {
    const connection = this.getConnection(database);
    if (!connection || !data || Object.keys(data).length === 0) {
      return false;
    }

    const filteredData = Object.entries(data).reduce(
      (acc, [key, value]) => {
        if (value !== "" && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, unknown>,
    );

    const fields = Object.keys(filteredData);
    const values = Object.values(filteredData);

    if (fields.length === 0)
      return false;

    const fieldList = fields.map(f => `"${f}"`).join(", ");
    const valueList = values.map(v => this.formatValue(v)).join(", ");

    const query = `
      INSERT INTO PUB.${table}
      (${fieldList}) VALUES (${valueList})
    `;

    try {
      await connection.query(query);
      return filteredData;
    }
    catch (err) {
      logger.error("Error in create:", err);
      return false;
    }
  }

  async update(
    database: DatabaseName,
    table: string,
    idField: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<boolean> {
    const connection = this.getConnection(database);
    if (!connection || !data || Object.keys(data).length === 0) {
      return false;
    }

    const setClause = Object.entries(data)
      .map(([field, value]) => {
        if (value === null)
          return `${field} = NULL`;
        if (typeof value === "string")
          return `${field} = '${value.replace(/'/g, "''")}'`;
        return `${field} = ${value}`;
      })
      .join(", ");

    const query = `
      UPDATE PUB.${table}
      SET ${setClause}
      WHERE ${this.validateFieldName(idField)} = '${id.replace(/'/g, "''")}'
    `;

    try {
      await connection.query(query);
      return true;
    }
    catch (err) {
      logger.error("Error in update:", err);
      return false;
    }
  }

  async delete(database: DatabaseName, table: string, idField: string, id: string): Promise<boolean> {
    const connection = this.getConnection(database);
    if (!connection)
      return false;

    const query = `
      DELETE FROM PUB.${table}
      WHERE ${this.validateFieldName(idField)} = '${id.replace(/'/g, "''")}'
    `;

    try {
      await connection.query(query);
      return true;
    }
    catch (err) {
      logger.error("Error in delete:", err);
      return false;
    }
  }

  async getCount(database: DatabaseName, table: string, filter?: FilterParams): Promise<number> {
    const connection = this.getConnection(database);
    if (!connection)
      return 0;

    let whereClause = "";
    if (filter) {
      const sql = this.buildFilterSQL(filter);
      if (sql)
        whereClause = `WHERE ${sql}`;
    }

    const query = `
      SELECT COUNT(*) as total
      FROM PUB.${table}
      ${whereClause}
    `;

    try {
      const result = (await connection.query(query)) as Record<string, unknown>[];
      const countRow = result?.[0];
      const count
        = (countRow?.total as number)
          ?? (countRow?.TOTAL as number)
          ?? (countRow?.Total as number)
          ?? 0;
      return Number(count) || 0;
    }
    catch (err) {
      logger.error("Error in getCount:", err);
      return 0;
    }
  }

  async getMaxValue(database: DatabaseName, table: string, field: string): Promise<number | null> {
    const connection = this.getConnection(database);
    if (!connection)
      return null;

    const query = `
      SELECT MAX(${this.validateFieldName(field)}) AS LargestValue
      FROM PUB.${table}
    `;

    try {
      const result = (await connection.query(query)) as Record<string, unknown>[];
      const row = result?.[0];
      const maxValue
        = (row?.LargestValue as number)
          ?? (row?.LARGESTVALUE as number)
          ?? (row?.largestvalue as number)
          ?? null;
      return maxValue !== null ? Number(maxValue) : null;
    }
    catch (err) {
      logger.error("Error in getMaxValue:", err);
      return null;
    }
  }

  async getTables(database: DatabaseName): Promise<string[] | null> {
    const connection = this.getConnection(database);
    if (!connection)
      return null;

    const query = `
      SELECT "_File-Name"
      FROM PUB."_File"
      WHERE "_Tbl-Type" = 'T'
      ORDER BY "_File-Name"
    `;

    try {
      const result = (await connection.query(query)) as Record<string, unknown>[];
      return result?.map(row => row["_File-Name"] as string) ?? null;
    }
    catch (err) {
      logger.error("Error in getTables:", err);
      return null;
    }
  }

  async getFields(database: DatabaseName, table: string): Promise<string[] | null> {
    const connection = this.getConnection(database);
    if (!connection)
      return null;

    const query = `
      SELECT * FROM PUB.${table}
      FETCH FIRST 1 ROW ONLY
    `;

    try {
      const result = await connection.query(query);
      return result?.columns?.map(col => col.name) ?? null;
    }
    catch (err) {
      logger.error("Error in getFields:", err);
      return null;
    }
  }
}

export const legacyService = new LegacyService();
