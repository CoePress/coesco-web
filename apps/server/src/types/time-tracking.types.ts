// Core TypeScript interfaces for the time tracking system
// Based on the C# models from CoeDashboard

export interface EmployeeHours {
  id: string;
  empNum: number;
  timeIn?: string;
  timeOut?: string;
  jobCode: number;
  costCode?: string;
  quantity?: string;
  splitCode?: string;
  breakFlag: number;
  managerApproval: boolean;
  managerName?: string;
  inVariance?: number;
  outVariance?: number;
  timeSheetMinutes: number;
  timeOffset?: number;
  nightShift: boolean;
  isConfirmed: boolean;
  flag?: number;
  tzOffset?: string;
  jobDesc?: string;
  actualTimeIn?: string;
  actualTimeOut?: string;
  hasNote: boolean;
  isEdited: boolean;
}

export interface Hours {
  id: string;
  manager: boolean;
  note: boolean;
  edited: boolean;
  timeIn?: string;
  actualTimeIn?: string;
  timeOut?: string;
  actualTimeOut?: string;
  jobCode?: string;
  hours?: string;
  units?: string;
  split?: string;
  costCode?: string;
  breakFlag?: string;
  dayTotal?: string;
  weekTotal?: string;
  isSelected: boolean;

  // Computed properties
  timeInDT: Date;
  timeOutDT: Date;
  displayTimeOut: string;

  // Old values for change tracking
  oldTimeIn?: string;
  oldActualTimeIn?: string;
  oldTimeOut?: string;
  oldActualTimeOut?: string;
  oldJobCode?: string;
  oldHours?: string;
  oldUnits?: string;
  oldSplit?: string;
  oldCostCode?: string;
  oldBreakFlag?: string;
  oldDayTotal?: string;
  oldWeekTotal?: string;
}

export interface CostCode {
  id: string;
  jobSfx: string;
  bomItem: string;
  sequence: string;
  active: boolean;
  jobCode: number;
  jobName?: string;
  needByDate?: string;
  isConfirmed: boolean;
  costCode: string; // Computed: jobSfx + "\\" + bomItem + "\\" + sequence
}

export interface EmployeeJobCode {
  id: string;
  empNum: number;
  jobCode: number;
  description: string;
  active: boolean;
  clockable: boolean;
  requiresCostCode: boolean;
  askQuantity: boolean;
  askSplitCode: boolean;
  isConfirmed: boolean;
}

export interface OpDesc {
  operation: number;
  description?: string;
  jobString: string; // Computed: operation + " - " + description
}

export interface DataHistory {
  id: string;
  collectionName: string;
  fieldChanged: string;
  hoursId: string;
  empNum: number;
  oldData: string;
  newData: string;
  editDescription: string;
  timeChanged: string;
  userName: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TimeSpan {
  totalMinutes: number;
  totalHours: number;
}

export interface ClockOperation {
  empNum: number;
  opNum?: number;
  clockedTime: Date;
  costCode?: string;
  jobDesc?: string;
  units?: string;
  split?: string;
}

export interface SplitHoursResult {
  success: boolean;
  splitHours: Hours[];
  error?: string;
}
