// Auto-generated from Prisma schema
export interface EmployeeHours {
  id?: string;
  empNum: string;
  timeIn: Date | string;
  timeOut: Date | string;
  jobCode: number;
  costCode?: string;
  quantity?: number;
  splitCode?: string;
  breakFlag?: number;
  managerApproval?: boolean;
  managerName?: string;
  inVariance?: number;
  outVariance?: number;
  timeSheetMinutes: number;
  timeOffset?: number;
  nightShift?: boolean;
  isConfirmed?: boolean;
  flag?: string;
  tZOffset?: string;
  jobDesc?: string;
  actualTimeIn?: Date | string;
  actualTimeOut?: Date | string;
  hasNote?: boolean;
  isEdited?: boolean;
  createdAt?: Date | string;
  updatedAt: Date | string;
}

export type CreateEmployeeHoursInput = Omit<EmployeeHours, "id" | "createdAt" | "updatedAt">;
export type UpdateEmployeeHoursInput = Partial<CreateEmployeeHoursInput>;
