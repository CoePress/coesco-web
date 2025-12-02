import { Prisma, PrismaClient } from "@prisma/client";

import type { IQueryBuilderResult, IQueryParams } from "@/types";

import { __dev__, __test__, env } from "@/config/env";

import { logger } from "./logger";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Query metrics tracking
export const queryMetrics = {
  totalQueries: 0,
  slowQueries: 0,
  totalDuration: 0,
  slowestQuery: { duration: 0, query: "", timestamp: new Date() },
  queriesByDuration: {
    fast: 0,      // < 100ms
    medium: 0,    // 100-500ms
    slow: 0,      // 500ms-1s
    verySlow: 0,  // > 1s
  },
  reset() {
    this.totalQueries = 0;
    this.slowQueries = 0;
    this.totalDuration = 0;
    this.slowestQuery = { duration: 0, query: "", timestamp: new Date() };
    this.queriesByDuration = { fast: 0, medium: 0, slow: 0, verySlow: 0 };
  },
  getAverageDuration() {
    return this.totalQueries > 0 ? this.totalDuration / this.totalQueries : 0;
  },
  getSummary() {
    return {
      totalQueries: this.totalQueries,
      slowQueries: this.slowQueries,
      averageDuration: Math.round(this.getAverageDuration() * 100) / 100,
      slowestQuery: this.slowestQuery,
      distribution: this.queriesByDuration,
    };
  },
};

// Enable query events in all environments for metrics tracking
const shouldLogQueries = __dev__ || env.LOG_ALL_QUERIES;

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: [
    { level: "query", emit: "event" },
    { level: "error", emit: "stdout" },
    { level: "warn", emit: "stdout" },
  ],
  datasources: {
    db: {
      url: `${env.DATABASE_URL}?connection_limit=${env.DATABASE_CONNECTION_LIMIT}&pool_timeout=${env.DATABASE_POOL_TIMEOUT}&connect_timeout=${env.DATABASE_CONNECTION_TIMEOUT}`,
    },
  },
});

// Query event handler for metrics and logging
prisma.$on("query" as never, (e: Prisma.QueryEvent) => {
  const duration = e.duration;
  const threshold = env.SLOW_QUERY_THRESHOLD_MS;

  // Update metrics
  queryMetrics.totalQueries++;
  queryMetrics.totalDuration += duration;

  // Categorize by duration
  if (duration < 100) {
    queryMetrics.queriesByDuration.fast++;
  } else if (duration < 500) {
    queryMetrics.queriesByDuration.medium++;
  } else if (duration < 1000) {
    queryMetrics.queriesByDuration.slow++;
  } else {
    queryMetrics.queriesByDuration.verySlow++;
  }

  // Track slowest query
  if (duration > queryMetrics.slowestQuery.duration) {
    queryMetrics.slowestQuery = {
      duration,
      query: e.query.substring(0, 500), // Truncate for storage
      timestamp: new Date(),
    };
  }

  // Log slow queries
  if (duration >= threshold) {
    queryMetrics.slowQueries++;

    // Extract table name from query for better logging
    const tableMatch = e.query.match(/FROM\s+"?(\w+)"?/i) || e.query.match(/INTO\s+"?(\w+)"?/i) || e.query.match(/UPDATE\s+"?(\w+)"?/i);
    const table = tableMatch ? tableMatch[1] : "unknown";

    if (duration >= 1000) {
      logger.error({
        message: "Very slow query detected",
        duration: `${duration}ms`,
        table,
        query: e.query,
        params: e.params,
      });
    } else {
      logger.warn({
        message: "Slow query detected",
        duration: `${duration}ms`,
        table,
        query: e.query,
        params: e.params,
      });
    }
  } else if (shouldLogQueries && __dev__) {
    // In dev mode with LOG_ALL_QUERIES, log all queries at debug level
    logger.debug({
      message: "Query executed",
      duration: `${duration}ms`,
      query: e.query.substring(0, 200),
    });
  }
});

if (__dev__) {
  globalForPrisma.prisma = prisma;
}

const relationFieldCache = new Map<string, Set<string>>();
const modelSoftDeleteCache = new Map<string, boolean>();

function normalizeModelName(modelName: string): string {
  const pascalModelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);
  const found = Prisma.dmmf.datamodel.models.find(m =>
    m.name === modelName || m.name === pascalModelName,
  );
  return found?.name || modelName;
}

function modelHasSoftDelete(modelName: string): boolean {
  const normalized = normalizeModelName(modelName);

  if (modelSoftDeleteCache.has(normalized)) {
    return modelSoftDeleteCache.get(normalized)!;
  }

  const model = Prisma.dmmf.datamodel.models.find(m => m.name === normalized);
  const hasSoftDelete = model?.fields.some(f => f.name === "deletedAt") ?? false;

  modelSoftDeleteCache.set(normalized, hasSoftDelete);
  return hasSoftDelete;
}

function getListRelationFields(modelName: string): Set<string> {
  const normalized = normalizeModelName(modelName);

  if (relationFieldCache.has(normalized)) {
    return relationFieldCache.get(normalized)!;
  }

  const model = Prisma.dmmf.datamodel.models.find(m => m.name === normalized);

  if (!model) {
    return new Set();
  }

  const listFields = new Set(
    model.fields
      .filter(field => field.kind === "object" && field.isList)
      .map(field => field.name),
  );

  relationFieldCache.set(normalized, listFields);
  return listFields;
}

function getRelationTargetModel(modelName: string, fieldName: string): string | null {
  const normalized = normalizeModelName(modelName);
  const model = Prisma.dmmf.datamodel.models.find(m => m.name === normalized);

  if (!model)
    return null;

  const field = model.fields.find(f => f.name === fieldName);
  return field?.kind === "object" && field.type ? field.type : null;
}

function isEnumField(modelName: string, fieldName: string): boolean {
  const normalized = normalizeModelName(modelName);
  const model = Prisma.dmmf.datamodel.models.find(m => m.name === normalized);

  if (!model) {
    return false;
  }

  const field = model.fields.find(f => f.name === fieldName);
  return field?.kind === "enum";
}

function normalizeSearchFields(searchFields?: Array<string | { field: string; weight: number }>) {
  return (searchFields || []).map(f =>
    typeof f === "string" ? { field: f, weight: 1 } : f,
  );
}

function buildSearchWhere(search: string, normalized: { field: string; weight: number }[], modelName?: string) {
  return normalized
    .filter(({ field }) => !modelName || !isEnumField(modelName, field))
    .map(({ field }) => ({
      [field]: { contains: search, mode: "insensitive" },
    }));
}

function resolveSearchOrdering(sort: string | undefined, normalized: { field: string; weight: number }[]) {
  if (sort)
    return undefined;
  const [primary] = normalized.sort((a, b) => b.weight - a.weight);
  return { [primary.field]: "asc" };
}

function parseComplexParam(param: any) {
  if (typeof param === "string") {
    try {
      return JSON.parse(param);
    }
    catch (error) {
      logger.error("Invalid JSON format:", error);
      return null;
    }
  }
  return param;
}

function buildNestedInclude(paths: string[], includeDeleted?: boolean | "only", modelName?: string) {
  const result: any = {};
  paths.forEach((path) => {
    const parts = path.split(".");
    let current = result;
    let currentModel = modelName;

    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        if (!current[part] || current[part] === true) {
          current[part] = applyDeletedAtFilter({}, includeDeleted, currentModel, part);
        }
      }
      else {
        if (current[part] === true) {
          current[part] = { include: {} };
        }
        else if (!current[part]) {
          current[part] = { include: {} };
        }
        current = current[part].include;

        if (currentModel) {
          const nextModel = getRelationTargetModel(currentModel, part);
          if (nextModel) {
            currentModel = nextModel;
          }
        }
      }
    });
  });
  return result;
}

function applyDeletedAtFilter(config: any, includeDeleted?: boolean | "only", modelName?: string, fieldName?: string) {
  if (includeDeleted === true) {
    return config === true || (typeof config === "object" && Object.keys(config).length === 0) ? true : config;
  }

  if (modelName && fieldName) {
    const listFields = getListRelationFields(modelName);
    if (!listFields.has(fieldName)) {
      return config === true || (typeof config === "object" && Object.keys(config).length === 0) ? true : config;
    }

    const targetModel = getRelationTargetModel(modelName, fieldName);
    if (!targetModel || !modelHasSoftDelete(targetModel)) {
      return config === true || (typeof config === "object" && Object.keys(config).length === 0) ? true : config;
    }
  }

  const baseConfig = config === true || (typeof config === "object" && Object.keys(config).length === 0) ? {} : config;

  if (includeDeleted === "only") {
    return { ...baseConfig, where: { ...(baseConfig.where || {}), deletedAt: { not: null } } };
  }
  else {
    return { ...baseConfig, where: { ...(baseConfig.where || {}), deletedAt: null } };
  }
}

function processFilterValue(value: any): any {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const operators = ["gte", "gt", "lte", "lt", "not", "in", "notIn", "contains", "startsWith", "endsWith", "AND", "OR", "NOT"];
  const hasOperator = Object.keys(value).some(key => operators.includes(key));

  if (hasOperator) {
    const processed: any = {};
    for (const [key, val] of Object.entries(value)) {
      if (["AND", "OR"].includes(key) && Array.isArray(val)) {
        processed[key] = val.map(item => processFilterValue(item));
      }
      else if (key === "NOT") {
        processed[key] = processFilterValue(val);
      }
      else {
        processed[key] = val;
      }
    }
    return processed;
  }

  return value;
}

function buildSelectOrInclude(params: IQueryParams<any>, result: IQueryBuilderResult, includeDeleted?: boolean | "only", modelName?: string) {
  if (params.select) {
    const parsedSelect = parseComplexParam(params.select);
    if (Array.isArray(parsedSelect) && parsedSelect.length > 0) {
      if (
        parsedSelect.some(
          item => typeof item === "string" && item.includes("."),
        )
      ) {
        result.select = buildNestedInclude(parsedSelect, includeDeleted, modelName);
      }
      else {
        result.select = parsedSelect.reduce(
          (acc, field) => {
            acc[field] = true;
            return acc;
          },
          {} as Record<string, boolean>,
        );
      }
    }
    else if (parsedSelect && typeof parsedSelect === "object" && !Array.isArray(parsedSelect)) {
      result.select = parsedSelect;
    }
  }
  else if (Array.isArray(params.select) && params.select.length > 0) {
    result.select = params.select.reduce(
      (acc, field) => {
        acc[field] = true;
        return acc;
      },
      {} as Record<string, boolean>,
    );
  }
  else if (params.include) {
    const parsedInclude = parseComplexParam(params.include);
    if (Array.isArray(parsedInclude) && parsedInclude.length > 0) {
      if (
        parsedInclude.some(
          item => typeof item === "string" && item.includes("."),
        )
      ) {
        result.include = buildNestedInclude(parsedInclude, includeDeleted, modelName);
      }
      else {
        result.include = parsedInclude.reduce(
          (acc, field) => {
            acc[field] = applyDeletedAtFilter(true, includeDeleted, modelName, field);
            return acc;
          },
          {} as Record<string, any>,
        );
      }
    }
    else if (parsedInclude && typeof parsedInclude === "object" && !Array.isArray(parsedInclude)) {
      result.include = parsedInclude;
    }
  }
}

export function buildQuery(params: IQueryParams<any>, searchFields?: Array<string | { field: string; weight: number }>, includeDeleted?: boolean | "only", modelName?: string): IQueryBuilderResult {
  const page = typeof params.page === "string" ? Number.parseInt(params.page, 10) : (params.page || 1);
  const result: IQueryBuilderResult = {
    where: {},
    page,
  };

  if (params.limit !== undefined) {
    result.take = typeof params.limit === "string" ? Number.parseInt(params.limit, 10) : params.limit;
    result.skip = (page - 1) * result.take;
  }

  const normalizedSearch = normalizeSearchFields(searchFields);

  if (params.search && normalizedSearch.length > 0) {
    result.where.OR = buildSearchWhere(params.search, normalizedSearch, modelName);
    const searchOrder = resolveSearchOrdering(params.sort, normalizedSearch);
    if (searchOrder)
      result.orderBy = searchOrder;
  }

  if (params.filter) {
    let filterObj: any = {};
    if (typeof params.filter === "string") {
      try {
        filterObj = JSON.parse(params.filter);
      }
      catch (error) {
        if (!__test__) {
          logger.warn("Invalid filter format:", error);
        }
      }
    }
    else if (typeof params.filter === "object") {
      filterObj = params.filter;
    }

    const processedFilter: any = {};
    Object.keys(filterObj).forEach((key) => {
      let value = filterObj[key];

      if (value === "true") {
        value = true;
      }
      else if (value === "false") {
        value = false;
      }

      if (key.includes(".")) {
        const parts = key.split(".");
        let current = processedFilter;

        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) {
            current[parts[i]] = {};
          }
          current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = processFilterValue(value);
      }
      else {
        processedFilter[key] = processFilterValue(value);
      }
    });

    result.where = { ...result.where, ...processedFilter };
  }

  if (params.dateFrom || params.dateTo) {
    result.where.createdAt = result.where.createdAt || {};
    if (params.dateFrom)
      result.where.createdAt.gte = new Date(params.dateFrom);
    if (params.dateTo)
      result.where.createdAt.lte = new Date(params.dateTo);
  }

  if (params.sort) {
    const order = params.order || "asc";

    if (params.sort.includes(".")) {
      const parts = params.sort.split(".");
      const orderBy: any = {};
      let current = orderBy;

      for (let i = 0; i < parts.length - 1; i++) {
        current[parts[i]] = {};
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = order;

      result.orderBy = orderBy;
    }
    else {
      result.orderBy = { [params.sort]: order };
    }
  }

  buildSelectOrInclude(params, result, includeDeleted, modelName);

  return result;
}
