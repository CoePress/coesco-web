declare global {
  interface Window {
    google: {
      maps: {
        places: {
          AutocompleteService: new () => {
            getPlacePredictions: (
              request: { input: string; types: string[] },
              callback: (predictions: any[], status: string) => void
            ) => void;
          };
          PlacesService: new (div: HTMLElement) => {
            getDetails: (
              request: { placeId: string; fields: string[] },
              callback: (place: any, status: string) => void
            ) => void;
          };
          PlacesServiceStatus: {
            OK: string;
            ZERO_RESULTS: string;
          };
        };
        Map: new (element: HTMLElement, options: any) => any;
        Marker: new (options: any) => any;
        InfoWindow: new (options: any) => any;
        SymbolPath: {
          CIRCLE: number;
        };
      };
    };
    trackingInterval: ReturnType<typeof setInterval> | null;
  }
}

export interface IBaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductClass extends IBaseEntity {
  name: string;
  description?: string;
  image?: string;
  parentId?: string | null;
  depth: number;
  status: "ACTIVE" | "INACTIVE";
}

export interface OptionCategory extends IBaseEntity {
  name: string;
  description?: string;
  isRequired: boolean;
  allowMultiple: boolean;
  displayOrder: number;
  productClassIds: string[];
}

export interface Option extends IBaseEntity {
  name: string;
  description?: string;
  price: number;
  isStandard: boolean;
  allowQuantity: boolean;
  quantityMin?: number;
  quantityMax?: number;
  displayOrder: number;
  categoryId: string;
  productClassIds?: string[];
}

export interface SelectedOption {
  optionId: string;
  quantity: number;
}

export type RuleCondition
  = | InputCondition
    | SimpleCondition
    | AndCondition
    | OrCondition
    | NotCondition;

export interface InputCondition {
  type: "INPUT";
  fieldId: string;
  operator: ComparisonOperator;
  value: InputValue;
}

export interface SimpleCondition {
  type: "SIMPLE";
  conditionType: "OPTION" | "PRODUCT_CLASS";
  id: string;
  state?: "SELECTED" | "NOT_SELECTED";
}

export interface AndCondition {
  type: "AND";
  conditions: RuleCondition[];
}

export interface OrCondition {
  type: "OR";
  conditions: RuleCondition[];
}

export interface NotCondition {
  type: "NOT";
  condition: RuleCondition;
}

export enum RuleAction {
  DISABLE = "DISABLE",
  REQUIRE = "REQUIRE",
}

export enum ComparisonOperator {
  GREATER_THAN = ">",
  GREATER_THAN_OR_EQUAL = ">=",
  LESS_THAN = "<",
  LESS_THAN_OR_EQUAL = "<=",
  EQUAL = "==",
  NOT_EQUAL = "!=",
}

export type InputValue = string | number | boolean;

export enum EmployeeRole {
  INACTIVE = "INACTIVE",
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  EMPLOYEE = "EMPLOYEE",
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

export interface IApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface IQueryParams<T> {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  filter?: Partial<T> | string;
  search?: string;
  searchFields?: Array<keyof T>;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  include?: string[] | Record<string, any> | string;
  select?: string[] | Record<string, any> | string;
}

export enum MachineType {
  LATHE = "LATHE",
  MILL = "MILL",
}

export interface IStateDistribution {
  state: string;
  total: number;
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
  kpis: any[];
  utilization: any[];
  states: IStateDistribution[];
  machines: IOverviewMachine[];
  alarms: IOverviewAlarm[];
}

export interface IMachineTimeline {
  startDate: Date;
  endDate: Date;
  machines: IOverviewMachine[];
}

export interface IAuditLog extends IBaseEntity {
  model: string;
  recordId: string;
  changedBy: string;
  diff: any;
}
