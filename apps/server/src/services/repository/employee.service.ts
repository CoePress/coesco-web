import { Employee, UserRole } from "@prisma/client";
import { BaseService } from "./_";
import { prisma } from "@/utils/prisma";
import {
  BadRequestError,
  InternalServerError,
} from "@/middleware/error.middleware";
import { logger } from "@/utils/logger";
import axios from "axios";
import { config } from "@/config/config";

const blacklistedEmails = [
  "ads@cpec.com",
  "asy@cpec.com",
  "COE@cpec.com",
  "ele@cpec.com",
];

const employeeEmailRegex = /^[a-z]{3}@cpec\.com$/i;

type EmployeeAttributes = Omit<Employee, "id" | "createdAt" | "updatedAt">;

export class EmployeeService extends BaseService<Employee> {
  protected model = prisma.employee;
  protected entityName = "Employee";
  protected modelName = "employee";

  async sync() {
    try {
      logger.info("Starting Microsoft user sync...");
      const microsoftUsers = await this.getMicrosoftUsers();
      logger.info(`Found ${microsoftUsers.length} Microsoft users`);

      for (const microsoftUser of microsoftUsers) {
        if (blacklistedEmails.includes(microsoftUser.mail)) {
          logger.info(`Skipping blacklisted email: ${microsoftUser.mail}`);
          continue;
        }

        if (!microsoftUser.mail || !microsoftUser.id) {
          logger.warn(
            `Skipping user with missing required fields: ${
              microsoftUser.mail || "no email"
            }`
          );
          continue;
        }

        if (!employeeEmailRegex.test(microsoftUser.mail)) {
          logger.info(
            `Skipping non-standard email format: ${microsoftUser.mail}`
          );
          continue;
        }

        logger.info(
          `Processing user: ${microsoftUser.displayName} (${microsoftUser.mail})`
        );

        const existingEmployee = await this.model.findFirst({
          where: { email: microsoftUser.mail },
        });
        logger.info(
          `Existing employee found: ${existingEmployee ? "Yes" : "No"}`
        );

        const isAdmin = microsoftUser.department === "MIS";

        const user = await prisma.user.upsert({
          where: { microsoftId: microsoftUser.id },
          create: {
            username: microsoftUser.mail,
            role: isAdmin ? UserRole.ADMIN : UserRole.USER,
            isActive: isAdmin ? true : false,
            microsoftId: microsoftUser.id,
          },
          update: {
            username: microsoftUser.mail,
            role: isAdmin ? UserRole.ADMIN : UserRole.USER,
          },
        });
        logger.info(`User record ${existingEmployee ? "updated" : "created"}`);

        const employee = await this.model.upsert({
          where: { email: microsoftUser.mail },
          create: {
            firstName: microsoftUser.givenName || "Unknown",
            lastName: microsoftUser.surname || "User",
            email: microsoftUser.mail,
            jobTitle: microsoftUser.jobTitle || "Employee",
            number: microsoftUser.mail.split("@")[0].toUpperCase(),
            userId: user.id,
          },
          update: {
            firstName: microsoftUser.givenName || "Unknown",
            lastName: microsoftUser.surname || "User",
            email: microsoftUser.mail,
            jobTitle: microsoftUser.jobTitle || "Employee",
          },
        });
        logger.info(
          `Employee ${existingEmployee ? "updated" : "created"}: ${employee.id}`
        );
      }

      logger.info("Sync completed successfully");
      return true;
    } catch (error: any) {
      logger.error("Sync failed with error:", {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status,
      });
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
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: AbortSignal.timeout(30000),
        });

        const data = await response.json();

        allUsers.push(...data.value);

        url = data["@odata.nextLink"] || null;
      }

      return allUsers;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error?.message || error.message;
      throw new Error(`Failed to fetch Microsoft users: ${errorMessage}`);
    }
  }

  private async generateMicrosoftToken() {
    const tokenUrl = `https://login.microsoftonline.com/${config.azureTenantId}/oauth2/v2.0/token`;

    try {
      const params = new URLSearchParams({
        client_id: config.azureClientId,
        client_secret: config.azureClientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      });

      const response = await axios.post(tokenUrl, params);
      return response.data.access_token;
    } catch (error: any) {
      logger.error("Token generation failed:", {
        error: error.response?.data || error.message,
        status: error.response?.status,
        config: {
          tenantId: config.azureTenantId,
          clientId: config.azureClientId,
          hasSecret: !!config.azureClientSecret,
        },
      });
      throw new Error(
        `Failed to generate token: ${
          error.response?.data?.error_description || error.message
        }`
      );
    }
  }

  protected async validate(employee: EmployeeAttributes): Promise<void> {
    if (!employee.firstName) {
      throw new BadRequestError("First name is required");
    }

    if (!employee.number) {
      throw new BadRequestError("Number is required");
    }

    if (employee.email) {
      const existingEmail = await this.model.findUnique({
        where: { email: employee.email },
      });

      if (existingEmail) {
        throw new BadRequestError("Employee already exists");
      }
    }
  }
}
