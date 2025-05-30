import { IAuthResponse, IAuthTokens, IAuthService } from "@/types/auth.types";
import { sign, verify } from "jsonwebtoken";
import { config } from "@/config/config";
import { UnauthorizedError } from "@/middleware/error.middleware";
import { compare } from "bcrypt";
import { ConfidentialClientApplication } from "@azure/msal-node";
import { SignOptions } from "jsonwebtoken";
import { UserType, Employee } from "@prisma/client";
import { randomUUID } from "crypto";
import { prisma } from "@/utils/prisma";

export class AuthService implements IAuthService {
  private msalClient: ConfidentialClientApplication;

  constructor() {
    this.msalClient = new ConfidentialClientApplication({
      auth: {
        clientId: config.azure.clientId,
        clientSecret: config.azure.clientSecret,
        authority: `https://login.microsoftonline.com/${config.azure.tenantId}`,
      },
    });
  }

  private generateTokens(userId: string): IAuthTokens {
    const token = sign({ userId, userType: UserType.USER }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    } as SignOptions);

    const refreshToken = sign(
      { userId, userType: UserType.USER },
      config.jwt.secret,
      { expiresIn: config.jwt.refreshExpiresIn } as SignOptions
    );

    return { token, refreshToken };
  }

  async login(email: string, password: string): Promise<IAuthResponse> {
    if (!email || !password) {
      throw new UnauthorizedError("Email and password are required");
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { employee: true },
    });

    if (!user || !user.employee) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const isValidPassword = await compare(password, user.password || "");
    if (!isValidPassword) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const { token, refreshToken } = this.generateTokens(user.id);

    return {
      token,
      refreshToken,
      userType: user.userType,
      user: user.employee,
    };
  }

  async loginWithMicrosoft(): Promise<string> {
    const sessionId = randomUUID();
    return (
      `https://login.microsoftonline.com/${config.azure.tenantId}/oauth2/v2.0/authorize?` +
      `client_id=${config.azure.clientId}&` +
      `response_type=code&` +
      `redirect_uri=${config.azure.redirectUri}&` +
      `response_mode=query&` +
      `scope=openid profile email&` +
      `prompt=select_account&` +
      `state=${sessionId}`
    );
  }

  async callback(code: string, sessionId: string): Promise<IAuthResponse> {
    if (!code || !sessionId) {
      throw new UnauthorizedError("Code and session ID are required");
    }

    const tokenResponse = await this.msalClient.acquireTokenByCode({
      code,
      redirectUri: config.azure.redirectUri,
      scopes: ["openid", "profile", "email"],
    });

    if (!tokenResponse) {
      throw new UnauthorizedError("Failed to acquire token");
    }

    const userInfo = await this.getMicrosoftUserInfo(tokenResponse.accessToken);

    const user = await prisma.user.findUnique({
      where: { email: userInfo.mail },
      include: { employee: true },
    });

    if (!user || !user.employee) {
      throw new UnauthorizedError("No account found for this Microsoft user");
    }

    const { token, refreshToken } = this.generateTokens(user.id);

    return {
      token,
      refreshToken,
      userType: user.userType,
      user: user.employee,
    };
  }

  async session(accessToken: string): Promise<IAuthResponse> {
    if (!accessToken) {
      throw new UnauthorizedError("Access token is required");
    }

    const decoded = verify(accessToken, config.jwt.secret) as {
      userId: string;
      userType: UserType;
    };

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
      include: { employee: true },
    });

    if (!user || !user.employee) {
      throw new UnauthorizedError("User not found");
    }

    return {
      token: accessToken,
      refreshToken: "",
      userType: decoded.userType,
      user: user.employee,
    };
  }

  private async getMicrosoftUserInfo(accessToken: string) {
    const response = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new UnauthorizedError("Failed to get user info from Microsoft");
    }

    return response.json();
  }

  async testLogin(): Promise<IAuthResponse> {
    let testEmployee = await prisma.employee.findUnique({
      where: { email: "test@example.com" },
    });

    if (!testEmployee) {
      testEmployee = await prisma.employee.create({
        data: {
          firstName: "Test",
          lastName: "User",
          email: "test@example.com",
          jobTitle: "Test Job",
          number: "TEST",
        },
      });
    }

    let user = await prisma.user.findUnique({
      where: { email: "test@example.com" },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: "test@example.com",
          employeeId: testEmployee.id,
          userType: UserType.USER,
        },
      });
    }

    const { token, refreshToken } = this.generateTokens(user.id);

    return {
      token,
      refreshToken,
      userType: user.userType,
      user: testEmployee,
    };
  }
}
