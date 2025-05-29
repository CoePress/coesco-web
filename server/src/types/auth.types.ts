import { ICustomer, IEmployee } from "@/types/schema.types";
import { UserType } from "@/types/enum.types";

export interface IAuth {
  id: string;
  email: string;
  password?: string;
  microsoftId?: string;
  userId: string;
  userType: UserType;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuthIncludes extends IAuth {
  employee?: IEmployee;
  customer?: ICustomer;
}

export interface IAuthAttributes
  extends Omit<IAuth, "createdAt" | "updatedAt"> {}

export interface IAuthResponse {
  token: string;
  refreshToken: string;
  userType: UserType;
  user: IEmployee | ICustomer;
}

export interface IAuthTokens {
  token: string;
  refreshToken: string;
}

export interface IAuthService {
  login(email: string, password: string): Promise<IAuthResponse>;
  loginWithMicrosoft(): Promise<string>;
  callback(code: string, sessionId: string): Promise<IAuthResponse>;
  session(sessionId: string, authSession: string): Promise<IAuthResponse>;
}

export interface IQueryParams<T> {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  filter?: Partial<T>;
  search?: string;
  searchFields?: Array<keyof T>;
  dateFrom?: Date;
  dateTo?: Date;
  fields?: string[];
  include?: string[];
}

export interface IQueryBuilderResult {
  where: any;
  orderBy?: any;
  take?: number;
  skip?: number;
  select?: any;
  include?: any;
  page: number;
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
