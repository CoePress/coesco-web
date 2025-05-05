import { AuthorizationCodeRequest } from "@azure/msal-node";
import * as msal from "@azure/msal-node";

import Services from ".";
import { env } from "@/config/env";
import { AuthResponse, SessionData, IUser } from "@machining/types";
import { AppError } from "@/middleware/error-handler";
import {
  ILoginResponse,
  ISessionResponse,
  IAuthService,
  IAuthResult,
} from "@/utils/types";

interface IMsalConfig {
  auth: {
    clientId: string;
    authority: string;
    clientSecret: string;
  };
  system: {
    loggerOptions: {
      logLevel: msal.LogLevel;
      piiLoggingEnabled: boolean;
    };
  };
}

class AuthService implements IAuthService {
  private static readonly REDIS_PREFIX = "auth:session:";
  private static readonly SESSION_TTL = 86400; // 24 hours in seconds
  private static readonly MSAL_SCOPES = [
    "user.read",
    "profile",
    "email",
    "openid",
  ];
  private static readonly MAX_RETRIES = 3;
  private static readonly BASE_RETRY_DELAY = 1000;
  private static readonly TOKEN_TIMEOUT = 15000;

  private readonly msalConfig: IMsalConfig;
  private readonly msalClient: msal.ConfidentialClientApplication;

  constructor(
    private readonly services: Services,
    private readonly cryptoProvider = new msal.CryptoProvider()
  ) {
    this.msalConfig = {
      auth: {
        clientId: env.AZURE_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${env.AZURE_TENANT_ID}`,
        clientSecret: env.AZURE_CLIENT_SECRET,
      },
      system: {
        loggerOptions: {
          logLevel: msal.LogLevel.Error,
          piiLoggingEnabled: false,
        },
      },
    };

    this.msalClient = new msal.ConfidentialClientApplication(this.msalConfig);
  }

  async login(): Promise<ILoginResponse> {
    const sessionId = this.cryptoProvider.createNewGuid();
    const authUrl = await this.getAuthUrl(sessionId);

    return {
      url: authUrl,
      sessionId,
    };
  }

  async validateSession(
    sessionId: string,
    authSession: string
  ): Promise<boolean> {
    const sessionData = await this.getSessionData(sessionId);

    if (!sessionData || sessionId !== authSession) {
      await this.deleteSession(sessionId);
      return false;
    }

    return true;
  }

  async handleMicrosoftCallback(
    code: string,
    sessionId: string
  ): Promise<IAuthResult> {
    const sessionData = await this.getSessionData(sessionId);

    if (!sessionData) {
      throw new AppError(400, "Invalid session");
    }

    const authResult = await this.handleCallback(code, sessionData.verifier);
    const user = await this.services.user.getUserByMicrosoftId(
      authResult.account.localAccountId
    );

    await Promise.all([
      this.services.user.updateUser(user.id, { lastLogin: new Date() }),
      this.deleteSession(sessionId),
    ]);

    return {
      user,
      token: authResult.accessToken,
    };
  }

  async getAuthUrl(sessionId: string): Promise<string> {
    const { verifier, challenge } =
      await this.cryptoProvider.generatePkceCodes();

    await this.services.redis.set(
      AuthService.REDIS_PREFIX + sessionId,
      {
        verifier,
        challenge,
        attempts: 0,
        lastAttempt: Date.now(),
      },
      AuthService.SESSION_TTL
    );

    const authUrlRequest: msal.AuthorizationUrlRequest = {
      scopes: AuthService.MSAL_SCOPES.slice(),
      redirectUri: env.AZURE_REDIRECT_URI,
      codeChallenge: challenge,
      codeChallengeMethod: "S256",
      state: sessionId,
      prompt: "select_account",
    };

    return this.msalClient.getAuthCodeUrl(authUrlRequest);
  }

  async getSession(user: IUser): Promise<ISessionResponse> {
    return {
      user,
      authenticated: !!user,
    };
  }

  async logout(): Promise<{ message: string }> {
    return { message: "Logged out successfully" };
  }

  private async getSessionData(sessionId: string): Promise<SessionData | null> {
    return this.services.redis.get<SessionData>(
      AuthService.REDIS_PREFIX + sessionId
    );
  }

  private async deleteSession(sessionId: string): Promise<void> {
    await this.services.redis.delete(AuthService.REDIS_PREFIX + sessionId);
  }

  private async handleCallback(
    code: string,
    verifier: string
  ): Promise<AuthResponse> {
    let retryCount = 0;

    while (retryCount < AuthService.MAX_RETRIES) {
      try {
        const tokenResponse = await this.acquireToken(code, verifier);

        if (!tokenResponse?.account || !tokenResponse?.accessToken) {
          throw new AppError(400, "Invalid token response");
        }

        return {
          accessToken: tokenResponse.accessToken,
          account: tokenResponse.account,
        };
      } catch (error) {
        retryCount++;

        if (retryCount < AuthService.MAX_RETRIES) {
          await this.exponentialBackoff(retryCount);
          continue;
        }

        throw error;
      }
    }

    throw new AppError(400, "Max retries exceeded");
  }

  private async acquireToken(code: string, verifier: string) {
    const codeRequest: AuthorizationCodeRequest = {
      code,
      scopes: AuthService.MSAL_SCOPES,
      redirectUri: env.AZURE_REDIRECT_URI,
      codeVerifier: verifier,
    };

    return Promise.race([
      this.msalClient.acquireTokenByCode(codeRequest),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new AppError(400, "Token acquisition timeout")),
          AuthService.TOKEN_TIMEOUT
        )
      ),
    ]);
  }

  private async exponentialBackoff(retryCount: number): Promise<void> {
    const delay = Math.min(
      AuthService.BASE_RETRY_DELAY * Math.pow(2, retryCount),
      10000
    );
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

export default AuthService;
