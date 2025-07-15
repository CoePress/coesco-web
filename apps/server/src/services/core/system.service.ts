import { prisma } from "@/utils/prisma";

export class SystemService {
  async getEntityTypes(): Promise<
    Array<{ tableName: string; modelName: string }>
  > {
    const result = await prisma.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;

    return result.map((row) => ({
      tableName: row.tablename,
      modelName: this.convertToModelName(row.tablename),
    }));
  }

  async getEntityFields(entityType: string): Promise<string[]> {
    const result = await prisma.$queryRaw<
      Array<{ column_name: string }>
    >`SELECT column_name FROM information_schema.columns WHERE table_name = ${entityType} AND table_schema = 'public'`;

    return result.map((row) => row.column_name);
  }

  private convertToModelName(tableName: string): string {
    let modelName = tableName
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("");

    if (modelName.endsWith("ies")) {
      modelName = modelName.slice(0, -3) + "y";
    } else if (
      modelName.endsWith("ses") ||
      modelName.endsWith("ches") ||
      modelName.endsWith("shes")
    ) {
      modelName = modelName.slice(0, -2);
    } else if (modelName.endsWith("s") && !modelName.endsWith("ss")) {
      modelName = modelName.slice(0, -1);
    }

    return modelName;
  }
}
