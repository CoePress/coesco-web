import { prisma } from "@/utils/prisma";

export class SystemService {
  async getEntityTypes(): Promise<string[]> {
    const result = await prisma.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;

    return result.map((row) => row.tablename);
  }

  async getEntityFields(entityType: string): Promise<string[]> {
    const result = await prisma.$queryRaw<
      Array<{ column_name: string }>
    >`SELECT column_name FROM information_schema.columns WHERE table_name = ${entityType} AND table_schema = 'public'`;

    return result.map((row) => row.column_name);
  }
}
