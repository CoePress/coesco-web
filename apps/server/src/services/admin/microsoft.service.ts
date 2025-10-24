import { UserRole } from "@prisma/client";
import axios from "axios";

import { env } from "@/config/env";
import { InternalServerError } from "@/middleware/error.middleware";
import { logger } from "@/utils/logger";
import { prisma } from "@/utils/prisma";

const blacklistedEmails = [
  "ads@cpec.com",
  "asy@cpec.com",
  "COE@cpec.com",
  "ele@cpec.com",
];

const employeeEmailRegex = /^[a-z]{3}@cpec\.com$/i;

export class MicrosoftService {
  async sync() {
    try {
      logger.info("Starting Microsoft user sync...");
      const microsoftUsers = await this.getMicrosoftUsers();
      logger.info(`Found ${microsoftUsers.length} Microsoft users`);

      let updated = 0;
      let skipped = 0;

      for (const microsoftUser of microsoftUsers) {
        if (blacklistedEmails.includes(microsoftUser.mail)) {
          continue;
        }

        if (!microsoftUser.mail || !microsoftUser.id) {
          continue;
        }

        if (!employeeEmailRegex.test(microsoftUser.mail)) {
          continue;
        }

        const existingEmployee = await prisma.employee.findFirst({
          where: { email: microsoftUser.mail },
          include: { user: true },
        });

        if (!existingEmployee) {
          logger.debug(`No employee found for email: ${microsoftUser.mail}`);
          skipped++;
          continue;
        }

        const isAdmin = microsoftUser.department === "MIS";

        await prisma.user.update({
          where: { id: existingEmployee.userId },
          data: {
            microsoftId: microsoftUser.id,
            role: isAdmin ? UserRole.ADMIN : UserRole.USER,
            isActive: true,
          },
        });

        await prisma.employee.update({
          where: { id: existingEmployee.id },
          data: {
            firstName: microsoftUser.givenName || existingEmployee.firstName,
            lastName: microsoftUser.surname || existingEmployee.lastName,
            title: microsoftUser.jobTitle || existingEmployee.title,
          },
        });

        updated++;
      }

      logger.info(
        `Sync completed: ${updated} updated, ${skipped} skipped, ${microsoftUsers.length} total`,
      );
      return { updated, skipped, total: microsoftUsers.length };
    }
    catch (error: any) {
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
    const allUsers = [];
    let url
      = "https://graph.microsoft.com/v1.0/users?$select=id,mail,displayName,givenName,surname,jobTitle,department";

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
  }

  private async generateMicrosoftToken() {
    const tokenUrl = `https://login.microsoftonline.com/${env.AZURE_TENANT_ID}/oauth2/v2.0/token`;

    try {
      const params = new URLSearchParams({
        client_id: env.AZURE_CLIENT_ID,
        client_secret: env.AZURE_CLIENT_SECRET,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      });

      const response = await axios.post(tokenUrl, params);
      return response.data.access_token;
    }
    catch (error: any) {
      logger.error("Token generation failed:", {
        error: error.response?.data || error.message,
        status: error.response?.status,
        config: {
          tenantId: env.AZURE_TENANT_ID,
          clientId: env.AZURE_CLIENT_ID,
          hasSecret: !!env.AZURE_CLIENT_SECRET,
        },
      });
      throw error;
    }
  }
}
