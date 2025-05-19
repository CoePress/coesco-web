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
