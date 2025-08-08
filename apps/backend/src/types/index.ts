export interface IQueryParams<T> {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  filter?: Partial<T> | string;
  search?: string;
  searchFields?: Array<keyof T>;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  fields?: string[];
  include?: string[] | Record<string, any> | string;
  select?: string[] | Record<string, any> | string;
}

export interface IQueryBuilderResult {
  where: any;
  page: number;
  take?: number;
  skip?: number;
  orderBy?: any;
  select?: any;
  include?: any;
}

export interface IServiceResult<T> {
  success: boolean;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  error?: string;
}
