import { ConfidentialClientApplication } from "@azure/msal-node";

import { env } from "@/config/env";
import { encryptionService } from "@/utils/encryption";
import { logger } from "@/utils/logger";
import { prisma } from "@/utils/prisma";

const SCOPES = ["https://graph.microsoft.com/User.Read", "https://graph.microsoft.com/User.ReadBasic.All", "https://graph.microsoft.com/Chat.ReadWrite"];

const TOKEN_REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

export class GraphAuthService {
  private msalClient: ConfidentialClientApplication;

  constructor() {
    this.msalClient = new ConfidentialClientApplication({
      auth: {
        clientId: env.TEAMS_AZURE_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${env.TEAMS_AZURE_TENANT_ID}`,
        clientSecret: env.TEAMS_AZURE_CLIENT_SECRET,
      },
    });
  }

  async getAuthorizationUrl(employeeId: string): Promise<string> {
    const state = Buffer.from(JSON.stringify({ employeeId })).toString("base64");

    const authCodeUrlParameters = {
      scopes: SCOPES,
      redirectUri: env.TEAMS_AZURE_REDIRECT_URI,
      state,
    };

    return await this.msalClient.getAuthCodeUrl(authCodeUrlParameters);
  }

  async exchangeCodeForToken(code: string, employeeId: string) {
    const tokenRequest = {
      code,
      scopes: SCOPES,
      redirectUri: env.TEAMS_AZURE_REDIRECT_URI,
    };

    const response = await this.msalClient.acquireTokenByCode(tokenRequest);

    if (!response) {
      throw new Error("Failed to acquire token");
    }

    const account = response.account;
    if (!account) {
      throw new Error("No account returned from token exchange");
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new Error(`Employee with ID ${employeeId} not found in database`);
    }

    await prisma.microsoftGraphToken.upsert({
      where: { employeeId },
      create: {
        employeeId,
        accessToken: encryptionService.encrypt(response.accessToken),
        refreshToken: encryptionService.encrypt(account.homeAccountId),
        scope: response.scopes.join(" "),
        expiresAt: new Date(response.expiresOn!),
      },
      update: {
        accessToken: encryptionService.encrypt(response.accessToken),
        refreshToken: encryptionService.encrypt(account.homeAccountId),
        scope: response.scopes.join(" "),
        expiresAt: new Date(response.expiresOn!),
        lastRefreshedAt: new Date(),
      },
    });

    return response;
  }

  async getValidToken(employeeId: string): Promise<string> {
    const tokenRecord = await prisma.microsoftGraphToken.findUnique({
      where: { employeeId },
    });

    if (!tokenRecord) {
      throw new Error("User not connected to Teams. Please connect first.");
    }

    const now = new Date();
    const expiresIn = tokenRecord.expiresAt.getTime() - now.getTime();

    if (expiresIn > TOKEN_REFRESH_THRESHOLD_MS) {
      return encryptionService.decrypt(tokenRecord.accessToken);
    }

    logger.info(`Refreshing token for employee ${employeeId}`);

    const homeAccountId = encryptionService.decrypt(tokenRecord.refreshToken);

    const accounts = await this.msalClient.getTokenCache().getAllAccounts();
    const account = accounts.find(acc => acc.homeAccountId === homeAccountId);

    if (!account) {
      await prisma.microsoftGraphToken.delete({ where: { employeeId } });
      throw new Error(
        "Account not found in token cache. Please reconnect your Teams account.",
      );
    }

    const silentRequest = {
      account,
      scopes: SCOPES,
      forceRefresh: false,
    };

    try {
      const response = await this.msalClient.acquireTokenSilent(silentRequest);

      await prisma.microsoftGraphToken.update({
        where: { employeeId },
        data: {
          accessToken: encryptionService.encrypt(response.accessToken),
          expiresAt: new Date(response.expiresOn!),
          lastRefreshedAt: new Date(),
        },
      });

      return response.accessToken;
    }
    catch (error) {
      await prisma.microsoftGraphToken.delete({ where: { employeeId } });
      throw new Error(
        "Token refresh failed. Please reconnect your Teams account.",
      );
    }
  }

  async isConnected(employeeId: string): Promise<boolean> {
    const token = await prisma.microsoftGraphToken.findUnique({
      where: { employeeId },
    });
    return !!token;
  }

  async disconnect(employeeId: string): Promise<void> {
    await prisma.microsoftGraphToken.delete({
      where: { employeeId },
    });
  }
}

export const graphAuthService = new GraphAuthService();
