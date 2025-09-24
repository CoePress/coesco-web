// Client-side types for time tracking
// Shared interfaces for frontend components

export interface TimeEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  totalHours: number;
  operation?: string;
  job?: string;
  status: 'active' | 'completed';
}

export interface Employee {
  id: string;
  name: string;
  number: string;
}

export interface Job {
  id: string;
  jobNumber: string;
  description: string;
  customer: string;
  operations: Operation[];
}

export interface Operation {
  operation: number;
  description: string;
}

export interface ClockInRequest {
  empNum?: number;
  employeeId?: string;
  employeeName?: string;
  jobCode?: number;
  costCode?: string;
  jobDesc?: string;
}

export interface ClockOutRequest {
  empNum?: number;
  quantity?: number;
  splitCode?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  errors?: string[];
  warnings?: string[];
}

export interface EmployeeStatus {
  empNum: number;
  isClocked: boolean;
  activeEntry: any | null;
}

export interface TimeTrackingStats {
  totalEmployees: number;
  activeSessions: number;
  todayHours: number;
  weekHours: number;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  action: 'clock-in' | 'clock-out' | 'edit' | 'delete' | 'create';
  employeeName: string;
  employeeId: string;
  description: string;
  oldValue?: string;
  newValue?: string;
  modifiedBy?: string;
}
