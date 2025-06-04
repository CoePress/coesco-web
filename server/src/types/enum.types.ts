export enum EmployeeRole {
  INACTIVE = "INACTIVE",
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  EMPLOYEE = "EMPLOYEE",
}

export enum CustomerStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PENDING = "PENDING",
}

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

export enum TimeScale {
  MINUTE = "MINUTE",
  HOUR = "HOUR",
  DAY = "DAY",
  WEEK = "WEEK",
  MONTH = "MONTH",
  QUARTER = "QUARTER",
  YEAR = "YEAR",
}
