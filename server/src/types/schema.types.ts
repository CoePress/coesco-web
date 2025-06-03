import { EmployeeRole, MachineType } from "./enum.types";

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
