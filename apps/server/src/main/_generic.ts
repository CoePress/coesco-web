import { deriveTableNames } from "@/utils";
import { getRequestContext } from "./context";
import { Prisma } from "@prisma/client";
import { buildQuery, prisma } from "@/utils/prisma";
import { IQueryParams } from "@/types/api.types";

const columnCache = new Map<string, string[]>();

export class GenericService<T> {
  protected model: any;
  protected entityName?: string;
  protected modelName?: string;
  private _columns?: string[];

  async test() {
    const ctx = getRequestContext();
    const columns = await this.getColumns();
    const scope = await this.getScope(columns);
    return { ctx, columns, scope };
  }

  async getAll(params?: IQueryParams<T>, tx?: Prisma.TransactionClient) {
    const { query, finalWhere, page, take } =
      await this.buildQueryParams(params);

    const [items, total] = await Promise.all([
      this.model.findMany(query),
      this.model.count({ where: finalWhere }),
    ]);

    const totalPages = take ? Math.ceil(total / (take || 1)) : 1;

    return {
      success: true,
      data: items,
      meta: {
        page,
        limit: take,
        total,
        totalPages,
      },
    };
  }

  async getById(id: string, tx?: Prisma.TransactionClient) {
    const scope = await this.getScope();
    return { scope };
  }

  async search(term: string, tx?: Prisma.TransactionClient) {
    const scope = await this.getScope();
    return { scope };
  }

  async create(data: any, tx?: Prisma.TransactionClient) {
    const meta = await this.getMetaFields({
      for: "create",
      timestamps: true,
    });
  }

  async update(id: string, data: any, tx?: Prisma.TransactionClient) {
    const meta = await this.getMetaFields({
      for: "update",
      timestamps: true,
    });
  }

  async delete(id: string, tx?: Prisma.TransactionClient) {
    const meta = await this.getMetaFields({
      for: "delete",
      timestamps: true,
      softDelete: true,
    });
  }

  async validate() {}

  private async getColumns(): Promise<string[]> {
    if (this._columns) return this._columns;
    if (!this.modelName) return [];

    if (columnCache.has(this.modelName)) {
      this._columns = columnCache.get(this.modelName)!;
      return this._columns;
    }

    const tables = deriveTableNames(this.modelName);
    const rows = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name
      FROM   information_schema.columns
      WHERE  table_schema = 'public'
        AND  table_name   IN (${Prisma.join(tables)})
    `;

    const cols = rows.map((r) => r.column_name);
    columnCache.set(this.modelName, cols);
    this._columns = cols;
    return cols;
  }

  private async getScope(
    columns?: string[]
  ): Promise<Record<string, any> | undefined> {
    const ctx = getRequestContext();
    const cols = columns ?? (await this.getColumns());

    if (!cols.includes("ownerId")) {
      return undefined;
    }

    return {
      OR: [{ ownerId: null }, { ownerId: ctx.employeeId }],
    };
  }

  private async getMetaFields(opts: {
    for: "create" | "update" | "delete";
    timestamps?: boolean;
    softDelete?: boolean;
  }) {
    const ctx = getRequestContext();
    const columns = await this.getColumns();
    const meta: Record<string, any> = {};

    const now = new Date();

    if (opts.for === "create") {
      if (columns.includes("createdById")) meta["createdById"] = ctx.employeeId;
      if (opts.timestamps && columns.includes("createdAt"))
        meta["createdAt"] = now;
    }

    if (["create", "update"].includes(opts.for)) {
      if (columns.includes("updatedById")) meta["updatedById"] = ctx.employeeId;
      if (opts.timestamps && columns.includes("updatedAt"))
        meta["updatedAt"] = now;
    }

    if (opts.for === "delete") {
      if (opts.softDelete && columns.includes("deletedAt"))
        meta["deletedAt"] = now;
      if (columns.includes("deletedById")) meta["deletedById"] = ctx.employeeId;
    }

    return meta;
  }

  private async buildQueryParams(params?: IQueryParams<T>): Promise<any> {
    const { where, orderBy, page, take, skip, select, include } = buildQuery(
      params ?? {},
      params?.searchFields?.map(String) ?? []
    );

    const columns = await this.getColumns();
    const scope = await this.getScope(columns);

    const finalWhere = {
      AND: [where ?? {}, scope ?? {}],
    };

    const query: any = {
      where: finalWhere,
      orderBy,
      take,
      skip,
    };

    if (select) query.select = select;
    else if (include) query.include = include;

    return {
      query,
      finalWhere,
      page,
      take,
    };
  }
}
