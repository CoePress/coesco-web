import {
  CustomerStatus,
  EmployeeRole,
  MachineConnectionType,
  MachineControllerType,
  MachineState,
  MachineType,
} from "./enum.types";

export interface IBaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDepartment extends IBaseEntity {
  name: string;
  description?: string;
}

export interface IEmployee extends IBaseEntity {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle: string;
  departmentId?: string;
  microsoftId?: string;
  role: EmployeeRole;
  lastLogin?: Date;
}

export interface IEmployeeAttributes
  extends Omit<IEmployee, "createdAt" | "updatedAt"> {}

export interface IMicrosoftUser {
  id: string;
  mail: string;
  givenName: string;
  surname: string;
  jobTitle: string;
  department: string;
}

export interface ICustomer extends IBaseEntity {
  name: string;
  primaryContactId?: string;
  contactIds?: string[];
  billingAddressId: string;
  shippingAddressId?: string;
  status: CustomerStatus;
  notes?: string;
  tags?: string[];
}

export interface IContact extends IBaseEntity {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  company?: string;
  title?: string;
  notes?: string;
}

export interface IContactActivity extends IBaseEntity {
  contactId: string;
  activityType: string;
  activityDate: Date;
  activityDescription: string;
}

export interface IAddress extends IBaseEntity {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  countryCode: string;
}

export interface IDealer extends IBaseEntity {
  name: string;
  address: IAddress;
  phone: string;
  email: string;
  website: string;
  notes?: string;
}

export interface IMachine extends IBaseEntity {
  slug: string;
  name: string;
  type: MachineType;
  controllerType: MachineControllerType;
  controllerModel?: string;
  connectionType: MachineConnectionType;
  connectionHost?: string;
  connectionPort?: number;
  connectionUrl?: string;
}

export interface ICreateMachineDto
  extends Omit<IMachine, "id" | "createdAt" | "updatedAt"> {}

export interface IMachineStatus extends IBaseEntity {
  machineId: string;
  state: MachineState;
  execution: string;
  controller: string;
  program?: string;
  tool?: string;
  metrics?: {
    spindleSpeed?: number;
    feedRate?: number;
    axisPositions?: Record<string, number>;
  };
  alarmCode?: string;
  alarmMessage?: string;
  startTime: Date;
  endTime?: Date | null;
  duration?: number;
}

export interface IUtilization {
  label: string;
  start: Date;
  end: Date;
  utilization: number;
}

export interface IStateDistribution {
  state: string;
  duration: number;
  percentage: number;
}

export interface IOverviewMachine {
  id: string;
  name: string;
  type: MachineType;
}

export interface IOverviewAlarm {
  machineId: string;
  timestamp: Date;
  message: string;
}

export interface IMachineOverview {
  startDate: Date;
  endDate: Date;
  utilization: number;
  averageRuntime: number;
  alarmCount: number;
  utilizationOverTime: IUtilization[];
  stateDistribution: IStateDistribution[];
  machines: IOverviewMachine[];
  alarms: IOverviewAlarm[];
}

export interface IMachineTimeline {
  startDate: Date;
  endDate: Date;
  machines: IOverviewMachine[];
}

export interface IDateRange {
  duration: number;
  totalDays: number;
  startDate: Date;
  endDate: Date;
  previousStartDate: Date;
  previousEndDate: Date;
}

export interface ISentEmail extends IBaseEntity {
  template: string;
  data: any;
  to: string | string[];
  from?: string;
  subject?: string;
  status: EmailStatus;
}

export enum EmailStatus {
  SENT = "sent",
  FAILED = "failed",
}

export interface IEmailTemplate {
  slug: string;
  name: string;
  description?: string;
  subject?: string;
  html: string;
}

export interface IEmailAttachment {
  filename: string;
  content?: string | Buffer;
  path?: string;
  contentType?: string;
  cid?: string;
}

export interface ISendEmailOptions {
  template: string;
  data: any;
  to: string | string[];
  from?: string;
  subject?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: IEmailAttachment[];
}

export interface IInvoiceData {
  // Company details
  companyName: string;
  companyStreet: string;
  companyCity: string;
  companyState: string;
  companyZip: string;
  companyCountry: string;
  companyTaxId: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;

  // Invoice details
  invoiceNumber: string;
  invoiceDate: string;

  // Client details
  clientName: string;
  clientStreet: string;
  clientBuilding?: string;
  clientCity: string;
  clientState: string;
  clientZip: string;
  clientCountry: string;
  clientAccountNumber?: string;
  clientPurchaseOrder?: string;

  // Line items
  items: {
    id: string;
    description: string;
    material: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];

  // Totals
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalDue: number;

  // Payment methods
  wireTransfer?: {
    bank: string;
    accountName: string;
    accountNumber: string;
    routingNumber: string;
    swift?: string;
  };

  checkPayment?: {
    payableTo: string;
    mailingAddress: string;
  };

  // Contact information
  contactDepartment: string;
  contactEmail: string;
  contactPhone: string;

  // Optional payment URL
  payOnlineUrl?: string;
}
