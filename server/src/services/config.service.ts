import ConfigValue from "@/models/config-value";
import { ConfigValueType } from "@/utils/types";
import { error } from "@/utils/logger";

class ConfigService {
  constructor() {}

  async getConfig(): Promise<Record<string, any>> {
    try {
      const configValues = await ConfigValue.findAll();
      return this.transformToConfigObject(configValues);
    } catch (err) {
      error("Failed to read config:", err);
      throw new Error("Failed to read configuration from database");
    }
  }

  async getConfigValue<T>(path: string): Promise<T> {
    const parts = path.split(".");
    const key = parts[parts.length - 1];

    try {
      const configValue = await ConfigValue.findOne({
        where: { key },
      });

      if (!configValue) {
        throw new Error(`Config path "${path}" not found`);
      }

      return configValue.value as T;
    } catch (err) {
      error("Failed to get config value:", err);
      throw err;
    }
  }

  async updateConfigValue<T>(path: string, value: T): Promise<T> {
    const parts = path.split(".");
    const key = parts[parts.length - 1];

    try {
      const [configValue] = await ConfigValue.upsert({
        key,
        value: value as ConfigValueType,
        type: typeof value,
      });

      return configValue.value as T;
    } catch (err) {
      error("Failed to update config value:", err);
      throw new Error(
        `Failed to update configuration: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  async updateConfig(
    updates: Record<string, any>,
    basePath: string = ""
  ): Promise<void> {
    try {
      // Handle all updates in a single transaction
      for (const [key, value] of Object.entries(updates)) {
        const fullKey = basePath ? `${basePath}.${key}` : key;
        await this.updateConfigValue(fullKey, value);
      }
    } catch (err) {
      error("Failed to update config:", err);
      throw new Error(
        `Failed to update configuration: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  private async transformToConfigObject(
    configValues: ConfigValue[]
  ): Promise<Record<string, any>> {
    const result: Record<string, any> = {};

    for (const config of configValues) {
      const path = await this.buildConfigPath(config);
      this.setNestedValue(result, path, config.value);
    }

    return result;
  }

  private async buildConfigPath(config: ConfigValue): Promise<string> {
    const parts: string[] = [config.key];
    let current = config;

    while (current.parentId) {
      current = (await ConfigValue.findByPk(current.parentId)) as ConfigValue;
      parts.unshift(current.key);
    }

    return parts.join(".");
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const parts = path.split(".");
    const lastPart = parts.pop()!;
    const target = parts.reduce((acc, part) => {
      if (!(part in acc)) {
        acc[part] = {};
      }
      return acc[part];
    }, obj);
    target[lastPart] = value;
  }
}

export default ConfigService;
