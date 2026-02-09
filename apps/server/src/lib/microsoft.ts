import fs from "node:fs";
import path from "node:path";

import type { legacy } from "./legacy-types";

import { UserRole } from "@prisma/client";
import env from "./env";
import logger from "./logger";
import { initializeLegacyService, legacyService } from "./odbc";
import { generateAndHashPassword, saveCredential } from "./passwords";
import { prisma } from "./prisma";

const SYNC_STATE_FILE = path.join(__dirname, "../../.sync-state.json");
const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

function shouldSync(): boolean {
  try {
    if (!fs.existsSync(SYNC_STATE_FILE))
      return true;
    const state = JSON.parse(fs.readFileSync(SYNC_STATE_FILE, "utf-8"));
    return Date.now() - state.lastSync > SYNC_INTERVAL_MS;
  }
  catch {
    return true;
  }
}

function updateSyncState(): void {
  fs.writeFileSync(SYNC_STATE_FILE, JSON.stringify({ lastSync: Date.now() }));
}

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

type LegacyEmployee = Partial<legacy.std.Employee>;

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

export async function syncMicrosoftUsers(force = false) {
  if (!force && !shouldSync()) {
    logger.info("sync.skipped", { reason: "recently synced" });
    return null;
  }

  logger.info("sync.started");

  await initializeLegacyService();

  // Step 1: Sync ALL legacy employees (creates User + Employee for everyone)
  logger.info("sync.legacy_employees_started");
  const allLegacyEmployees = await getAllLegacyEmployees();

  // Deduplicate by initials - keep the one with the latest hire date
  const legacyByInitials = new Map<string, LegacyEmployee>();
  let legacySkippedNoInitials = 0;
  for (const emp of allLegacyEmployees) {
    if (!emp.EmpInitials) {
      legacySkippedNoInitials++;
      continue;
    }
    const initials = emp.EmpInitials.toString().trim().toUpperCase();
    const existing = legacyByInitials.get(initials);
    if (!existing) {
      legacyByInitials.set(initials, emp);
    }
    else {
      const existingDate = existing.HireDate ? new Date(existing.HireDate) : new Date(0);
      const newDate = emp.HireDate ? new Date(emp.HireDate) : new Date(0);
      if (newDate > existingDate) {
        legacyByInitials.set(initials, emp);
      }
    }
  }
  const legacyEmployees = Array.from(legacyByInitials.values());
  logger.info("sync.legacy_employees_fetched", { total: allLegacyEmployees.length, deduplicated: legacyEmployees.length });

  let legacyCreated = 0;
  let legacyUpdated = 0;
  let legacySkipped = 0;
  let legacyErrors = 0;

  for (const legacyEmp of legacyEmployees) {
    try {
      if (!legacyEmp.EmpNum)
        continue;

      const initials = legacyEmp.EmpInitials!.toString().trim().toUpperCase();
      const email = `${initials.toLowerCase()}@cpec.com`;
      const empNumber = legacyEmp.EmpNum.toString();
      const firstName = legacyEmp.EmpFirstName?.trim() || "Unknown";
      const lastName = legacyEmp.EmpLastName?.trim() || "Unknown";
      const title = legacyEmp.Emptitle?.trim() || "Employee";
      const hireDate = legacyEmp.HireDate ? new Date(legacyEmp.HireDate) : null;
      const startDate = legacyEmp.StartDate ? new Date(legacyEmp.StartDate) : null;
      const terminationDate = legacyEmp.TermDate ? new Date(legacyEmp.TermDate) : null;

      const existing = await prisma.employee.findUnique({ where: { number: empNumber } });

      if (!existing) {
        const { plain: password, hash: passwordHash } = await generateAndHashPassword();

        await prisma.user.create({
          data: {
            username: email,
            password: passwordHash,
            isActive: true,
            role: UserRole.USER,
            employee: {
              create: { number: empNumber, firstName, lastName, initials, email, title, hireDate, startDate, terminationDate, createdById: "system", updatedById: "system" },
            },
          },
        });

        saveCredential(email, password);
        logger.info("sync.user_created_with_password", { email });
        legacyCreated++;
      }
      else {
        const changed
          = existing.firstName !== firstName
          || existing.lastName !== lastName
          || existing.title !== title
          || existing.hireDate?.getTime() !== hireDate?.getTime()
          || existing.startDate?.getTime() !== startDate?.getTime()
          || existing.terminationDate?.getTime() !== terminationDate?.getTime();

        if (changed) {
          await prisma.employee.update({
            where: { number: empNumber },
            data: { firstName, lastName, title, hireDate, startDate, terminationDate },
          });
          legacyUpdated++;
        }
        else {
          legacySkipped++;
        }
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
    skipped: legacySkipped,
    skippedNoInitials: legacySkippedNoInitials,
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
        logger.info("sync.ms_skip_no_employee", { email: msUser.mail });
        msSkipped++;
        continue;
      }

      const isAdmin = msUser.department === "MIS";
      const newRole = isAdmin ? UserRole.ADMIN : UserRole.USER;

      const hasChanges
        = employee.user.microsoftId !== msUser.id
        || employee.user.role !== newRole
        || (isAdmin && !employee.user.isActive);

      if (hasChanges) {
        await prisma.user.update({
          where: { id: employee.userId },
          data: {
            microsoftId: msUser.id,
            role: newRole,
            ...(isAdmin && { isActive: true }),
          },
        });

        logger.info("sync.ms_updated", { email: msUser.mail, isAdmin });
        msUpdated++;
      }
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

  logger.info("sync.completed", {
    legacy: { created: legacyCreated, updated: legacyUpdated, skipped: legacySkipped, errors: legacyErrors },
    microsoft: { updated: msUpdated, skipped: msSkipped, errors: msErrors },
  });

  updateSyncState();

  return {
    legacy: { created: legacyCreated, updated: legacyUpdated, skipped: legacySkipped, errors: legacyErrors },
    microsoft: { updated: msUpdated, skipped: msSkipped, errors: msErrors },
  };
}
