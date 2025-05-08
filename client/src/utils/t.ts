export interface IEmployee {
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

export interface UseGetEmployeesProps {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
  department?: string;
  isActive?: boolean;
  receivesReports?: boolean;
  search?: string;
}

export interface ISettings {
  id: string;
  moduleSlug: string;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
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
    type: MachineType;
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
export interface IQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
  search?: string;
  startDate?: Date | string;
  endDate?: Date | string;
}

export interface IMachineQueryParams extends IQueryParams {
  type?: MachineType;
  controller?: MachineController;
}

export interface IEmployeeQueryParams extends IQueryParams {
  department?: string;
  isActive?: boolean;
  receivesReports?: boolean;
}

export interface IStateQueryParams extends IQueryParams {
  machineId?: string;
}

export type MachineAxis = "X" | "Y" | "Z" | "A" | "B" | "C";

export interface IMachineState {
  id: string;
  machineId: string;
  timestamp: Date;
  durationMs: number;
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

export interface IStateTimeline {
  machineId: string;
  machineName: string;
  timeline: {
    timestamp: Date;
    state: string;
    durationMs: number;
  }[];
}
