import { IApiResponse } from "@/types/api.types";
import { IQueryParams } from "@/types/api.types";
import { IEmployee } from "@/types/schema.types";

import { IEmployeeService } from "@/types/service.types";

export class EmployeeService implements IEmployeeService {
  async getEmployees(
    params?: IQueryParams
  ): Promise<IApiResponse<IEmployee[]>> {
    return Promise.resolve({} as IApiResponse<IEmployee[]>);
  }

  async getEmployee(id: string): Promise<IApiResponse<IEmployee>> {
    return Promise.resolve({} as IApiResponse<IEmployee>);
  }

  async createEmployee(employee: IEmployee): Promise<IApiResponse<IEmployee>> {
    return Promise.resolve({} as IApiResponse<IEmployee>);
  }

  async updateEmployee(
    id: string,
    employee: IEmployee
  ): Promise<IApiResponse<IEmployee>> {
    return Promise.resolve({} as IApiResponse<IEmployee>);
  }

  async deleteEmployee(id: string): Promise<IApiResponse<boolean>> {
    return Promise.resolve({} as IApiResponse<boolean>);
  }
}
