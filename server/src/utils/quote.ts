export interface IQuoteService {
  // headers
  createQuoteHeader(data: IQuoteHeader): Promise<IQuoteHeader>;
  getQuoteHeader(id: string): Promise<IQuoteHeader>;
  getQuoteHeaders(params: IQueryParams): Promise<IQuoteHeader[]>;
  updateQuoteHeader(id: string, data: IQuoteHeader): Promise<IQuoteHeader>;
  deleteQuoteHeader(id: string): Promise<void>;

  // details
  createQuoteDetail(data: IQuoteDetail): Promise<IQuoteDetail>;
  getQuoteDetail(id: string): Promise<IQuoteDetail>;
  getQuoteDetails(params: IQueryParams): Promise<IQuoteDetail[]>;
  updateQuoteDetail(id: string, data: IQuoteDetail): Promise<IQuoteDetail>;
  deleteQuoteDetail(id: string): Promise<void>;

  // items
  createQuoteItem(data: IQuoteItem): Promise<IQuoteItem>;
  getQuoteItem(id: string): Promise<IQuoteItem>;
  getQuoteItems(params: IQueryParams): Promise<IQuoteItem[]>;
  updateQuoteItem(id: string, data: IQuoteItem): Promise<IQuoteItem>;
  deleteQuoteItem(id: string): Promise<void>;

  // audit (global)
  createChangeLog(data: IChangeLog): Promise<IChangeLog>;
  getChangeLogs(params: IQueryParams): Promise<IChangeLog[]>;
  getChangeLog(id: string): Promise<IChangeLog>;
  updateChangeLog(id: string, data: IChangeLog): Promise<IChangeLog>;
  deleteChangeLog(id: string): Promise<void>;

  // business logic
  createNewRevision(
    quoteHeaderId: string,
    notes?: string
  ): Promise<IQuoteDetail>;
  copyQuote(
    quoteHeaderId: string,
    newQuoteData: Partial<IQuoteHeader>
  ): Promise<IQuoteHeader>;
  changeQuoteStatus(
    quoteDetailId: string,
    status: QuoteStatus
  ): Promise<IQuoteDetail>;

  getQuoteWithCurrentRevision(quoteHeaderId: string): Promise<IQuoteFull>;
  getQuoteHistory(quoteHeaderId: string): Promise<IQuoteDetail[]>;
  getQuotesByRsm(rsmId: string): Promise<IQuoteHeader[]>;
  getQuotesByCustomer(customerId: string): Promise<IQuoteHeader[]>;
  getQuotesByDealer(dealerId: string): Promise<IQuoteHeader[]>;

  addConfigurationToQuote(
    quoteDetailId: string,
    configurationId: string
  ): Promise<IQuoteItem[]>;
  createConfigurationFromQuote(
    quoteDetailId: string,
    configName: string
  ): Promise<IConfiguration>;
}

export interface IProductConfigurationService {
  // Product Classes
  createProductClass(data: IProductClass): Promise<IProductClass>;
  getProductClasses(params: IQueryParams): Promise<IProductClass[]>;
  // ... CRUD methods

  // Option Categories
  createOptionCategory(data: IOptionCategory): Promise<IOptionCategory>;
  getOptionCategoriesForProduct(
    productClassId: string
  ): Promise<IOptionCategory[]>;
  // ... CRUD methods

  // Options
  createOption(data: IOption): Promise<IOption>;
  getOptionsForCategory(categoryId: string): Promise<IOption[]>;
  // ... CRUD methods

  // Rules
  createOptionRule(data: IOptionRule): Promise<IOptionRule>;
  validateConfiguration(
    productClassId: string,
    selectedOptions: string[]
  ): Promise<IValidationResult>;

  // Configurations
  createConfiguration(data: IConfiguration): Promise<IConfiguration>;
  getConfigurations(params: IQueryParams): Promise<IConfiguration[]>;
  calculateConfigurationPrice(selectedOptions: string[]): Promise<number>;

  // Business Logic
  getDefaultConfiguration(productClassId: string): Promise<IConfiguration>;
}

enum QuoteStatus {
  DRAFT = "DRAFT",
  SENT = "SENT",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
}

export enum LeadSource {
  TRADE_SHOW = "TRADE_SHOW",
  REFERRAL = "REFERRAL",
  WEBSITE = "WEBSITE",
  COLD_OUTREACH = "COLD_OUTREACH",
  EXISTING_CUSTOMER = "EXISTING_CUSTOMER",
  OTHER = "OTHER",
}

export interface IItem extends IBaseEntity {
  itemNumber: string;
  description: string;
  unitOfMeasure: string;
  unitPrice: number;
  category?: string;
}

export interface IBaseEntity {
  id: string;
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
}

// ProducedBy vs CreateInit ?

// qdata
export interface IQuoteHeader extends IBaseEntity {
  quoteYear: string;
  quoteNumber: string;
  rsmId: string;
  customerId: string;
  customerContactId?: string; // default to primary contact
  customerAddressId?: string; // default to primary address
  dealerId: string;
  dealerContactId?: string; // default to primary contact
  dealerAddressId?: string; // default to primary address
  source: LeadSource;
  priority: number;
  image?: string;
}

// qrev
export interface IQuoteDetail extends IBaseEntity {
  quoteHeaderId: string;
  revision: string;
  status: QuoteStatus;
  notes: string;
  subtotal: number;
  taxAmount?: number;
  totalAmount: number;
  currency: string;
}

export interface IQuoteItem extends IBaseEntity {
  quoteDetailId: string;
  itemId: string;
  quantity: number;
  unitPrice: number;
  displayOrder: number;
}

export interface IQuoteFull {
  header: IQuoteHeader;
  currentRevision: IQuoteDetail;
  items: IQuoteItem[];
}

export interface IProductClass extends IBaseEntity {
  name: string;
  description?: string;
  image?: string;
  parentId?: string | null;
  isActive: boolean;
}

export interface IOptionCategory extends IBaseEntity {
  name: string;
  description?: string;
  isRequired: boolean;
  allowMultiple: boolean;
  productClassIds: string[];
  displayOrder: number;
  isActive: boolean;
}

export interface IOption extends IBaseEntity {
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  displayOrder: number;
  isStandard: boolean;
  isActive: boolean;
}

export interface IOptionRule {}

export interface IConfiguration extends IBaseEntity {
  name: string;
  description: string;
  productClassId: string;
  selectedOptions: string[];
  isTemplate: boolean;
  isActive: boolean;
}

export interface IQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
  filter?: string | Record<string, any>;
  dateFrom?: string | Date;
  dateTo?: string | Date;
  fields?: string[];
  include?: string[];
}

export interface IChangeLog {
  id: string;
  module: string; // quote, order, invoice, etc.
  entityType: string; // quoteHeader, quoteDetail, quoteItem
  entityId: string;
  changeType: string; // create, update, delete
  changedFrom: string;
  changedTo: string;
  changedBy: string;
  timestamp: Date;
}

export interface IValidationResult {
  isValid: boolean;
  errorMessage?: string;
}
