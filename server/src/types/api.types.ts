export interface IApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface IQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
  filter?: string;
  fields?: string[];
  include?: string[];
}

export interface IQueryBuilderResult {
  whereClause: any;
  orderClause: Array<[any, string]>;
  page: number;
  offset?: number;
  limit?: number;
}

export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IPaginatedApiResponse<T> extends IApiResponse<T> {
  pagination: IPaginationMeta;
}
