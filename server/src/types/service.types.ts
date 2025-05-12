import { IApiResponse, IQueryParams } from "./api.types";
import { IAuthResponse, ICustomer, IEmployee } from "./schema.types";

export interface IAuthService {
  login(): Promise<IAuthResponse>;
  logout(): Promise<IAuthResponse>;
  validateSession(
    sessionId: string,
    authSession: string
  ): Promise<IAuthResponse>;
  handleMicrosoftCallback(
    code: string,
    sessionId: string
  ): Promise<IAuthResponse>;
  getAuthUrl(sessionId: string): Promise<string>;
  getSession(user: any): Promise<IAuthResponse>;
}

export interface IEmployeeService {
  getEmployees(params?: IQueryParams): Promise<IApiResponse<IEmployee[]>>;
  getEmployee(id: string): Promise<IApiResponse<IEmployee>>;
  createEmployee(employee: IEmployee): Promise<IApiResponse<IEmployee>>;
  updateEmployee(
    id: string,
    employee: IEmployee
  ): Promise<IApiResponse<IEmployee>>;
  deleteEmployee(id: string): Promise<IApiResponse<boolean>>;
}

export interface ICustomerService {
  getCustomers(params?: IQueryParams): Promise<IApiResponse<ICustomer[]>>;
  getCustomer(id: string): Promise<IApiResponse<ICustomer>>;
  createCustomer(customer: ICustomer): Promise<IApiResponse<ICustomer>>;
  updateCustomer(
    id: string,
    customer: ICustomer
  ): Promise<IApiResponse<ICustomer>>;
  deleteCustomer(id: string): Promise<IApiResponse<boolean>>;
}

export interface IMachineService {}

export interface IMachineDataService {}

export interface IMachineStateService {}

export interface IMachineAlarmService {}

export interface ICatalogService {}

export interface IQuoteService {}
