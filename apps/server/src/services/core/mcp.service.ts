import * as fs from "node:fs";

import type { ISchema, ITool } from "@/types";

import { SCHEMAS, TOOLS } from "../../config/mcp-config";

export class MCPService {
  private tools: Map<string, ITool> = new Map();
  private schemas: Map<string, ISchema> = new Map();

  async initialize() {
    this.registerTools();
    this.registerSchemas();
  }

  async getSchemas(): Promise<ISchema[]> {
    return Array.from(this.schemas.values());
  }

  async getTools(): Promise<Omit<ITool, "handler">[]> {
    return Array.from(this.tools.values()).map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    }));
  }

  async callTool(name: string, params: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool)
      throw new Error(`Tool ${name} not found`);
    return tool.handler(params);
  }

  private registerTools(): void {
    if (TOOLS) {
      TOOLS.forEach((tool: ITool) => this.tools.set(tool.name, tool));
    }
    this.updateMCPJson();
  }

  private registerSchemas(): void {
    if (SCHEMAS) {
      SCHEMAS.forEach((schema: ISchema) => this.schemas.set(schema.name, schema));
    }
    this.updateMCPJson();
  }

  private updateMCPJson(): void {
    const mcpConfig = {
      tools: Array.from(this.tools.values()).map(t => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      })),
      schemas: Array.from(this.schemas.values()),
    };

    fs.writeFileSync("./src/config/mcp.json", JSON.stringify(mcpConfig, null, 2));
  }
}
