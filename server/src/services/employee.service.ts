import { v4 as uuidv4 } from "uuid";
import axios from "axios";

import { config } from "@/config/config";
import Auth from "@/models/auth";
import Employee from "@/models/employee";
import { IApiResponse, IQueryParams } from "@/types/api.types";
import { EmployeeRole, IEmployee, UserType } from "@/types/schema.types";
import { IEmployeeService } from "@/types/service.types";
import { logger } from "@/utils/logger";
import { buildQuery, validateUuid } from "@/utils";
import {
  BadRequestError,
  NotFoundError,
  InternalServerError,
} from "@/middleware/error.middleware";

const blacklistedEmails = [
  "ads@cpec.com",
  "asy@cpec.com",
  "COE@cpec.com",
  "ele@cpec.com",
];

const employeeEmailRegex = /^[a-z]{3}@cpec\.com$/i;

export class EmployeeService implements IEmployeeService {
  async getEmployees(params: IQueryParams): Promise<IApiResponse<IEmployee[]>> {
    const { whereClause, orderClause, page, limit, offset } = buildQuery(
      params,
      ["firstName", "lastName", "email"]
    );

    const employees = await Employee.findAll({
      where: whereClause,
      order: Object.entries(orderClause).map(([key, value]) => [key, value]),
      limit,
      offset,
    });

    const total = await Employee.count({ where: whereClause });
    const totalPages = limit ? Math.ceil(total / limit) : 1;

    return {
      success: true,
      data: employees.map((emp) => emp.toJSON() as IEmployee),
      total,
      totalPages,
      page,
      limit,
    };
  }

  async getEmployee(id: string): Promise<IApiResponse<IEmployee>> {
    if (!id) {
      throw new BadRequestError("Employee ID is required");
    }

    if (!validateUuid(id)) {
      throw new BadRequestError("Invalid employee ID");
    }

    const employee = await Employee.findByPk(id);

    if (!employee) {
      throw new NotFoundError("Employee not found");
    }

    return {
      success: true,
      data: employee?.toJSON() as IEmployee,
    };
  }

  async createEmployee(employee: IEmployee): Promise<IApiResponse<IEmployee>> {
    await this.validateEmployee(employee);

    return Promise.resolve({} as IApiResponse<IEmployee>);
  }

  async updateEmployee(
    id: string,
    employee: IEmployee
  ): Promise<IApiResponse<IEmployee>> {
    await this.validateEmployee(employee);

    const existingEmployee = await Employee.findByPk(id);

    if (!existingEmployee) {
      throw new NotFoundError("Employee not found");
    }

    const updatedEmployee = await existingEmployee.update(employee);

    return {
      success: true,
      data: updatedEmployee?.toJSON() as IEmployee,
    };
  }

  async deleteEmployee(id: string): Promise<IApiResponse<boolean>> {
    return Promise.resolve({} as IApiResponse<boolean>);
  }

  async syncEmployees(): Promise<IApiResponse<boolean>> {
    try {
      logger.info("Starting Microsoft user sync...");
      const msUsers = await this.getMicrosoftUsers();
      logger.info(`Found ${msUsers.length} Microsoft users`);

      for (const user of msUsers) {
        if (blacklistedEmails.includes(user.mail)) {
          logger.info(`Skipping blacklisted email: ${user.mail}`);
          continue;
        }

        if (!user.mail || !user.id) {
          logger.warn(
            `Skipping user with missing required fields: ${
              user.mail || "no email"
            }`
          );
          continue;
        }

        if (!employeeEmailRegex.test(user.mail)) {
          logger.info(`Skipping non-standard email format: ${user.mail}`);
          continue;
        }

        logger.info(`Processing user: ${user.displayName} (${user.mail})`);

        const existingEmployee = await Employee.findOne({
          where: { microsoftId: user.id },
        });
        logger.info(
          `Existing employee found: ${existingEmployee ? "Yes" : "No"}`
        );

        const isAdmin = user.department === "MIS";

        const [employee] = await Employee.upsert({
          id: existingEmployee?.id || uuidv4(),
          firstName: user.givenName || "Unknown",
          lastName: user.surname || "User",
          email: user.mail,
          jobTitle: user.jobTitle || "Employee",
          role: isAdmin ? EmployeeRole.ADMIN : EmployeeRole.INACTIVE,
          microsoftId: user.id,
        });
        logger.info(
          `Employee ${existingEmployee ? "updated" : "created"}: ${employee.id}`
        );

        const existingAuth = await Auth.findOne({
          where: { microsoftId: user.id },
        });
        logger.info(`Existing auth found: ${existingAuth ? "Yes" : "No"}`);

        await Auth.upsert({
          id: existingAuth?.id || uuidv4(),
          email: user.mail,
          microsoftId: user.id,
          userId: employee.id,
          userType: UserType.INTERNAL,
          isActive: true,
          isVerified: true,
        });
        logger.info(`Auth record ${existingAuth ? "updated" : "created"}`);
      }

      logger.info("Sync completed successfully");
      return { success: true, data: true };
    } catch (error: any) {
      logger.error("Sync failed with error:", error);
      throw new InternalServerError(`Sync failed: ${error.message}`);
    }
  }

  private async getMicrosoftUsers() {
    try {
      const allUsers = [];
      let url =
        "https://graph.microsoft.com/v1.0/users?$select=id,mail,displayName,givenName,surname,jobTitle,department";

      while (url) {
        const token = await this.generateMicrosoftToken();
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000,
        });

        allUsers.push(...response.data.value);

        url = response.data["@odata.nextLink"] || null;
      }

      return allUsers;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error?.message || error.message;
      throw new Error(`Failed to fetch Microsoft users: ${errorMessage}`);
    }
  }

  private async generateMicrosoftToken() {
    const tokenUrl = `https://login.microsoftonline.com/${config.azure.tenantId}/oauth2/v2.0/token`;

    try {
      const params = new URLSearchParams({
        client_id: config.azure.clientId,
        client_secret: config.azure.clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      });

      const response = await axios.post(tokenUrl, params);

      return response.data.access_token;
    } catch (error) {
      throw new Error("Failed to generate token");
    }
  }

  private async validateEmployee(employee: IEmployee) {
    const existingEmail = await Employee.findOne({
      where: { email: employee.email },
    });

    if (existingEmail) {
      throw new Error("Employee already exists");
    }

    const existingMicrosoftId = await Auth.findOne({
      where: { microsoftId: employee.microsoftId },
    });

    if (existingMicrosoftId) {
      throw new Error("Employee already exists");
    }
  }
}
