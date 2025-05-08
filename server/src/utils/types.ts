import { Request } from "express";

// User
export interface IUser {
  id: string;
  microsoftId: string;
  name: string;
  email: string;
  department: string;
  role: string;
  isActive: boolean;
  receivesReports: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateUserDTO {
  microsoftId: string;
  name: string;
  email: string;
  department?: string;
  role: "admin" | "user";
  isActive: boolean;
  receivesReports: boolean;
  lastLogin?: Date;
}

export interface IUpdateUserDTO extends Partial<ICreateUserDTO> {}

export interface IMicrosoftUser {
  id: string;
  mail: string;
  givenName: string;
  surname: string;
  jobTitle: string;
  department: string;
}

export interface ILoginResponse {
  url: string;
  sessionId: string;
}

export interface ISessionResponse {
  user: IUser;
  authenticated: boolean;
}

export interface IAuthRequest extends Request {
  user: IUser;
}

export interface IAuthResult {
  user: IUser;
  token: string;
}

export type AllowedRoles = IUser["role"][];

export interface IPermission {
  roles?: AllowedRoles;
  customCheck?: (user: IUser) => boolean;
}

export interface ISessionData {
  verifier: string;
  challenge: string;
  attempts: number;
  lastAttempt: number;
}

export interface ISyncResult {
  success: {
    created: string[];
    updated: string[];
    destroyed: string[];
  };
  failures: Array<{
    userId: string;
    operation: string;
    error: string;
    user?: any;
  }>;
}

// Machine
export type MachineType = "LATHE" | "MILL";
export type MachineController = "MAZAK" | "FANUC";

export interface IMachine {
  id: string;
  slug: string;
  name: string;
  type: MachineType;
  controller: MachineController;
  controllerModel: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateMachineDTO {
  slug: string;
  name: string;
  type: MachineType;
  controller: MachineController;
  controllerModel: string;
}

export interface IUpdateMachineDTO {
  name?: string;
  type?: MachineType;
  controller?: MachineController;
  controllerModel?: string;
}

// Machine Connection
export type MachineConnectionProtocol = "MTCONNECT" | "CUSTOM";
export type MachineConnectionStatus = "CONNECTED" | "DISCONNECTED" | "ERROR";

export interface IMachineConnection {
  id: string;
  machineId: string;
  machineSlug: string;
  protocol: MachineConnectionProtocol;
  host: string;
  port: number;
  path?: string;
  status: MachineConnectionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateMachineConnectionDTO {
  machineSlug: string;
  protocol: MachineConnectionProtocol;
  host: string;
  port: number;
  path?: string;
}

// Machine State

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

export interface IMachineState {
  id: string;
  machineId: string;
  state: string;
  execution: string;
  controller: string;
  program: string;
  startTime: Date; // When the state started
  endTime: Date | null; // When the state ended (null if still active)
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateMachineStateDTO {
  machineId: string;
  state: string;
  execution: string;
  controller: string;
  program: string;
  startTime: Date;
  endTime: Date | null;
}

export interface IStateOverview {
  kpis: {
    [key: string]: {
      value: number;
      change: number;
    };
  };
  utilization: {
    label: string;
    start: Date;
    end: Date;
    utilization: number;
  }[];
  states: {
    state: string;
    total: number;
    percentage: number;
  }[];
  machines: {
    id: string;
    name: string;
  }[];
  alarms: {
    id: string;
    machineId: string;
    timestamp: Date;
    type: string;
    severity: string;
    message?: string;
  }[];
}

export interface IStateTimeline {
  startDate: Date;
  endDate: Date;
  machines: {
    id: string;
    name: string;
    timeline: {
      timestamp: Date;
      state: string;
      durationMs: number;
    }[];
  }[];
}

// Machine Alarm
export interface IMachineAlarm {
  id: string;
  machineId: string;
  timestamp: Date;
  type: string;
  severity: string;
  message?: string;
  resolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateMachineAlarmDTO {
  machineId: string;
  timestamp: Date;
  type: string;
  severity: string;
  message?: string;
}

// Config
export type ConfigValueType = string | number | boolean | object | null;

export interface IConfigValue {
  id: string | number;
  key: string;
  type: string;
  value: ConfigValueType;
  parentId?: string | number;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Services
export interface IAuthService {
  login(): Promise<ILoginResponse>;
  validateSession(sessionId: string, authSession: string): Promise<boolean>;
  handleMicrosoftCallback(
    code: string,
    sessionId: string
  ): Promise<IAuthResult>;
  getAuthUrl(sessionId: string): Promise<string>;
  getSession(user: IUser): Promise<ISessionResponse>;
  logout(): Promise<{ message: string }>;
}

export interface IUserService {
  initialize(): Promise<void>;
  createUser(data: ICreateUserDTO): Promise<IUser>;
  getUsers(params?: IQueryParams): Promise<IUser[]>;
  getReportSubscribers(): Promise<IUser[]>;
  getUserById(id: string): Promise<IUser>;
  getUserByMicrosoftId(microsoftId: string): Promise<IUser>;
  updateUser(id: string, data: IUpdateUserDTO): Promise<IUser>;
  syncMicrosoftUsers(): Promise<ISyncResult>;
}

export interface IMachineService {
  createMachine(data: ICreateMachineDTO): Promise<IMachine>;
  getMachines(type?: MachineType): Promise<IMachine[]>;
  getMachine(id: string): Promise<IMachine | null>;
  getMachineBySlug(slug: string): Promise<IMachine | null>;
  updateMachine(id: string, data: IUpdateMachineDTO): Promise<IMachine>;
  deleteMachine(id: string): Promise<boolean>;
}

export interface IConnectionService {
  initialize(): Promise<void>;
  createConnection(
    connection: ICreateMachineConnectionDTO
  ): Promise<IMachineConnection>;
  getConnections(): Promise<IMachineConnection[]>;
  getConnection(id: string): Promise<IMachineConnection | null>;
  getConnectionByMachineId(
    machineId: string
  ): Promise<IMachineConnection | null>;
  updateConnectionStatus(
    id: string,
    status: MachineConnectionStatus
  ): Promise<IMachineConnection>;
}

export interface IStateService {
  getStates(params?: IQueryParams): Promise<IPaginatedResponse<IMachineState>>;
  getState(id: string): Promise<IMachineState>;
  getStateOverview(startDate: string, endDate: string): Promise<IStateOverview>;
  getStateTimeline(startDate: string, endDate: string): Promise<IStateTimeline>;
  createState(stateData: ICreateMachineStateDTO): Promise<IMachineState>;
  updateState(
    id: string,
    stateData: Partial<ICreateMachineStateDTO>
  ): Promise<IMachineState>;
  deleteState(id: string): Promise<boolean>;
}

export interface IAlarmService {
  createAlarm(alarm: ICreateMachineAlarmDTO): Promise<IMachineAlarm>;
  getAlarmsByMachineId(machineId: string): Promise<IMachineAlarm[]>;
  resolveAlarm(id: string): Promise<IMachineAlarm>;
}

export interface IDataCollectorService {
  startBroadcastingMachineStates(): void;
  pollMazakData(machineId: string): Promise<ICurrentState>;
  pollAllMazakData(): Promise<void>;
  processMazakData(data: any, machineId: string): Promise<ICurrentState>;
  processFanucData(data: any): Promise<any>;
  processData(data: any): Promise<any>;
}

export interface IAxis {
  label: string;
  position: number;
}

export interface ISpindle {
  speed: number;
  load: number;
}

export interface ICurrentState {
  machineId: string;
  machineName: string;
  state: string;
  controller: string;
  execution: string;
  program: string;
  tool: string;
  spindle: ISpindle;
  axes: IAxis[];
}

// Errors
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class InternalServerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InternalServerError";
  }
}

// Query/response
export interface IQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  startDate?: Date;
  endDate?: Date;
  search?: string;
  [key: string]: any;
}

export interface IQueryBuilderResult {
  whereClause: any;
  orderClause: Array<[any, string]>;
  page: number;
  offset?: number;
  limit?: number;
}

export interface IPaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  error: string | null;
  timestamp: Date;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface IDateRange {
  startDate: Date;
  endDate: Date;
  totalDuration: number;
  totalDays: number;
  previousStart: Date;
  previousEnd: Date;
}
