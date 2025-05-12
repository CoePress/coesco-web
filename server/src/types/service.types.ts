import { IApiResponse, IQueryParams } from "./api.types";
import {
  IAuthResponse,
  ICustomer,
  IEmployee,
  IMachine,
  IMachineOverview,
  IMachineStatus,
  IMachineTimeline,
  IQuoteDetail,
  IQuoteHeader,
  IQuoteHeaderIncludes,
  IQuoteItem,
  QuoteStatus,
} from "./schema.types";

export interface IAuthService {
  login(email: string, password: string): Promise<IAuthResponse>;
  loginWithMicrosoft(): Promise<IAuthResponse>;
  callback(code: string, sessionId: string): Promise<IAuthResponse>;
  logout(sessionId: string): Promise<IAuthResponse>;
  session(sessionId: string, authSession: string): Promise<IAuthResponse>;
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

export interface IMachineService {
  getMachines(params?: IQueryParams): Promise<IApiResponse<IMachine[]>>;
  getMachine(id: string): Promise<IApiResponse<IMachine>>;
  createMachine(machine: IMachine): Promise<IApiResponse<IMachine>>;
  updateMachine(id: string, machine: IMachine): Promise<IApiResponse<IMachine>>;
  deleteMachine(id: string): Promise<IApiResponse<boolean>>;
}

export interface IMachineDataService {
  getMachineStatuses(
    params?: IQueryParams
  ): Promise<IApiResponse<IMachineStatus[]>>;
  getMachineStatus(id: string): Promise<IApiResponse<IMachineStatus>>;
  createMachineStatus(
    machineStatus: IMachineStatus
  ): Promise<IApiResponse<IMachineStatus>>;
  updateMachineStatus(
    id: string,
    machineStatus: IMachineStatus
  ): Promise<IApiResponse<IMachineStatus>>;
  deleteMachineStatus(id: string): Promise<IApiResponse<boolean>>;

  getMachineOverview(
    startDate: string,
    endDate: string
  ): Promise<IApiResponse<IMachineOverview>>;
  getMachineTimeline(
    startDate: string,
    endDate: string
  ): Promise<IApiResponse<IMachineTimeline>>;
}

export interface IQuoteService {
  // Quote Header Operations
  createQuoteHeader(
    quoteHeader: Omit<IQuoteHeader, "id" | "createdAt" | "updatedAt">
  ): Promise<IQuoteHeader>;
  getQuoteHeaders(params?: IQueryParams): Promise<IQuoteHeader[]>;
  getQuoteHeader(id: string): Promise<IQuoteHeader>;
  getQuoteHeaderWithIncludes(
    id: string,
    includes?: string[]
  ): Promise<IQuoteHeaderIncludes>;
  updateQuoteHeader(
    id: string,
    quoteHeader: Partial<IQuoteHeader>
  ): Promise<IQuoteHeader>;
  deleteQuoteHeader(id: string): Promise<void>;

  // Quote Detail Operations
  createQuoteDetail(
    quoteDetail: Omit<IQuoteDetail, "id">
  ): Promise<IQuoteDetail>;
  getQuoteDetails(
    quoteHeaderId: string,
    params?: IQueryParams
  ): Promise<IQuoteDetail[]>;
  getQuoteDetail(id: string): Promise<IQuoteDetail>;
  updateQuoteDetail(
    id: string,
    quoteDetail: Partial<IQuoteDetail>
  ): Promise<IQuoteDetail>;
  deleteQuoteDetail(id: string): Promise<void>;

  // Quote Item Operations
  createQuoteItem(quoteItem: Omit<IQuoteItem, "id">): Promise<IQuoteItem>;
  getQuoteItems(
    quoteDetailId: string,
    params?: IQueryParams
  ): Promise<IQuoteItem[]>;
  getQuoteItem(id: string): Promise<IQuoteItem>;
  updateQuoteItem(
    id: string,
    quoteItem: Partial<IQuoteItem>
  ): Promise<IQuoteItem>;
  deleteQuoteItem(id: string): Promise<void>;

  // Specialized Operations
  createQuoteRevision(quoteHeaderId: string): Promise<IQuoteDetail>;
  getLatestQuoteRevision(quoteHeaderId: string): Promise<IQuoteDetail>;
  getQuoteWithAllDetails(id: string): Promise<{
    header: IQuoteHeader;
    details: Array<{
      detail: IQuoteDetail;
      items: IQuoteItem[];
    }>;
  }>;

  // Status Management
  sendQuote(quoteHeaderId: string): Promise<IQuoteHeader>;
  acceptQuote(quoteHeaderId: string): Promise<IQuoteHeader>;
  rejectQuote(quoteHeaderId: string, reason?: string): Promise<IQuoteHeader>;
  cancelQuote(quoteHeaderId: string): Promise<IQuoteHeader>;

  // Bulk Operations
  bulkCreateItems(
    quoteDetailId: string,
    items: Array<Omit<IQuoteItem, "id" | "quoteDetailsId">>
  ): Promise<IQuoteItem[]>;

  // Document Generation
  generateQuotePDF(quoteHeaderId: string, detailId?: string): Promise<Blob>;
  generateQuoteExcel(quoteHeaderId: string, detailId?: string): Promise<Blob>;

  // Email Operations
  sendQuoteEmail(quoteHeaderId: string, detailId?: string): Promise<void>;

  // Search & Advanced Queries
  searchQuotes(searchParams: {
    customerIds?: string[];
    dealerIds?: string[];
    statuses?: QuoteStatus[];
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
  }): Promise<IQuoteHeader[]>;
}
