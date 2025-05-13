import { IApiResponse } from "@/types/api.types";
import { IQueryParams } from "@/types/api.types";
import { EmployeeStatus, IEmployee } from "@/types/schema.types";
import { IEmployeeService } from "@/types/service.types";
import { ConfidentialClientApplication } from "@azure/msal-node";
import { config } from "@/config/config";
import Employee from "@/models/employee";
import Auth from "@/models/auth";
import { UserType } from "@/types/auth.types";
import { v4 as uuidv4 } from "uuid";

export class EmployeeService implements IEmployeeService {
  private async getMicrosoftEmployees() {
    const msalConfig = {
      auth: {
        clientId: config.azure.clientId,
        clientSecret: config.azure.clientSecret,
        authority: `https://login.microsoftonline.com/${config.azure.tenantId}`,
      },
    };

    const msalClient = new ConfidentialClientApplication(msalConfig);
    const tokenResponse = await msalClient.acquireTokenByClientCredential({
      scopes: ["https://graph.microsoft.com/.default"],
    });

    const response = await fetch("https://graph.microsoft.com/v1.0/users", {
      headers: {
        Authorization: `Bearer ${tokenResponse?.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch Microsoft users");
    }

    return response.json();
  }

  async syncEmployees(): Promise<IApiResponse<boolean>> {
    try {
      const msUsers = await this.getMicrosoftEmployees();

      for (const user of msUsers.value) {
        const existingEmployee = await Employee.findOne({
          where: { microsoftId: user.id },
        });

        const [employee] = await Employee.upsert({
          id: existingEmployee?.id || uuidv4(),
          firstName: user.givenName,
          lastName: user.surname,
          email: user.mail,
          jobTitle: user.jobTitle || "Employee",
          status: EmployeeStatus.ACTIVE,
          role: "employee",
          microsoftId: user.id,
          departmentIds: [],
          primaryDepartmentId: "",
        });

        const existingAuth = await Auth.findOne({
          where: { microsoftId: user.id },
        });

        await Auth.upsert({
          id: existingAuth?.id || uuidv4(),
          email: user.mail,
          microsoftId: user.id,
          userId: employee.id,
          userType: UserType.EMPLOYEE,
          isActive: true,
          isVerified: true,
          password: "",
        });
      }

      return { success: true, data: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

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
