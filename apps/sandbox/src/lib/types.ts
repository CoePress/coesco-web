export interface QueryParams<
  TFilter extends Record<string, unknown> = Record<string, unknown>,
  TSortField extends string = string
> {
  page?: number;
  pageSize?: number;
  q?: string;
  sortBy?: TSortField;
  sortDir?: "asc" | "desc";
  filter?: Partial<TFilter>;
}
