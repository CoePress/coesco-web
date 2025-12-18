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
  EmpNum?: number | string;
  EmpFirstName?: string;
  EmpLastName?: string;
  EmpInitials?: string;
  Emptitle?: string;
  HireDate?: string;
  StartDate?: string;
  TermDate?: string;
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

async function getAllLegacyEmployees(): Promise<LegacyEmployee[]> {
  const result = await legacyService.getAll("std", "Employee", {
    page: 1,
    limit: 10000,
  });

  if (!result || !result.data) {
    return [];
  }

  return result.data as LegacyEmployee[];
}

export async function syncMicrosoftUsers() {
  logger.info("sync.started");

  await initializeLegacyService();

  // Step 1: Sync ALL legacy employees (creates User + Employee for everyone)
  logger.info("sync.legacy_employees_started");
  const legacyEmployees = await getAllLegacyEmployees();
  logger.info("sync.legacy_employees_fetched", { count: legacyEmployees.length });

  let legacyCreated = 0;
  let legacyUpdated = 0;
  let legacySkippedNoInitials = 0;
  let legacySkippedNoEmpNum = 0;
  let legacyErrors = 0;

  for (const legacyEmp of legacyEmployees) {
    try {
      if (!legacyEmp.EmpInitials) {
        legacySkippedNoInitials++;
        continue;
      }

      if (!legacyEmp.EmpNum) {
        legacySkippedNoEmpNum++;
        continue;
      }

      const initials = legacyEmp.EmpInitials.toString().trim().toUpperCase();
      const email = `${initials.toLowerCase()}@cpec.com`;
      const empNumber = legacyEmp.EmpNum.toString();

      const existingEmployee = await prisma.employee.findFirst({
        where: { OR: [{ email }, { number: empNumber }, { initials }] },
        include: { user: true },
      });

      if (existingEmployee) {
        // Update existing
        await prisma.employee.update({
          where: { id: existingEmployee.id },
          data: {
            firstName: legacyEmp.EmpFirstName?.trim() || existingEmployee.firstName,
            lastName: legacyEmp.EmpLastName?.trim() || existingEmployee.lastName,
            title: legacyEmp.Emptitle?.trim() || existingEmployee.title,
            hireDate: legacyEmp.HireDate ? new Date(legacyEmp.HireDate) : existingEmployee.hireDate,
            startDate: legacyEmp.StartDate ? new Date(legacyEmp.StartDate) : existingEmployee.startDate,
            terminationDate: legacyEmp.TermDate ? new Date(legacyEmp.TermDate) : existingEmployee.terminationDate,
          },
        });
        legacyUpdated++;
      }
      else {
        // Create new User + Employee
        await prisma.user.create({
          data: {
            username: email,
            isActive: false,
            role: UserRole.USER,
            employee: {
              create: {
                number: empNumber,
                firstName: legacyEmp.EmpFirstName?.trim() || "Unknown",
                lastName: legacyEmp.EmpLastName?.trim() || "Unknown",
                initials,
                email,
                title: legacyEmp.Emptitle?.trim() || "Employee",
                hireDate: legacyEmp.HireDate ? new Date(legacyEmp.HireDate) : null,
                startDate: legacyEmp.StartDate ? new Date(legacyEmp.StartDate) : null,
                terminationDate: legacyEmp.TermDate ? new Date(legacyEmp.TermDate) : null,
                createdById: "system",
                updatedById: "system",
                deletedById: "system",
              },
            },
          },
        });
        logger.debug("sync.legacy_created", { email, empNumber });
        legacyCreated++;
      }
    }
    catch (error: any) {
      logger.error("sync.legacy_error", { initials: legacyEmp.EmpInitials, error: error.message });
      legacyErrors++;
    }
  }

  logger.info("sync.legacy_employees_completed", {
    created: legacyCreated,
    updated: legacyUpdated,
    skippedNoInitials: legacySkippedNoInitials,
    skippedNoEmpNum: legacySkippedNoEmpNum,
    errors: legacyErrors,
  });

  // Step 2: Update Users with Microsoft data (sets microsoftId, role, isActive for admins)
  logger.info("sync.microsoft_started");
  const microsoftUsers = await getMicrosoftUsers();
  logger.info("sync.microsoft_fetched", { count: microsoftUsers.length });

  let msUpdated = 0;
  let msSkipped = 0;
  let msErrors = 0;

  for (const msUser of microsoftUsers) {
    try {
      if (!msUser.mail || !msUser.id) {
        msSkipped++;
        continue;
      }

      if (blacklistedEmails.includes(msUser.mail)) {
        msSkipped++;
        continue;
      }

      if (!employeeEmailRegex.test(msUser.mail)) {
        msSkipped++;
        continue;
      }

      const employee = await prisma.employee.findFirst({
        where: { email: msUser.mail },
        include: { user: true },
      });

      if (!employee) {
        logger.debug("sync.ms_skip_no_employee", { email: msUser.mail });
        msSkipped++;
        continue;
      }

      const isAdmin = msUser.department === "MIS";

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
          },
        }),
      ]);

      logger.debug("sync.ms_updated", { email: msUser.mail, isAdmin });
      msUpdated++;
    }
    catch (error: any) {
      logger.error("sync.ms_error", { email: msUser.mail, error: error.message });
      msErrors++;
    }
  }

  logger.info("sync.microsoft_completed", {
    updated: msUpdated,
    skipped: msSkipped,
    errors: msErrors,
  });

  const legacySkipped = legacySkippedNoInitials + legacySkippedNoEmpNum;

  logger.info("sync.completed", {
    legacy: { created: legacyCreated, updated: legacyUpdated, skipped: legacySkipped, skippedNoInitials: legacySkippedNoInitials, skippedNoEmpNum: legacySkippedNoEmpNum, errors: legacyErrors },
    microsoft: { updated: msUpdated, skipped: msSkipped, errors: msErrors },
  });

  return {
    legacy: { created: legacyCreated, updated: legacyUpdated, skipped: legacySkipped, errors: legacyErrors },
    microsoft: { updated: msUpdated, skipped: msSkipped, errors: msErrors },
  };
}
