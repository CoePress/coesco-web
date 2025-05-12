export interface IBaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Organization
enum EmployeeStatus {
  ACTIVE = "ACTIVE",
  ON_LEAVE = "ON_LEAVE",
  TERMINATED = "TERMINATED",
}

export interface IDepartment extends IBaseEntity {
  name: string;
  description?: string;
  leaderId?: string;
}

export interface IEmployee extends IBaseEntity {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  departmentIds: string[];
  primaryDepartmentId: string;
  reportsToId?: string;
  status: EmployeeStatus;
  microsoftId?: string;
  hiredAt: Date;
  terminatedAt?: Date;
}

export interface IEmployeeIncludes extends IEmployee {
  departments: IDepartment[];
  primaryDepartment: IDepartment;
  reportsTo?: IEmployee;
}

export interface IDealer extends IBaseEntity {
  name: string;
  address: IAddress;
  phone: string;
  email: string;
  website: string;
  notes?: string;
}

// Customer
enum CustomerType {
  INDIVIDUAL = "INDIVIDUAL",
  BUSINESS = "BUSINESS",
}

enum CustomerStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PENDING = "PENDING",
}

export interface ICustomer extends IBaseEntity {
  name: string;
  type: CustomerType;
  primaryContactId?: string;
  contactIds?: string[];
  billingAddressId: string;
  shippingAddressId?: string;
  taxId?: string;
  paymentTerms?: string;
  creditLimit?: number;
  customerSince: Date;
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

// Catalog
enum ProductClassStatus {
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
enum QuoteStatus {
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

enum ItemType {
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

// Misc
export interface IQueryParams {
  page?: number;
  limit?: number;
  offset?: number;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
  filter?: string | Record<string, any>;
  dateFrom?: string | Date;
  dateTo?: string | Date;
  fields?: string[];
  include?: string[];
}

// Services
export interface IEmployeeService {
  createEmployee(employee: IEmployee): Promise<IEmployee>;
  getEmployees(params?: IQueryParams): Promise<IEmployee[]>;
  getEmployee(id: string): Promise<IEmployee>;
  updateEmployee(id: string, employee: IEmployee): Promise<IEmployee>;
  deleteEmployee(id: string): Promise<void>;
}

export interface ICustomerService {
  createCustomer(customer: ICustomer): Promise<ICustomer>;
  getCustomers(params?: IQueryParams): Promise<ICustomer[]>;
  getCustomer(id: string): Promise<ICustomer>;
  updateCustomer(id: string, customer: ICustomer): Promise<ICustomer>;
  deleteCustomer(id: string): Promise<void>;
}

export interface IDealerService {
  createDealer(dealer: IDealer): Promise<IDealer>;
  getDealers(params?: IQueryParams): Promise<IDealer[]>;
  getDealer(id: string): Promise<IDealer>;
  updateDealer(id: string, dealer: IDealer): Promise<IDealer>;
  deleteDealer(id: string): Promise<void>;
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
