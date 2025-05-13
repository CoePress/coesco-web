export interface IApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface IQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
  filter?: string | Record<string, any>;
  dateFrom?: string | Date;
  dateTo?: string | Date;
  fields?: string[];
  include?: string[];
}

export interface IQueryBuilderResult {
  whereClause: any;
  orderClause: Record<string, "asc" | "desc">;
  page: number;
  offset?: number;
  limit?: number;
}
