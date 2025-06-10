export interface IApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export type IQueryParams<T> = {
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
};

export interface IQueryBuilderResult {
  where: any;
  page: number;
  take?: number;
  skip?: number;
  orderBy?: any;
  select?: any;
  include?: any;
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

export type IServiceResult<T> = {
  success: boolean;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  error?: string;
};

import { Employee, User, UserRole } from "@prisma/client";

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
  user: User;
  employee: Employee;
}

export interface IAuthTokens {
  token: string;
  refreshToken: string;
}
