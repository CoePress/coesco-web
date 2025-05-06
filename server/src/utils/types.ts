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
export type MachineAxis = "X" | "Y" | "Z" | "A" | "B" | "C";

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
  timestamp: Date;
  state: string;
  execution: string;
  controller: string;
  program: string;
  tool: string;
  position: Record<MachineAxis, number>;
  feedRate: number;
  spindleSpeed: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StateWithDuration extends IMachineState {
  durationMs?: number;
}

export interface ICreateMachineStateDTO {
  machineId: string;
  timestamp: Date;
  state: string;
  execution: string;
  controller: string;
  program: string;
  tool: string;
  position: {
    X: number;
    Y: number;
    Z: number;
    A: number;
    B: number;
    C: number;
  };
  feedRate: number;
  spindleSpeed: number;
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
    label: string;
    duration: number;
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
  [key: string]: {
    timestamp: Date;
    state: string;
    durationMs: number;
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
  createState(state: ICreateMachineStateDTO): Promise<IMachineState>;
  getStates(params?: IQueryParams): Promise<IMachineState[]>;
  getStatesByMachineId(
    machineId: string,
    params?: IQueryParams
  ): Promise<IMachineState[]>;
  getCurrentStates(): Promise<IMachineState[]>;
  getStateOverview(from: Date, to: Date): Promise<IStateOverview>;
  getStateTimeline(
    machineId: string,
    from: Date,
    to: Date
  ): Promise<IMachineState[]>;
}

export interface IAlarmService {
  createAlarm(alarm: ICreateMachineAlarmDTO): Promise<IMachineAlarm>;
  getAlarms(): Promise<IMachineAlarm[]>;
  getActiveAlarms(): Promise<IMachineAlarm[]>;
  getAlarmsByMachineId(machineId: string): Promise<IMachineAlarm[]>;
  resolveAlarm(id: string): Promise<IMachineAlarm>;
}

export interface IDataCollectorService {
  startBroadcastingMachineStates(): void;
  processMTConnectData(machineId: string, xmlData: string): Promise<void>;
  processFanucData(machineId: string, data: any): Promise<void>;
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

export interface IQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface IResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  timestamp: Date;
}
