import { ICustomer, IEmployee } from "./schema.types";

export enum UserType {
  EMPLOYEE = "employee",
  CUSTOMER = "customer",
}

export interface IAuth {
  id: string;
  email: string;
  password: string;
  microsoftId?: string;
  userId: string;
  userType: UserType;
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: Date;
  refreshToken?: string;
  sessionId?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
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
  logout(sessionId: string): Promise<IAuthResponse>;
  session(sessionId: string, authSession: string): Promise<IAuthResponse>;
}
