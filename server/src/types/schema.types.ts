export interface IBaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

enum UserType {
  EMPLOYEE = "employee",
  CUSTOMER = "customer",
}

export interface IAuth extends IBaseEntity {
  email: string;
  password: string;
  microsoftId?: string;
  userId?: string;
  userType: UserType;
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: Date;
}

export interface IAuthResponse {
  token: string;
  refreshToken: string;
  userType: UserType;
  user: IEmployee | ICustomer;
}

enum EmployeeStatus {
  ACTIVE = "ACTIVE",
  ON_LEAVE = "ON_LEAVE",
  TERMINATED = "TERMINATED",
}

export interface IDepartment extends IBaseEntity {
  name: string;
  description?: string;
  leaderId?: string;
}

export interface IEmployee extends IBaseEntity {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  departmentIds?: string[];
  primaryDepartmentId?: string;
  reportsToId?: string;
  status: EmployeeStatus;
  microsoftId?: string;
  hiredAt?: Date;
  terminatedAt?: Date;
}

export interface ICustomer {}
