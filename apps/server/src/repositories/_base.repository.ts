import { Prisma } from "@prisma/client";

import type { IQueryParams } from "@/types";

import { deriveTableNames, getObjectDiff } from "@/utils";
import { getEmployeeContext } from "@/utils/context";
import { buildQuery, prisma } from "@/utils/prisma";

const columnCache = new Map<string, string[]>();
const excludedModels = ["auditLog", "emailLog", "bugReport", "session", "loginHistory", "machineStatus"];

export class BaseRepository<T> {
  protected model: any;
  protected entityName?: string;
  protected modelName?: string;
  protected _columns?: string[];

  async getAll(params?: IQueryParams<T>, tx?: Prisma.TransactionClient) {
    const searchFields = this.getSearchFields();
    const { query, countQuery, page, take, hasComputedSearch, hasFuzzySearch, fuzzySearchFields, fuzzySearchTerm } = await this.buildQueryParams(
      params,
      searchFields,
      params?.includeDeleted,
    );

    const client = tx ?? this.model;

    if (hasFuzzySearch && fuzzySearchFields && fuzzySearchTerm) {
      const scope = await this.getScope(undefined, params?.includeDeleted);
      const items = await this.executeFuzzySearch(
        fuzzySearchFields,
        fuzzySearchTerm,
        query,
        scope,
        tx,
      );
      const total = items.length;
      const totalPages = take ? Math.ceil(total / take) : 1;

      const paginatedItems = take
        ? items.slice(query.skip || 0, (query.skip || 0) + take)
        : items;

      return {
        success: true,
        data: paginatedItems,
        meta: {
          page,
          limit: take,
          total,
          totalPages,
        },
      };
    }

    if (hasComputedSearch && params?.search) {
      const allItems = await client.findMany(query);
      const total = allItems.length;
      const totalPages = take ? Math.ceil(total / take) : 1;

      return {
        success: true,
        data: allItems,
        meta: {
          page,
          limit: take,
          total,
          totalPages,
        },
      };
    }

    const [items, total] = await Promise.all([
      client.findMany(query),
      client.count(countQuery),
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

  async getById(id: string, params?: IQueryParams<T>, tx?: Prisma.TransactionClient) {
    const scope = await this.getScope();
    const model = tx?.[this.modelName as keyof typeof tx] ?? this.model;

    const query: any = {
      where: {
        AND: [{ id }, scope ?? {}],
      },
    };

    if (params?.include) {
      const { include } = buildQuery(params, [], params?.includeDeleted, this.modelName);
      if (include)
        query.include = include;
    }
    else if (params?.select) {
      const { select } = buildQuery(params, [], params?.includeDeleted, this.modelName);
      if (select)
        query.select = select;
    }

    const item = await model.findFirst(query);

    return {
      success: true,
      data: item,
    };
  }

  async getHistory(id: string) {
    if (!this.modelName)
      throw new Error("Missing model name");

    const entries = await prisma.auditLog.findMany({
      where: { model: this.modelName, recordId: id },
      orderBy: { createdAt: "asc" },
    });

    return entries.map(entry => ({
      action: entry.action,
      actor: { id: entry.changedBy },
      timestamp: entry.createdAt,
      diff: entry.diff as Record<string, { before: any; after: any }>,
    }));
  }

  async create(data: any, tx?: Prisma.TransactionClient, skipValidation = false) {
    const meta = await this.getMetaFields({ for: "create", timestamps: true });
    const payload = { ...data, ...meta };

    if (!skipValidation) {
      await this.validate(payload);
    }

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
    const columns = await this.getColumns();
    const hasSoftDelete = columns.includes("deletedAt");

    const execute = async (client: Prisma.TransactionClient) => {
      const model = (client as any)[this.modelName!];

      const scope = await this.getScope();
      const where = { AND: [{ id }, scope ?? {}] };
      const before = await model.findFirst({ where });

      if (!before) {
        throw new Error(`Cannot delete: ${this.modelName} ${id} not found`);
      }

      if (hasSoftDelete) {
        const meta = await this.getMetaFields({
          for: "delete",
          timestamps: true,
          softDelete: true,
        });

        const deleted = await model.update({
          where: { id },
          data: meta,
        });

        await this.log("DELETE", before, deleted, client);
        return deleted;
      }
      else {
        await model.delete({ where: { id } });
        await this.log("DELETE", before, undefined, client);
        return before;
      }
    };

    if (tx) {
      await execute(tx);
    }
    else {
      await prisma.$transaction(execute);
    }
    return { success: true, message: "Deleted successfully" };
  }

  // Private Methods
  private async executeFuzzySearch(
    searchFields: string[],
    searchTerm: string,
    query: any,
    scope?: Record<string, any>,
    tx?: Prisma.TransactionClient,
  ): Promise<any[]> {
    if (!this.modelName) {
      return [];
    }

    const tables = deriveTableNames(this.modelName);
    const tableName = tables[tables.length - 1];

    const similarityConditions = searchFields
      .map(field => `COALESCE(similarity("${field}"::text, $1), 0)`)
      .join(" + ");

    const maxSimilarity = `(${similarityConditions})`;
    const minSimilarityThreshold = 0.3;

    const whereConditions: string[] = [];
    const queryParams: any[] = [searchTerm];

    whereConditions.push(`${maxSimilarity} >= ${minSimilarityThreshold}`);

    if (scope) {
      const scopeConditions = this.buildScopeConditions(scope);
      if (scopeConditions) {
        whereConditions.push(scopeConditions);
      }
    }

    const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

    const sql = `
      SELECT *,
        ${maxSimilarity} as similarity_score
      FROM "${tableName}"
      ${whereClause}
      ORDER BY similarity_score DESC, "createdAt" DESC
    `;

    const client = tx ?? prisma;
    const results = await client.$queryRawUnsafe(sql, ...queryParams);

    return results as any[];
  }

  private buildScopeConditions(scope: Record<string, any>): string | null {
    if (!scope.AND || !Array.isArray(scope.AND)) {
      return null;
    }

    const conditions: string[] = [];

    for (const condition of scope.AND) {
      if (condition.OR) {
        const orConditions = condition.OR.map((or: any) => {
          if (or.ownerId === null) {
            return '"ownerId" IS NULL';
          }
          if (or.ownerId) {
            return `"ownerId" = '${or.ownerId}'`;
          }
          return null;
        }).filter(Boolean);

        if (orConditions.length > 0) {
          conditions.push(`(${orConditions.join(" OR ")})`);
        }
      }

      if (condition.deletedAt !== undefined) {
        if (condition.deletedAt === null) {
          conditions.push('"deletedAt" IS NULL');
        } else if (condition.deletedAt?.not === null) {
          conditions.push('"deletedAt" IS NOT NULL');
        }
      }
    }

    return conditions.length > 0 ? conditions.join(" AND ") : null;
  }

  private async getColumns(): Promise<string[]> {
    if (this._columns)
      return this._columns;
    if (!this.modelName)
      return [];

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

    const cols = rows.map(r => r.column_name);
    columnCache.set(this.modelName, cols);
    this._columns = cols;
    return cols;
  }

  private async getScope(
    columns?: string[],
    includeDeleted?: boolean | "only",
  ): Promise<Record<string, any> | undefined> {
    const ctx = getEmployeeContext();
    const cols = columns ?? (await this.getColumns());

    const scope: Record<string, any>[] = [];

    if (cols.includes("ownerId")) {
      scope.push({ OR: [{ ownerId: null }, { ownerId: ctx.id }] });
    }

    if (cols.includes("deletedAt")) {
      if (includeDeleted === "only") {
        scope.push({ deletedAt: { not: null } });
      }
      else if (!includeDeleted) {
        scope.push({ deletedAt: null });
      }
    }

    return scope.length ? { AND: scope } : undefined;
  }

  private async getMetaFields(opts: {
    for: "create" | "update" | "delete";
    timestamps?: boolean;
    softDelete?: boolean;
  }) {
    const ctx = getEmployeeContext();
    const columns = await this.getColumns();
    const meta: Record<string, any> = {};
    const now = new Date();

    if (opts.for === "create") {
      if (columns.includes("createdById"))
        meta.createdById = ctx.id;
      if (opts.timestamps && columns.includes("createdAt"))
        meta.createdAt = now;
    }

    if (["create", "update"].includes(opts.for)) {
      if (columns.includes("updatedById"))
        meta.updatedById = ctx.id;
      if (opts.timestamps && columns.includes("updatedAt"))
        meta.updatedAt = now;
    }

    if (opts.for === "delete") {
      if (opts.softDelete && columns.includes("deletedAt"))
        meta.deletedAt = now;
      if (columns.includes("deletedById"))
        meta.deletedById = ctx.id;
    }

    return meta;
  }

  private async buildQueryParams(
    params?: IQueryParams<T>,
    searchFields?: (string | { field: string; weight: number })[],
    includeDeleted?: boolean | "only",
  ): Promise<any> {
    const transformedOrderBy = this.transformSort(params?.sort, params?.order);
    const transforms = this.getTransforms();

    const regularSearchFields = searchFields?.filter((sf) => {
      const fieldName = typeof sf === "string" ? sf : sf.field;
      return !transforms[fieldName];
    });

    const queryParams = transformedOrderBy
      ? { ...params, sort: undefined, order: undefined }
      : params ?? {};

    const { where, orderBy, page, take, skip, select, include, hasFuzzySearch, fuzzySearchFields, fuzzySearchTerm } = buildQuery(
      queryParams,
      regularSearchFields,
      includeDeleted,
      this.modelName,
    );

    const columns = await this.getColumns();
    const scope = await this.getScope(columns, includeDeleted);

    const finalWhere = { AND: [where ?? {}, scope ?? {}] };

    const query: any = {
      where: finalWhere,
      orderBy: transformedOrderBy ?? orderBy,
      take,
      skip,
    };

    if (select)
      query.select = select;
    else if (include)
      query.include = include;

    const countQuery = { where: finalWhere };

    return { query, countQuery, page, take, hasComputedSearch: false, hasFuzzySearch, fuzzySearchFields, fuzzySearchTerm };
  }

  private async log(
    action: "CREATE" | "UPDATE" | "DELETE",
    before?: Record<string, any>,
    after?: Record<string, any>,
    tx?: Prisma.TransactionClient,
  ) {
    if (!this.modelName || excludedModels.includes(this.modelName)) {
      return;
    }

    const ctx = getEmployeeContext();
    const auditModel = tx?.auditLog ?? prisma.auditLog;

    const recordId = after?.id ?? before?.id;
    if (!recordId) {
      return;
    }

    const diff = getObjectDiff(before, after);
    if (Object.keys(diff).length === 0) {
      return;
    }

    await auditModel.create({
      data: {
        model: this.modelName!,
        recordId,
        action,
        changedBy: ctx.id ?? "system",
        diff,
        createdAt: new Date(),
      },
    });
  }

  // Protected Methods
  protected async validate(_data: any): Promise<void> {}

  protected getSearchFields(): (string | { field: string; weight: number })[] {
    return [];
  }

  protected transformSort(sort?: string, order?: "asc" | "desc"): any {
    if (!sort)
      return undefined;

    if (sort.includes(".")) {
      const parts = sort.split(".");
      const orderBy: any = {};
      let current = orderBy;

      for (let i = 0; i < parts.length - 1; i++) {
        current[parts[i]] = {};
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = order || "asc";

      return orderBy;
    }

    return { [sort]: order || "asc" };
  }

  protected getTransforms(): Record<string, string> {
    return {};
  }
}
