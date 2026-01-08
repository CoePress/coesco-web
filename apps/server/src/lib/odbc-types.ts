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

export interface ColumnSchema {
  name: string;
  dataType: string;
  extent: number;
  format: string;
  label: string;
  mandatory: boolean;
  order: number;
  initialValue: string | null;
  description: string | null;
}

export interface TableSchema {
  name: string;
  description: string | null;
  columns: ColumnSchema[];
}

export interface DatabaseSchema {
  database: DatabaseName;
  extractedAt: string;
  tables: TableSchema[];
}

export interface BatchResult<T = Record<string, unknown>> {
  records: T[];
  hasMore: boolean;
  nextOffset: number;
  totalCount?: number;
}

export interface IdMapEntry {
  database: DatabaseName;
  table: string;
  ids: Array<{
    field: string;
    type: "uuid" | "int";
  }>;
}
