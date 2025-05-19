export enum UserType {
  INTERNAL = "INTERNAL",
  EXTERNAL = "EXTERNAL",
}

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

export enum MachineType {
  LATHE = "LATHE",
  MILL = "MILL",
}

export enum MachineControllerType {
  FANUC = "FANUC",
  SIEMENS = "SIEMENS",
  HAAS = "HAAS",
  MAZAK = "MAZAK",
  OKUMA = "OKUMA",
  OTHER = "OTHER",
}

export enum MachineConnectionType {
  MTCONNECT = "MTCONNECT",
  CUSTOM = "CUSTOM",
}

export enum MachineState {
  ACTIVE = "ACTIVE",
  SETUP = "SETUP",
  IDLE = "IDLE",
  ALARM = "ALARM",
  OFFLINE = "OFFLINE",
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
