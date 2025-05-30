import { Employee, User, UserType } from "@prisma/client";
import { BaseService } from "./_";
import { prisma } from "@/utils/prisma";
import {
  BadRequestError,
  InternalServerError,
} from "@/middleware/error.middleware";
import { logger } from "@/utils/logger";
import { EmployeeRole } from "@/types/enum.types";
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

  async sync() {
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

        const existingEmployee = await this.model.findFirst({
          where: { email: user.mail },
        });
        logger.info(
          `Existing employee found: ${existingEmployee ? "Yes" : "No"}`
        );

        const isAdmin = user.department === "MIS";

        const employee = await this.model.upsert({
          where: { email: user.mail },
          create: {
            firstName: user.givenName || "Unknown",
            lastName: user.surname || "User",
            email: user.mail,
            jobTitle: user.jobTitle || "Employee",
            number: user.mail.split("@")[0].toUpperCase(),
          },
          update: {
            firstName: user.givenName || "Unknown",
            lastName: user.surname || "User",
            email: user.mail,
            jobTitle: user.jobTitle || "Employee",
          },
        });
        logger.info(
          `Employee ${existingEmployee ? "updated" : "created"}: ${employee.id}`
        );

        const existingUser = await prisma.user.findUnique({
          where: { email: user.mail },
        });
        logger.info(`Existing user found: ${existingUser ? "Yes" : "No"}`);

        await prisma.user.upsert({
          where: { email: user.mail },
          create: {
            email: user.mail,
            employeeId: employee.id,
            userType: isAdmin ? UserType.ADMIN : UserType.USER,
          },
          update: {
            email: user.mail,
            employeeId: employee.id,
            userType: isAdmin ? UserType.ADMIN : UserType.USER,
          },
        });
        logger.info(`User record ${existingUser ? "updated" : "created"}`);
      }

      logger.info("Sync completed successfully");
      return true;
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
