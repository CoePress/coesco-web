import { UserRole } from "../generated/enums";
import env from "./env";
import logger from "./logger";
import { initializeLegacyService, legacyService } from "./odbc";
import { prisma } from "./prisma";

const blacklistedEmails = [
  "ads@cpec.com",
  "asy@cpec.com",
  "COE@cpec.com",
  "ele@cpec.com",
];

const employeeEmailRegex = /^[a-z]{3}@cpec\.com$/i;

interface MicrosoftUser {
  id: string;
  mail: string | null;
  displayName: string | null;
  givenName: string | null;
  surname: string | null;
  jobTitle: string | null;
  department: string | null;
}

interface LegacyEmployee {
  EmpNum?: string;
  EmpFirstName?: string;
  EmpLastName?: string;
  EmpInitials?: string;
  Emptitle?: string;
  HireDate?: string;
  StartDate?: string;
  TermDate?: string;
  PhoneNum?: string;
  DeptCode?: string;
}

interface GraphResponse {
  "value": MicrosoftUser[];
  "@odata.nextLink"?: string;
}

async function getMicrosoftToken(): Promise<string> {
  const tokenUrl = `https://login.microsoftonline.com/${env.AZURE_TENANT_ID}/oauth2/v2.0/token`;

  const params = new URLSearchParams({
    client_id: env.AZURE_CLIENT_ID,
    client_secret: env.AZURE_CLIENT_SECRET,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Microsoft token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function getMicrosoftUsers(): Promise<MicrosoftUser[]> {
  const allUsers: MicrosoftUser[] = [];
  let url: string | null
    = "https://graph.microsoft.com/v1.0/users?$select=id,mail,displayName,givenName,surname,jobTitle,department";

  while (url) {
    const token = await getMicrosoftToken();
    const response: Response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch Microsoft users: ${error}`);
    }

    const data: GraphResponse = await response.json();
    allUsers.push(...data.value);
    url = data["@odata.nextLink"] || null;
  }

  return allUsers;
}

async function getLegacyEmployee(initials: string): Promise<LegacyEmployee | null> {
  const results = await legacyService.getByFilter("std", "Employee", {
    EmpInitials: initials.toUpperCase(),
  }, { limit: 1 });

  if (!results || results.length === 0) {
    return null;
  }

  return results[0] as LegacyEmployee;
}

export async function syncMicrosoftUsers() {
  logger.info("microsoft.sync_started");

  await initializeLegacyService();

  const microsoftUsers = await getMicrosoftUsers();
  logger.info("microsoft.users_fetched", { count: microsoftUsers.length });

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const msUser of microsoftUsers) {
    try {
      if (!msUser.mail || !msUser.id) {
        logger.debug("microsoft.skip_no_email_or_id", { displayName: msUser.displayName });
        skipped++;
        continue;
      }

      if (blacklistedEmails.includes(msUser.mail)) {
        logger.debug("microsoft.skip_blacklisted", { email: msUser.mail });
        skipped++;
        continue;
      }

      if (!employeeEmailRegex.test(msUser.mail)) {
        logger.debug("microsoft.skip_invalid_email", { email: msUser.mail });
        skipped++;
        continue;
      }

      const initials = msUser.mail.substring(0, 3).toUpperCase();
      const isAdmin = msUser.department === "MIS";

      const legacyEmployee = await getLegacyEmployee(initials);

      if (!legacyEmployee) {
        logger.debug("microsoft.skip_not_in_legacy", { email: msUser.mail, initials });
        skipped++;
        continue;
      }

      const employee = await prisma.employee.findFirst({
        where: { email: msUser.mail },
        include: { user: true },
      });

      if (employee) {
        await prisma.$transaction([
          prisma.user.update({
            where: { id: employee.userId },
            data: {
              microsoftId: msUser.id,
              role: isAdmin ? UserRole.ADMIN : UserRole.USER,
              ...(isAdmin && { isActive: true }),
            },
          }),
          prisma.employee.update({
            where: { id: employee.id },
            data: {
              firstName: msUser.givenName || employee.firstName,
              lastName: msUser.surname || employee.lastName,
              title: msUser.jobTitle || employee.title,
              phoneNumber: legacyEmployee.PhoneNum || employee.phoneNumber,
              hireDate: legacyEmployee.HireDate ? new Date(legacyEmployee.HireDate) : employee.hireDate,
              startDate: legacyEmployee.StartDate ? new Date(legacyEmployee.StartDate) : employee.startDate,
            },
          }),
        ]);
        logger.debug("microsoft.updated", { email: msUser.mail });
        updated++;
      }
      else {
        await prisma.user.create({
          data: {
            username: msUser.mail,
            microsoftId: msUser.id,
            role: isAdmin ? UserRole.ADMIN : UserRole.USER,
            isActive: isAdmin,
            employee: {
              create: {
                number: legacyEmployee.EmpNum?.toString() || initials,
                firstName: msUser.givenName || legacyEmployee.EmpFirstName || "Unknown",
                lastName: msUser.surname || legacyEmployee.EmpLastName || "Unknown",
                initials,
                email: msUser.mail,
                title: msUser.jobTitle || legacyEmployee.Emptitle || "Employee",
                phoneNumber: legacyEmployee.PhoneNum || null,
                hireDate: legacyEmployee.HireDate ? new Date(legacyEmployee.HireDate) : null,
                startDate: legacyEmployee.StartDate ? new Date(legacyEmployee.StartDate) : null,
                createdById: "system",
                updatedById: "system",
                deletedById: "system",
              },
            },
          },
        });
        logger.info("microsoft.created", { email: msUser.mail, isAdmin });
        created++;
      }
    }
    catch (error: any) {
      logger.error("microsoft.sync_error", { email: msUser.mail, error: error.message });
      errors++;
    }
  }

  logger.info("microsoft.sync_completed", { created, updated, skipped, errors, total: microsoftUsers.length });
  return { created, updated, skipped, errors, total: microsoftUsers.length };
}
