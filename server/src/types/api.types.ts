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

export interface IQueryParams<T> {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  filter?: Partial<T>;
  search?: string;
  searchFields?: Array<keyof T>;
  fields?: string[];
  include?: string[];
}

export interface IQueryBuilderResult {
  where: any;
  orderBy: any;
  take?: number;
  skip?: number;
  select?: any;
  include?: any;
  page: number;
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

export interface IServiceResult<T> {
  success: boolean;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  error?: string;
  errors?: string[];
}

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
