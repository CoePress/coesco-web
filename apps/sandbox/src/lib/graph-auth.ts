import { ConfidentialClientApplication } from "@azure/msal-node";

import { encryptionService } from "./encryption";
import env from "./env";
import logger from "./logger";
import { prisma } from "./prisma";

const SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "https://graph.microsoft.com/Chat.ReadWrite",
  "https://graph.microsoft.com/Mail.Read",
  "https://graph.microsoft.com/Calendars.Read",
];

const TOKEN_REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

export class GraphTokenError extends Error {
  constructor(
    public code: "NOT_CONNECTED" | "REAUTH_REQUIRED" | "REFRESH_FAILED",
    message: string,
  ) {
    super(message);
    this.name = "GraphTokenError";
  }
}

export class GraphAuthService {
  private msalClient: ConfidentialClientApplication;

  constructor() {
    this.msalClient = new ConfidentialClientApplication({
      auth: {
        clientId: env.AZURE_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${env.AZURE_TENANT_ID}`,
        clientSecret: env.AZURE_CLIENT_SECRET,
      },
    });
  }

  async getAuthorizationUrl(state?: string): Promise<string> {
    return await this.msalClient.getAuthCodeUrl({
      scopes: SCOPES,
      redirectUri: env.AZURE_REDIRECT_URI,
      state,
    });
  }

  async handleCallback(code: string): Promise<{
    userId: string;
    isNewUser: boolean;
    microsoftId: string;
    email: string;
  }> {
    const response = await this.msalClient.acquireTokenByCode({
      code,
      scopes: SCOPES,
      redirectUri: env.AZURE_REDIRECT_URI,
    });

    if (!response || !response.account) {
      throw new Error("Failed to acquire token from Microsoft");
    }

    const account = response.account;
    const microsoftId = account.homeAccountId;
    const email = account.username;

    let user = await prisma.user.findFirst({
      where: {
        OR: [{ microsoftId }, { username: email }],
      },
    });

    const isNewUser = !user;
    const tokenData = {
      microsoftId,
      graphAccessToken: encryptionService.encrypt(response.accessToken),
      graphRefreshToken: encryptionService.encrypt(account.homeAccountId),
      graphTokenExpiresAt: response.expiresOn ? new Date(response.expiresOn) : null,
      graphTokenScope: response.scopes.join(" "),
      graphTokenUpdatedAt: new Date(),
      lastLogin: new Date(),
    };

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: tokenData,
      });
    }
    else {
      throw new Error("No matching user found. Please contact administrator.");
    }

    return {
      userId: user.id,
      isNewUser,
      microsoftId,
      email,
    };
  }

  async getValidToken(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        graphAccessToken: true,
        graphRefreshToken: true,
        graphTokenExpiresAt: true,
      },
    });

    if (!user?.graphAccessToken || !user?.graphRefreshToken) {
      throw new GraphTokenError(
        "NOT_CONNECTED",
        "User not connected to Microsoft. Please sign in with Microsoft.",
      );
    }

    const now = new Date();
    const expiresAt = user.graphTokenExpiresAt;

    if (expiresAt && expiresAt.getTime() - now.getTime() > TOKEN_REFRESH_THRESHOLD_MS) {
      return encryptionService.decrypt(user.graphAccessToken);
    }

    return await this.refreshToken(userId, user.graphRefreshToken);
  }

  private async refreshToken(userId: string, encryptedRefreshToken: string): Promise<string> {
    const homeAccountId = encryptionService.decrypt(encryptedRefreshToken);

    const accounts = await this.msalClient.getTokenCache().getAllAccounts();
    const account = accounts.find(acc => acc.homeAccountId === homeAccountId);

    if (!account) {
      await this.clearTokens(userId);
      throw new GraphTokenError(
        "REAUTH_REQUIRED",
        "Session expired. Please sign in with Microsoft again.",
      );
    }

    try {
      const response = await this.msalClient.acquireTokenSilent({
        account,
        scopes: SCOPES,
        forceRefresh: false,
      });

      await prisma.user.update({
        where: { id: userId },
        data: {
          graphAccessToken: encryptionService.encrypt(response.accessToken),
          graphTokenExpiresAt: response.expiresOn ? new Date(response.expiresOn) : null,
          graphTokenUpdatedAt: new Date(),
        },
      });

      logger.info("graph.token_refreshed", { userId });
      return response.accessToken;
    }
    catch (error) {
      logger.error("graph.refresh_failed", { userId, error });
      await this.clearTokens(userId);
      throw new GraphTokenError(
        "REFRESH_FAILED",
        "Failed to refresh token. Please sign in with Microsoft again.",
      );
    }
  }

  async clearTokens(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        graphAccessToken: null,
        graphRefreshToken: null,
        graphTokenExpiresAt: null,
        graphTokenScope: null,
        graphTokenUpdatedAt: null,
      },
    });
  }

  async isConnected(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { graphAccessToken: true },
    });
    return !!user?.graphAccessToken;
  }
}

export const graphAuthService = new GraphAuthService();
