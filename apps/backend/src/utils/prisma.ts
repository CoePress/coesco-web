import { PrismaClient } from "prisma/generated/prisma";

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
        current[part] = true;
      }
      else {
        current[part] ??= { include: {} };
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
  else if (Array.isArray(params.fields) && params.fields.length > 0) {
    result.select = params.fields.reduce(
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
  const result: IQueryBuilderResult = {
    where: {},
    page: params.page || 1,
  };

  if (params.limit !== undefined) {
    result.take = params.limit;
    result.skip = ((result.page || 1) - 1) * result.take;
  }

  const normalizedSearch = normalizeSearchFields(searchFields);

  if (params.search && normalizedSearch.length > 0) {
    result.where.OR = buildSearchWhere(params.search, normalizedSearch);
    const searchOrder = resolveSearchOrdering(params.sort, normalizedSearch);
    if (searchOrder)
      result.orderBy = searchOrder;
  }

  if (params.filter) {
    let filterObj = {};
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
    result.where = { ...result.where, ...filterObj };
  }

  if (params.dateFrom || params.dateTo) {
    result.where.createdAt = result.where.createdAt || {};
    if (params.dateFrom)
      result.where.createdAt.gte = new Date(params.dateFrom);
    if (params.dateTo)
      result.where.createdAt.lte = new Date(params.dateTo);
  }

  const sort = params.sort || "createdAt";
  const order = params.order || "desc";
  result.orderBy ??= { [sort]: order };

  buildSelectOrInclude(params, result);

  return result;
}
