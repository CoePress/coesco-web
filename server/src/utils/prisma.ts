import { __dev__ } from "@/config/config";
import { IQueryBuilderResult, IQueryParams } from "@/types/api.types";
import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: __dev__ ? ["error"] : [],
  });

if (__dev__) {
  global.prisma = prisma;
}

export const buildQuery = (
  params: IQueryParams<any>,
  searchFields?: string[]
): IQueryBuilderResult => {
  const result: IQueryBuilderResult = {
    where: {},
    page: params.page || 1,
  };

  // Pagination
  if (params.limit !== undefined) {
    result.take = params.limit;
    result.skip = ((result.page || 1) - 1) * result.take;
  }

  // Search functionality
  if (params.search && searchFields && searchFields.length > 0) {
    result.where.OR = searchFields.map((field) => ({
      [field]: { contains: params.search, mode: "insensitive" },
    }));
  }

  // Filter handling
  if (params.filter) {
    let filterObj = {};

    if (typeof params.filter === "string") {
      try {
        filterObj = JSON.parse(params.filter);
      } catch (error) {
        console.error("Invalid filter format:", error);
      }
    } else if (typeof params.filter === "object") {
      filterObj = params.filter;
    }

    result.where = { ...result.where, ...filterObj };
  }

  // Date range filtering
  if (params.dateFrom || params.dateTo) {
    result.where.createdAt = result.where.createdAt || {};

    if (params.dateFrom) {
      const dateFrom =
        params.dateFrom instanceof Date
          ? params.dateFrom
          : new Date(params.dateFrom);
      result.where.createdAt.gte = dateFrom;
    }

    if (params.dateTo) {
      const dateTo =
        params.dateTo instanceof Date ? params.dateTo : new Date(params.dateTo);
      result.where.createdAt.lte = dateTo;
    }
  }

  // Sorting
  const sort = params.sort || "createdAt";
  const order = params.order || "desc";
  result.orderBy = { [sort]: order };

  // Helper function to convert dot notation to nested objects
  const buildNestedInclude = (paths: string[]) => {
    const result: any = {};

    paths.forEach((path) => {
      const parts = path.split(".");
      let current = result;

      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          // If this is the last part and we already have this path as a simple include
          if (current[part] === true) {
            // Convert it to a nested include
            current[part] = { include: {} };
          } else if (!current[part]) {
            current[part] = true;
          }
        } else {
          // If we have a simple include, convert it to a nested one
          if (current[part] === true) {
            current[part] = { include: {} };
          }
          // If we don't have this path yet, create it
          if (!current[part]) {
            current[part] = { include: {} };
          }
          // If we have the path but no include, add it
          if (!current[part].include) {
            current[part].include = {};
          }
          current = current[part].include;
        }
      });
    });

    return result;
  };

  // Helper function to parse complex JSON params
  const parseComplexParam = (param: any) => {
    if (typeof param === "string") {
      try {
        return JSON.parse(param);
      } catch (error) {
        console.error("Invalid JSON format:", error);
        return null;
      }
    }
    return param;
  };

  // Handle select vs include conflict - select takes precedence
  if (params.select) {
    const parsedSelect = parseComplexParam(params.select);

    if (Array.isArray(parsedSelect)) {
      // Check if it's dot notation paths
      if (
        parsedSelect.some(
          (item) => typeof item === "string" && item.includes(".")
        )
      ) {
        result.select = buildNestedInclude(parsedSelect);
      } else {
        result.select = parsedSelect.reduce((acc, field) => {
          acc[field] = true;
          return acc;
        }, {} as Record<string, boolean>);
      }
    } else if (parsedSelect && typeof parsedSelect === "object") {
      result.select = parsedSelect;
    }
  } else if (params.fields && params.fields.length > 0) {
    result.select = params.fields.reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {} as Record<string, boolean>);
  } else if (params.include) {
    const parsedInclude = parseComplexParam(params.include);

    if (Array.isArray(parsedInclude)) {
      // Check if it's dot notation paths
      if (
        parsedInclude.some(
          (item) => typeof item === "string" && item.includes(".")
        )
      ) {
        result.include = buildNestedInclude(parsedInclude);
      } else {
        result.include = parsedInclude.reduce((acc, include) => {
          acc[include] = true;
          return acc;
        }, {} as Record<string, boolean>);
      }
    } else if (parsedInclude && typeof parsedInclude === "object") {
      result.include = parsedInclude;
    }
  }

  return result;
};
