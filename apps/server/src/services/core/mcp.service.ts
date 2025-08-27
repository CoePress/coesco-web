import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { logger } from "@/utils/logger";

export class McpService {
  private toolRegistry = new Map<string, any>();
  private tableRegistry = new Map<string, any>();
  private configPath: string;

  private tools = [
    { name: "get_all", description: "Get all records with query params", inputSchema: { type: "object", properties: { page: { type: "integer", minimum: 1 }, limit: { type: "integer", minimum: 1 }, sort: { type: "string" }, order: { type: "string", enum: ["asc", "desc"] }, filter: { type: ["object", "string"], additionalProperties: true }, search: { type: "string" }, searchFields: { type: "array", items: { type: "string" } }, dateFrom: { type: ["string", "null"], format: "date-time" }, dateTo: { type: ["string", "null"], format: "date-time" }, include: { oneOf: [{ type: "array", items: { type: "string" } }, { type: "object", additionalProperties: true }, { type: "string" }] }, select: { oneOf: [{ type: "array", items: { type: "string" } }, { type: "object", additionalProperties: true }, { type: "string" }] } }, additionalProperties: false } },
    { name: "get_by_id", description: "Get a single record by ID", inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"], additionalProperties: false } },
  ];

  private tables = [
    { name: "files", description: "Project files", columns: ["path", "name", "size", "modified"] },
    { name: "commits", description: "Git commits", columns: ["hash", "author", "message", "date"] },
    { name: "symbols", description: "Code symbols", columns: ["name", "type", "file", "line"] },
  ];

  constructor(configPath = join("./src/config", "mcp.json")) {
    this.configPath = configPath;
  }

  async initialize() {
    this.loadConfig();
    this.tools.forEach(t => this.toolRegistry.set(t.name, t));
    this.tables.forEach(tb => this.tableRegistry.set(tb.name, tb));

    this.saveConfig();
    logger.info(`MCP initialized with ${this.toolRegistry.size} tools, ${this.tableRegistry.size} tables`);
  }

  private saveConfig() {
    const config = {
      tools: Array.from(this.toolRegistry.values()),
      tables: Array.from(this.tableRegistry.values()),
      timestamp: new Date().toISOString(),
    };

    const dir = dirname(this.configPath);
    if (!existsSync(dir))
      mkdirSync(dir, { recursive: true });

    writeFileSync(this.configPath, JSON.stringify(config, null, 2));
  }

  private loadConfig() {
    if (!existsSync(this.configPath))
      return;

    try {
      const data = readFileSync(this.configPath, "utf8");
      const config = JSON.parse(data);

      if (Array.isArray(config.tools)) {
        config.tools.forEach((t: any) => this.toolRegistry.set(t.name, t));
      }

      if (Array.isArray(config.tables)) {
        config.tables.forEach((tb: any) => this.tableRegistry.set(tb.name, tb));
      }
    }
    catch (err) {
      logger.error("Failed to load MCP config", err);
    }
  }

  async listTools() {
    return Array.from(this.toolRegistry.values());
  }

  async listTables() {
    return Array.from(this.tableRegistry.values());
  }

  async callTool(name: string, args: any) {
    if (!this.toolRegistry.has(name))
      throw new Error(`Tool '${name}' not found`);
    return { success: true, tool: name, args, result: "mock result" };
  }
}
