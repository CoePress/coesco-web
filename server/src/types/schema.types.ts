export interface IBaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserType {
  INTERNAL = "INTERNAL",
  EXTERNAL = "EXTERNAL",
}

export enum EmployeeRole {
  INACTIVE = "INACTIVE",
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  EMPLOYEE = "EMPLOYEE",
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

export interface ICreateEmployeeDto
  extends Omit<IEmployee, "id" | "createdAt" | "updatedAt"> {}

export interface IEmployeeIncludes extends IEmployee {
  departments: IDepartment[];
  primaryDepartment: IDepartment;
  reportsTo?: IEmployee;
}

export enum CustomerStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PENDING = "PENDING",
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

export interface ICustomerIncludes extends ICustomer {
  primaryContact?: IContact;
  billingAddress?: IAddress;
  shippingAddress?: IAddress;
  contacts?: IContact[];
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

export enum ProductClassStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export interface IProductClass extends IBaseEntity {
  name: string;
  description?: string;
  image?: string;
  parentId?: string | null;
  status: ProductClassStatus;
}

export interface IOptionCategory extends IBaseEntity {
  name: string;
  description?: string;
  isRequired: boolean;
  allowMultiple: boolean;
  displayOrder: number;
  productClassIds: string[];
}

export interface IQuantityBounds {
  min: number;
  max: number;
}

export interface IOption extends IBaseEntity {
  name: string;
  description?: string;
  price: number;
  isStandard: boolean;
  allowQuantity: boolean;
  quantity?: IQuantityBounds;
  displayOrder: number;
  categoryId: string;
}

// Quote
export enum QuoteStatus {
  DRAFT = "DRAFT",
  SENT = "SENT",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
}

export interface IQuoteHeader {
  id: string;
  quoteNumber: string;
  quoteYear: string;
  customerId: string;
  dealerId: string;
  status: QuoteStatus;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IQuoteHeaderIncludes extends IQuoteHeader {
  customer?: ICustomer | ICustomerIncludes;
  dealer?: IDealer;
}

export interface IQuoteDetail extends IBaseEntity {
  quoteHeaderId: string;
  revision: string;
  status: string;
}

export interface IQuoteDetailIncludes extends IQuoteDetail {
  quoteHeader?: IQuoteHeader;
}

export enum ItemType {
  PRODUCT = "PRODUCT",
  MATERIAL = "MATERIAL",
  SERVICE = "SERVICE",
  DISCOUNT = "DISCOUNT",
}

export interface IQuoteItem {
  id: string;
  quoteDetailsId: string;
  itemType: ItemType;
  itemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface IQuoteItemIncludes extends IQuoteItem {
  item: string;
}

export enum MachineType {
  LATHE = "LATHE",
  MILL = "MILL",
}

export enum MachineControllerType {
  FANUC = "FANUC",
  SIEMENS = "SIEMENS",
  HAAS = "HAAS",
  MAZAK = "MAZAK",
  OKUMA = "OKUMA",
  OTHER = "OTHER",
}

export enum MachineConnectionType {
  MTCONNECT = "MTCONNECT",
  CUSTOM = "CUSTOM",
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

export enum MachineState {
  ACTIVE = "ACTIVE",
  IDLE = "IDLE",
  ALARM = "ALARM",
  MAINTENANCE = "MAINTENANCE",
  OFFLINE = "OFFLINE",
}

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
  endTime?: Date;
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

export enum FanucControllerMode {
  MDI = "MDI",
  MEM = "MEM",
  UNDEFINED = "****",
  EDIT = "EDIT",
  HND = "HND",
  JOG = "JOG",
  T_JOG = "T-JOG",
  T_HND = "T-HND",
  INC = "INC",
  REF = "REF",
  RMT = "RMT",
  UNAVAILABLE = "UNAVAILABLE",
}

export enum FanucExecutionMode {
  UNDEFINED = "****",
  STOP = "STOP",
  HOLD = "HOLD",
  STRT = "STRT",
  MSTR = "MSTR",
  UNAVAILABLE = "UNAVAILABLE",
}

export interface IMicrosoftUser {
  id: string;
  mail: string;
  givenName: string;
  surname: string;
  jobTitle: string;
  department: string;
}

export interface IEmailTemplate {
  slug: string;
  name: string;
  html: string;
  subject: string;
}

export interface ISendEmailOptions {
  templateId: string;
  to: string | string[];
  data: Record<string, any>;
  cc?: string[];
  bcc?: string[];
}
