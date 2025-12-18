import { UserRole } from "../generated";
import env from "./env";
import logger from "./logger";
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
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch Microsoft users: ${error}`);
    }

    const data = await response.json();
    allUsers.push(...data.value);
    url = data["@odata.nextLink"] || null;
  }

  return allUsers;
}

export async function syncMicrosoftUsers() {
  logger.info("microsoft.sync_started");

  const microsoftUsers = await getMicrosoftUsers();
  logger.info("microsoft.users_fetched", { count: microsoftUsers.length });

  let updated = 0;
  let skipped = 0;

  for (const msUser of microsoftUsers) {
    if (!msUser.mail || !msUser.id)
      continue;
    if (blacklistedEmails.includes(msUser.mail))
      continue;
    if (!employeeEmailRegex.test(msUser.mail))
      continue;

    const employee = await prisma.employee.findFirst({
      where: { email: msUser.mail },
      include: { user: true },
    });

    if (!employee) {
      skipped++;
      continue;
    }

    const isAdmin = msUser.department === "MIS";

    await prisma.$transaction([
      prisma.user.update({
        where: { id: employee.userId },
        data: {
          microsoftId: msUser.id,
          role: isAdmin ? UserRole.ADMIN : UserRole.USER,
          isActive: true,
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

    updated++;
  }

  logger.info("microsoft.sync_completed", { updated, skipped, total: microsoftUsers.length });
  return { updated, skipped, total: microsoftUsers.length };
}
