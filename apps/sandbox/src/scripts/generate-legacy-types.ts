/* eslint-disable node/prefer-global/process */
import fs from "node:fs/promises";
import path from "node:path";

import type { ColumnSchema, DatabaseSchema, TableSchema } from "../lib/odbc-types";

import logger from "../lib/logger";

const SCHEMAS_DIR = path.join(__dirname, "../../schemas");
const OUTPUT_FILE = path.join(__dirname, "../../src/lib/legacy-types.ts");

const PROGRESS_TO_TS: Record<string, string> = {
  "character": "string",
  "integer": "number",
  "int64": "number",
  "decimal": "number",
  "logical": "boolean",
  "date": "string",
  "datetime": "string",
  "datetime-tz": "string",
  "blob": "unknown",
  "clob": "string",
  "raw": "unknown",
  "rowid": "string",
  "recid": "number",
};

function mapType(column: ColumnSchema): string {
  const baseType = PROGRESS_TO_TS[column.dataType.toLowerCase()] ?? "unknown";
  return column.extent > 0 ? `${baseType}[]` : baseType;
}

function needsQuotes(name: string): boolean {
  return !/^[a-z_]\w*$/i.test(name);
}

function sanitizeTypeName(name: string): string {
  return name
    .replace(/^[^a-z_]+/i, "_")
    .replace(/\W/g, "_");
}

function generateTableInterface(table: TableSchema, indent: string): string {
  const hasQuotedProperty = table.columns.some(col => needsQuotes(col.name));

  const fields = table.columns
    .map((col) => {
      const fieldName = hasQuotedProperty ? `"${col.name}"` : col.name;
      const fieldType = mapType(col);
      const nullable = !col.mandatory ? " | null" : "";
      return `${indent}  ${fieldName}: ${fieldType}${nullable};`;
    })
    .join("\n");

  return `${indent}export interface ${sanitizeTypeName(table.name)} {\n${fields}\n${indent}}`;
}

function generateDatabaseNamespace(schema: DatabaseSchema, indent: string): string {
  const interfaces = schema.tables
    .map(table => generateTableInterface(table, `${indent}  `))
    .join("\n\n");

  return `${indent}export namespace ${schema.database} {\n${interfaces}\n${indent}}`;
}

async function loadSchemas(): Promise<DatabaseSchema[]> {
  const files = await fs.readdir(SCHEMAS_DIR);
  const jsonFiles = files.filter(f => f.endsWith(".json"));

  const schemas: DatabaseSchema[] = [];
  for (const file of jsonFiles) {
    const content = await fs.readFile(path.join(SCHEMAS_DIR, file), "utf-8");
    schemas.push(JSON.parse(content) as DatabaseSchema);
  }

  return schemas;
}

async function generateTypes(): Promise<void> {
  const schemas = await loadSchemas();

  if (schemas.length === 0) {
    logger.warn("No schema files found. Run schema:extract first.");
    return;
  }

  const namespaces = schemas
    .map(schema => generateDatabaseNamespace(schema, "  "))
    .join("\n\n");

  const output = `/* eslint-disable ts/no-namespace */
// Auto-generated from legacy database schemas
// Generated at: ${new Date().toISOString()}
// Do not edit manually - run \`npm run schema:generate\` to regenerate

export namespace legacy {
${namespaces}
}

export default legacy;
`;

  await fs.writeFile(OUTPUT_FILE, output);

  const totalTables = schemas.reduce((sum, s) => sum + s.tables.length, 0);
  const totalColumns = schemas.reduce(
    (sum, s) => sum + s.tables.reduce((tSum, t) => tSum + t.columns.length, 0),
    0,
  );

  logger.info(`Generated types for ${schemas.length} databases, ${totalTables} tables, ${totalColumns} columns`);
  logger.info(`Output: ${OUTPUT_FILE}`);
}

generateTypes().catch((err) => {
  logger.error("Type generation failed:", err);
  process.exit(1);
});
