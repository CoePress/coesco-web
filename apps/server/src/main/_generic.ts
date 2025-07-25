import { deriveTableNames, getObjectDiff } from "@/utils";
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

  async getAll(params?: IQueryParams<T>, tx?: Prisma.TransactionClient) {
    const searchFields = this.getSearchFields();
    const { query, finalWhere, page, take } = await this.buildQueryParams(
      params,
      searchFields
    );

    const client = tx ?? this.model;

    const [items, total] = await Promise.all([
      client.findMany(query),
      client.count({ where: finalWhere }),
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
    const model = tx?.[this.modelName as keyof typeof tx] ?? this.model;

    const item = await model.findFirst({
      where: {
        AND: [{ id }, scope ?? {}],
      },
    });

    return {
      success: true,
      data: item,
    };
  }

  async getHistory(id: string) {
    if (!this.modelName) throw new Error("Missing model name");

    const entries = await prisma.auditLog.findMany({
      where: { model: this.modelName, recordId: id },
      orderBy: { createdAt: "asc" },
    });

    return entries.map((entry) => ({
      action: entry.action,
      actor: { id: entry.changedBy },
      timestamp: entry.createdAt,
      diff: entry.diff as Record<string, { before: any; after: any }>,
    }));
  }

  async create(data: any, tx?: Prisma.TransactionClient) {
    const meta = await this.getMetaFields({ for: "create", timestamps: true });
    const payload = { ...data, ...meta };

    const execute = async (client: Prisma.TransactionClient) => {
      const model = (client as any)[this.modelName!];
      const created = await model.create({ data: payload });
      await this.log("CREATE", undefined, created, client);
      return created;
    };

    const result = tx ? await execute(tx) : await prisma.$transaction(execute);
    return { success: true, data: result };
  }

  async update(id: string, data: any, tx?: Prisma.TransactionClient) {
    const meta = await this.getMetaFields({ for: "update", timestamps: true });
    const payload = { ...data, ...meta };

    this.validate({ id, ...data });

    const execute = async (client: Prisma.TransactionClient) => {
      const model = (client as any)[this.modelName!];

      const scope = await this.getScope();
      const where = { AND: [{ id }, scope ?? {}] };
      const before = await model.findFirst({ where });

      if (!before) {
        throw new Error(`Cannot update: ${this.modelName} ${id} not found`);
      }

      const diff = getObjectDiff(before, { ...before, ...payload });
      delete diff.updatedAt;

      if (Object.keys(diff).length === 0) {
        throw new Error(`${this.modelName} ${id} update made no changes`);
      }

      const updated = await model.update({
        where: { id },
        data: payload,
      });

      await this.log("UPDATE", before, updated, client);
      return updated;
    };

    const result = tx ? await execute(tx) : await prisma.$transaction(execute);
    return { success: true, data: result };
  }

  async delete(id: string, tx?: Prisma.TransactionClient) {
    const meta = await this.getMetaFields({
      for: "delete",
      timestamps: true,
      softDelete: true,
    });
    return meta;
  }

  // Private Methods
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
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN (${Prisma.join(tables)})
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

    const scope: Record<string, any>[] = [];

    if (cols.includes("ownerId")) {
      scope.push({ OR: [{ ownerId: null }, { ownerId: ctx.employeeId }] });
    }

    if (cols.includes("deletedAt")) {
      scope.push({ deletedAt: null });
    }

    return scope.length ? { AND: scope } : undefined;
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

  private async buildQueryParams(
    params?: IQueryParams<T>,
    searchFields?: (string | { field: string; weight: number })[]
  ): Promise<any> {
    const { where, orderBy, page, take, skip, select, include } = buildQuery(
      params ?? {},
      searchFields
    );
    const columns = await this.getColumns();
    const scope = await this.getScope(columns);

    const finalWhere = { AND: [where ?? {}, scope ?? {}] };

    const query: any = {
      where: finalWhere,
      orderBy,
      take,
      skip,
    };

    if (select) query.select = select;
    else if (include) query.include = include;

    return { query, finalWhere, page, take };
  }

  private async log(
    action: "CREATE" | "UPDATE" | "DELETE",
    before?: Record<string, any>,
    after?: Record<string, any>,
    tx?: Prisma.TransactionClient
  ) {
    if (this.modelName === "auditLog") return;

    const ctx = getRequestContext();
    const auditModel = tx?.auditLog ?? prisma.auditLog;

    const recordId = after?.id ?? before?.id;
    if (!recordId) return;

    const diff = getObjectDiff(before, after);
    if (Object.keys(diff).length === 0) return;

    await auditModel.create({
      data: {
        model: this.modelName!,
        recordId,
        action,
        changedBy: ctx.employeeId ?? "system",
        diff,
        createdAt: new Date(),
      },
    });
  }

  // Protected Methods
  protected validate(data: any) {
    return;
  }

  protected getSearchFields(): (string | { field: string; weight: number })[] {
    return [];
  }
}
