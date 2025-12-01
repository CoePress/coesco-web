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

    if (params?.fuzzy && params?.search) {
      return this.fuzzySearch(params, tx);
    }

    const { query, countQuery, page, take, hasComputedSearch } = await this.buildQueryParams(
      params,
      searchFields,
      params?.includeDeleted,
    );

    const model = tx?.[this.modelName as keyof typeof tx] ?? this.model;

    if (hasComputedSearch && params?.search) {
      const allItems = await model.findMany(query);
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
      model.findMany(query),
      model.count(countQuery),
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
  private async getColumns(): Promise<string[]> {
    if (this._columns)
      return this._columns;
    if (!this.modelName)
      return [];

    if (columnCache.has(this.modelName)) {
      this._columns = columnCache.get(this.modelName)!;
      return this._columns;
    }

    // Get actual table name from Prisma DMMF
    const dmmf = Prisma.dmmf;
    const model = dmmf.datamodel.models.find((m: any) => m.name.toLowerCase() === this.modelName?.toLowerCase());
    const actualTableName = model?.dbName || deriveTableNames(this.modelName!)[0];

    const rows = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${actualTableName}
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
      if (columns.includes("createdById")) {
        meta.createdById = ctx.id;
      }
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

    const hasTransformedFields = searchFields && searchFields.length > 0
      && Object.keys(transforms).length > 0;

    const regularSearchFields = searchFields?.filter((sf) => {
      const fieldName = typeof sf === "string" ? sf : sf.field;
      return !transforms[fieldName];
    });

    const hasComputedSearch = Boolean(
      params?.search && hasTransformedFields && regularSearchFields && regularSearchFields.length < searchFields!.length,
    );

    const queryParams = transformedOrderBy
      ? { ...params, sort: undefined, order: undefined }
      : params ?? {};

    const { where, orderBy, page, take, skip, select, include } = buildQuery(
      queryParams,
      regularSearchFields,
      includeDeleted,
      this.modelName,
    );

    const columns = await this.getColumns();
    const scope = await this.getScope(columns, includeDeleted);

    const finalWhere = { AND: [where ?? {}, scope ?? {}] };

    const primaryOrderBy = transformedOrderBy ?? orderBy;
    const finalOrderBy = await this.applyDefaultSort(primaryOrderBy, columns);

    const query: any = {
      where: finalWhere,
      orderBy: finalOrderBy,
      take,
      skip,
    };

    if (select)
      query.select = select;
    else if (include)
      query.include = include;

    const countQuery = { where: finalWhere };

    return { query, countQuery, page, take, hasComputedSearch };
  }

  private async applyDefaultSort(
    primaryOrderBy: any,
    columns: string[],
  ): Promise<any> {
    const defaultSort = this.getDefaultSort();
    const hasCreatedAt = columns.includes("createdAt");

    const fallbackSort = defaultSort ?? (hasCreatedAt ? { createdAt: "desc" as const } : undefined);

    if (!fallbackSort) {
      return primaryOrderBy;
    }

    if (!primaryOrderBy) {
      return fallbackSort;
    }

    const primaryArray = Array.isArray(primaryOrderBy) ? primaryOrderBy : [primaryOrderBy];
    const primaryFields = new Set(primaryArray.flatMap(obj => Object.keys(obj)));

    if (primaryFields.has(Object.keys(fallbackSort)[0])) {
      return primaryOrderBy;
    }

    return [...primaryArray, fallbackSort];
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

  protected getDefaultSort(): Record<string, "asc" | "desc"> | undefined {
    return undefined;
  }

  private isEnumField(fieldName: string): boolean {
    const pascalModelName = this.modelName!.charAt(0).toUpperCase() + this.modelName!.slice(1);
    const model = Prisma.dmmf.datamodel.models.find(m =>
      m.name === this.modelName || m.name === pascalModelName,
    );

    if (!model) {
      return false;
    }

    const field = model.fields.find(f => f.name === fieldName);
    return field?.kind === "enum";
  }

  private async fuzzySearch(params: IQueryParams<T>, _tx?: Prisma.TransactionClient) {
    if (!this.modelName) {
      throw new Error("Model name is required for fuzzy search");
    }

    const searchFields = this.getSearchFields();

    if (!searchFields || searchFields.length === 0) {
      throw new Error("Search fields must be defined for fuzzy search");
    }

    const filteredSearchFields = searchFields.filter((f) => {
      const fieldName = typeof f === "string" ? f : f.field;
      const isEnum = this.isEnumField(fieldName);
      return !isEnum;
    });

    if (filteredSearchFields.length === 0) {
      throw new Error("No valid search fields available for fuzzy search after filtering enum fields");
    }

    const threshold = params.fuzzyThreshold ?? 0.5;
    const searchTerm = params.search!;
    const page = params.page ?? 1;
    const take = params.limit ?? 25;
    const skip = (page - 1) * take;

    const columns = await this.getColumns();
    const scope = await this.getScope(columns, params?.includeDeleted);

    const escapedSearchTerm = searchTerm.replace(/'/g, "''");

    const similarityConditions = filteredSearchFields
      .map((f) => {
        const field = typeof f === "string" ? f : f.field;
        return `(
          similarity(CAST("${field}" AS TEXT), '${escapedSearchTerm}') > ${threshold}
          OR word_similarity('${escapedSearchTerm}', CAST("${field}" AS TEXT)) > ${threshold}
        )`;
      })
      .join(" OR ");

    const weightedSimilarity = filteredSearchFields
      .map((f) => {
        const field = typeof f === "string" ? f : f.field;
        const weight = typeof f === "string" ? 1 : f.weight;
        return `(
          GREATEST(
            similarity(CAST("${field}" AS TEXT), '${escapedSearchTerm}'),
            word_similarity('${escapedSearchTerm}', CAST("${field}" AS TEXT))
          ) * ${weight}
        )`;
      })
      .join(" + ");

    const tableNames = deriveTableNames(this.modelName);
    const tableName = tableNames[tableNames.length - 1];

    let whereClause = "";
    if (scope) {
      const scopeConditions = this.buildScopeSQL(scope);
      if (scopeConditions) {
        whereClause = `AND ${scopeConditions}`;
      }
    }

    const countQuery = `SELECT COUNT(*) as count
       FROM "${tableName}"
       WHERE (${similarityConditions})
       ${whereClause}`;

    const countResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(countQuery);

    const total = Number(countResult[0]?.count ?? 0);

    const selectQuery = `SELECT *,
              (${weightedSimilarity}) as similarity_score
       FROM "${tableName}"
       WHERE (${similarityConditions})
       ${whereClause}
       ORDER BY similarity_score DESC
       LIMIT ${take}
       OFFSET ${skip}`;

    const items = await prisma.$queryRawUnsafe(selectQuery);

    const totalPages = Math.ceil(total / take);

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

  private buildScopeSQL(scope: Record<string, any>): string {
    const conditions: string[] = [];

    if (scope.AND && Array.isArray(scope.AND)) {
      for (const condition of scope.AND) {
        if (condition.deletedAt !== undefined) {
          if (condition.deletedAt === null) {
            conditions.push("\"deletedAt\" IS NULL");
          }
          else if (condition.deletedAt?.not === null) {
            conditions.push("\"deletedAt\" IS NOT NULL");
          }
        }
        if (condition.ownerId !== undefined) {
          if (condition.ownerId === null) {
            conditions.push("\"ownerId\" IS NULL");
          }
        }
        if (condition.OR && Array.isArray(condition.OR)) {
          const orConditions = condition.OR.map((or: any) => {
            if (or.ownerId !== undefined) {
              if (or.ownerId === null) {
                return "\"ownerId\" IS NULL";
              }
              return `"ownerId" = '${or.ownerId}'`;
            }
            return "";
          }).filter(Boolean);
          if (orConditions.length > 0) {
            conditions.push(`(${orConditions.join(" OR ")})`);
          }
        }
      }
    }

    return conditions.join(" AND ");
  }
}
