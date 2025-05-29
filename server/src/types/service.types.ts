import { IApiResponse, IQueryParams } from "./api.types";
import {
  ICustomer,
  IEmailTemplate,
  IEmployee,
  IInvoiceData,
  IMachine,
  IMachineOverview,
  IMachineStatus,
  IMachineTimeline,
  ISendEmailOptions,
} from "./schema.types";

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

export interface IEmailService {
  getTemplates(): Promise<IEmailTemplate[]>;
  getTemplate(slug: string): Promise<IEmailTemplate>;
  saveTemplate(template: IEmailTemplate): Promise<IEmailTemplate>;
  deleteTemplate(slug: string): Promise<boolean>;
  renderTemplate(slug: string, data: any): Promise<string>;
  generatePDF(
    slug: string,
    data: any,
    outputPath?: string
  ): Promise<Buffer | string>;
  sendEmail(options: ISendEmailOptions): Promise<boolean>;
  sendEmailWithPDF(
    options: ISendEmailOptions,
    pdfFilename: string
  ): Promise<boolean>;
  sendInvoiceEmail(
    to: string,
    invoiceData: IInvoiceData,
    options?: Partial<ISendEmailOptions>
  ): Promise<boolean>;
}

// export interface IQuoteService {

//   // Status Management
//   sendQuote(quoteHeaderId: string): Promise<IQuoteHeader>;
//   acceptQuote(quoteHeaderId: string): Promise<IQuoteHeader>;
//   rejectQuote(quoteHeaderId: string, reason?: string): Promise<IQuoteHeader>;
//   cancelQuote(quoteHeaderId: string): Promise<IQuoteHeader>;

//   // Bulk Operations
//   bulkCreateItems(
//     quoteDetailId: string,
//     items: Array<Omit<IQuoteItem, "id" | "quoteDetailsId">>
//   ): Promise<IQuoteItem[]>;

//   // Document Generation
//   generateQuotePDF(quoteHeaderId: string, detailId?: string): Promise<Blob>;
//   generateQuoteExcel(quoteHeaderId: string, detailId?: string): Promise<Blob>;

//   // Email Operations
//   sendQuoteEmail(quoteHeaderId: string, detailId?: string): Promise<void>;

// }
