import type { Employee, User, UserRole } from "@prisma/client";

export type FilterOperator = "gte" | "gt" | "lte" | "lt" | "not" | "in" | "notIn" | "contains" | "startsWith" | "endsWith";

export type FilterValue<T = any>
  = | T
    | { [K in FilterOperator]?: T | T[] }
    | { AND?: FilterValue<T>[] }
    | { OR?: FilterValue<T>[] }
    | { NOT?: FilterValue<T> };

export interface IQueryParams<T> {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  filter?: Partial<Record<keyof T, FilterValue>> | string;
  search?: string;
  searchFields?: Array<keyof T>;
  dateFrom?: Date | string;
  dateTo?: Date | string;
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

export interface IApiKey {
  id: string;
  key: string;
  ownerId: string;
  name: string;
  createdAt: Date;
  expiresAt?: Date;
  scopes: string[];
}

export interface IAuth {
  id: string;
  email: string;
  password?: string;
  microsoftId?: string;
  userId: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuthAttributes
  extends Omit<IAuth, "createdAt" | "updatedAt"> {}

export interface IAuthResponse {
  token: string;
  refreshToken: string;
  sessionId?: string;
  user: User;
  employee: Employee | null;
}

export interface IAuthTokens {
  token: string;
  refreshToken: string;
}

export interface IDateRange {
  duration: number;
  totalDays: number;
  startDate: Date;
  endDate: Date;
  previousStartDate: Date;
  previousEndDate: Date;
}

export interface ITool {
  name: string;
  description: string;
  inputSchema: any;
  handler: (params: any) => Promise<any>;
}

export interface ISchema {
  name: string;
  description: string;
  schema: any;
}
