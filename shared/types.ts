import { AccountInfo } from "@azure/msal-node";
import { Request } from "express";

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

export interface IAuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IMachine {
  id: string;
  name: string;
  slug: string;
  type: string;
  controller: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMachineConnection {
  id: string;
  machineId: string;
  type: "mazak" | "fanuc";
  ip: string;
  port: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMachineState {
  id: string;
  machineId: string;
  state: string;
  controllerMode: string;
  executionStatus: string;
  isAxisActive: boolean;
  isFeedActive: boolean;
  isSpindleActive: boolean;
  program?: string;
  tool?: string;
  startedAt: Date;
  endedAt?: Date;
  durationMs?: number;
  machine?: Partial<IMachine>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMachineAlarm {
  id: string;
  machineId: string;
  code: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

// OTHER

export interface IEmail {
  id: string;
  templateId: string;
  recipients: string[];
  status: string;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
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

export interface IAuditQueryParams extends IQueryParams {
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
}

export interface IMachineQueryParams extends IQueryParams {
  id?: string;
  name?: string;
  manufacturer?: string;
  model?: string;
  type?: string;
  isActive?: boolean;
}

export interface IResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface SessionData {
  verifier: string;
  challenge: string;
  attempts: number;
  lastAttempt: number;
}

export interface AuthResponse {
  accessToken: string;
  account: AccountInfo;
}

export interface LoginResponse {
  url: string;
  sessionId: string;
}

export interface IMachineStateTime {
  state: string;
  durationMs: number;
}

export interface IMachineTimeline {
  machineId: string;
  machineName: string;
  machineType: string;
  states: {
    state: string;
    startedAt: Date;
    endedAt: Date;
    durationMs: number;
  }[];
}

export interface IDivision {
  startedAt: Date;
  endedAt: Date;
  active: number;
  idle: number;
  stopped: number;
  offline: number;
}

export interface ITimelineResponse {
  scale: TimelineScale;
  divisionCount: number;
  divisions: IDivision[];
}

export interface IOverviewResponse {
  totals: {
    [state: string]: number;
  };
  chart: {
    divisions: IDivision[];
  };
}

export interface IAuthRequest extends Request {
  user: IUser;
}

export interface IPermission {
  roles?: AllowedRoles;
  customCheck?: (user: IUser) => boolean;
}

export type AllowedRoles = IUser["role"][];

export type TimelineScale =
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly";
