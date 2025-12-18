export type DatabaseName = "std" | "job" | "quote";

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  fields?: string;
}

export interface PaginatedResult<T = Record<string, unknown>> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FilterCondition {
  field?: string;
  operator: string;
  value?: unknown;
  values?: unknown[];
  conditions?: FilterCondition[];
}

export interface FilterParams {
  filters?: FilterCondition[];
  operator?: string;
}
