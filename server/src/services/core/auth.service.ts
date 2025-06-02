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

  async login(email: string, password: string): Promise<any> {
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
      user: {
        id: user.id,
        role: user.userType,
      },
      employee: {
        id: user.employee.id,
        number: user.employee.number,
        firstName: user.employee.firstName,
        lastName: user.employee.lastName,
        email: user.employee.email,
        jobTitle: user.employee.jobTitle,
      },
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

  async callback(code: string, sessionId: string): Promise<any> {
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
      user: {
        id: user.id,
        role: user.userType,
      },
      employee: {
        id: user.employee.id,
        number: user.employee.number,
        firstName: user.employee.firstName,
        lastName: user.employee.lastName,
        email: user.employee.email,
        jobTitle: user.employee.jobTitle,
      },
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
      user,
      employee: user.employee,
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

  async testLogin(): Promise<any> {
    let employee = await prisma.employee.findUnique({
      where: { email: "sample@example.com" },
    });

    if (!employee) {
      employee = await prisma.employee.create({
        data: {
          firstName: "Sample",
          lastName: "Employee",
          email: "sample@example.com",
          jobTitle: "Sales Manager",
          number: randomUUID().slice(0, 6),
        },
      });
    }

    let user = await prisma.user.findUnique({
      where: { email: "sample@example.com" },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: "sample@example.com",
          employee: {
            connect: {
              id: employee.id,
            },
          },
          userType: UserType.USER,
        },
      });
    }

    const { token, refreshToken } = this.generateTokens(user.id);

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        role: user.userType,
      },
      employee: {
        id: employee.id,
        number: employee.number,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        jobTitle: employee.jobTitle,
      },
    };
  }
}
