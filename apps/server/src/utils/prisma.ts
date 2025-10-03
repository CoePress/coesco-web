import { PrismaClient } from "@prisma/client";

import type { IQueryBuilderResult, IQueryParams } from "@/types";

export const prisma = new PrismaClient();

function normalizeSearchFields(searchFields?: Array<string | { field: string; weight: number }>) {
  return (searchFields || []).map(f =>
    typeof f === "string" ? { field: f, weight: 1 } : f,
  );
}

function buildSearchWhere(search: string, normalized: { field: string; weight: number }[]) {
  return normalized.map(({ field }) => ({
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
      console.error("Invalid JSON format:", error);
      return null;
    }
  }
  return param;
}

function buildNestedInclude(paths: string[]) {
  const result: any = {};
  paths.forEach((path) => {
    const parts = path.split(".");
    let current = result;
    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        if (!current[part] || current[part] === true) {
          current[part] = true;
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
      }
    });
  });
  return result;
}

function buildSelectOrInclude(params: IQueryParams<any>, result: IQueryBuilderResult) {
  if (params.select) {
    const parsedSelect = parseComplexParam(params.select);
    if (Array.isArray(parsedSelect)) {
      if (
        parsedSelect.some(
          item => typeof item === "string" && item.includes("."),
        )
      ) {
        result.select = buildNestedInclude(parsedSelect);
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
    else if (parsedSelect && typeof parsedSelect === "object") {
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
    if (Array.isArray(parsedInclude)) {
      if (
        parsedInclude.some(
          item => typeof item === "string" && item.includes("."),
        )
      ) {
        result.include = buildNestedInclude(parsedInclude);
      }
      else {
        result.include = parsedInclude.reduce(
          (acc, field) => {
            acc[field] = true;
            return acc;
          },
          {} as Record<string, boolean>,
        );
      }
    }
    else if (parsedInclude && typeof parsedInclude === "object") {
      result.include = parsedInclude;
    }
  }
}

export function buildQuery(params: IQueryParams<any>, searchFields?: Array<string | { field: string; weight: number }>): IQueryBuilderResult {
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
    result.where.OR = buildSearchWhere(params.search, normalizedSearch);
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
        console.error("Invalid filter format:", error);
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
      } else if (value === "false") {
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
        current[parts[parts.length - 1]] = value;
      } else {
        processedFilter[key] = value;
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
      let orderBy: any = {};
      let current = orderBy;

      for (let i = 0; i < parts.length - 1; i++) {
        current[parts[i]] = {};
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = order;

      result.orderBy = orderBy;
    } else {
      result.orderBy = { [params.sort]: order };
    }
  }

  buildSelectOrInclude(params, result);

  return result;
}
