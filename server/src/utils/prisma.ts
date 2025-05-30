import { __dev__ } from "@/config/config";
import { IQueryBuilderResult, IQueryParams } from "@/types/auth.types";
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
        return result;
      }
    } else if (typeof params.filter === "object") {
      filterObj = params.filter;
    }

    // Process nested filters
    const processFilter = (filter: any): any => {
      const processed: any = {};
      for (const [key, value] of Object.entries(filter)) {
        if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          processed[key] = value;
        } else {
          processed[key] = value;
        }
      }
      return processed;
    };

    // Merge with existing where clause
    result.where = { ...result.where, ...processFilter(filterObj) };
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
  const defaultSort = "createdAt";
  const defaultOrder = "desc";
  const sort = params.sort || defaultSort;
  const order = params.order || defaultOrder;
  result.orderBy = { [sort]: order };

  // Field selection
  if (params.fields && params.fields.length > 0) {
    result.select = params.fields.reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {} as Record<string, boolean>);
  }

  // Include relations
  if (params.include && params.include.length > 0) {
    result.include = params.include.reduce((acc, include) => {
      if (typeof include === "string") {
        // Handle nested includes (e.g., "customer.contacts")
        const parts = include.split(".");
        if (parts.length === 1) {
          acc[include] = true;
        } else {
          // Build nested structure
          let current = acc;
          for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) {
              current[parts[i]] = { include: {} };
            } else if (current[parts[i]] === true) {
              current[parts[i]] = { include: {} };
            }
            current = current[parts[i]].include;
          }
          current[parts[parts.length - 1]] = true;
        }
      }
      return acc;
    }, {} as Record<string, any>);
  }

  return result;
};
