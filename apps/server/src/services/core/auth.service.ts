import { sign, verify } from "jsonwebtoken";
import { config } from "@/config/config";
import { UnauthorizedError } from "@/middleware/error.middleware";
import { compare } from "bcrypt";
import { ConfidentialClientApplication } from "@azure/msal-node";
import { SignOptions } from "jsonwebtoken";
import { randomUUID } from "crypto";
import { prisma } from "@/utils/prisma";
import { IAuthResponse, IAuthTokens } from "@/types/api.types";
import { UserRole } from "@prisma/client";

export class AuthService {
  private msalClient: ConfidentialClientApplication;

  constructor() {
    this.msalClient = new ConfidentialClientApplication({
      auth: {
        clientId: config.azureClientId,
        clientSecret: config.azureClientSecret,
        authority: `https://login.microsoftonline.com/${config.azureTenantId}`,
      },
    });
  }

  private generateTokens(userId: string): IAuthTokens {
    const token = sign({ userId, role: UserRole.USER }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    } as SignOptions);

    const refreshToken = sign(
      { userId, role: UserRole.USER },
      config.jwtSecret,
      { expiresIn: config.jwtRefreshExpiresIn } as SignOptions
    );

    return { token, refreshToken };
  }

  async login(email: string, password: string): Promise<any> {
    if (!email || !password) {
      throw new UnauthorizedError("Email and password are required");
    }

    const user = await prisma.user.findUnique({
      where: { username: email },
      include: { employee: true },
    });

    if (!user || !user.employee) {
      throw new UnauthorizedError("Invalid credentials");
    }

    if (!user.isActive) {
      throw new UnauthorizedError("Account is inactive");
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
        role: user.role,
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
      `https://login.microsoftonline.com/${config.azureTenantId}/oauth2/v2.0/authorize?` +
      `client_id=${config.azureClientId}&` +
      `response_type=code&` +
      `redirect_uri=${config.azureRedirectUri}&` +
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
      redirectUri: config.azureRedirectUri,
      scopes: ["openid", "profile", "email"],
    });

    if (!tokenResponse) {
      throw new UnauthorizedError("Failed to acquire token");
    }

    const userInfo = await this.getMicrosoftUserInfo(tokenResponse.accessToken);

    const user = await prisma.user.findUnique({
      where: { microsoftId: userInfo.id },
      include: { employee: true },
    });

    if (!user || !user.employee) {
      throw new UnauthorizedError("No account found for this Microsoft user");
    }

    if (!user.isActive) {
      throw new UnauthorizedError("Account is inactive");
    }

    const { token, refreshToken } = this.generateTokens(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        role: user.role,
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

    const decoded = verify(accessToken, config.jwtSecret) as {
      userId: string;
      role: UserRole;
    };

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
    });

    const employee = await prisma.employee.findUnique({
      where: {
        userId: user?.id,
      },
    });

    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    return {
      token: accessToken,
      refreshToken: "",
      user,
      employee,
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
          user: {
            create: {
              username: "sample@example.com",
              role: UserRole.USER,
            },
          },
          createdById: "system",
          updatedById: "system",
        },
      });
    }

    let user = await prisma.user.findUnique({
      where: { username: "sample@example.com" },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          username: "sample@example.com",
          employee: {
            connect: {
              id: employee.id,
            },
          },
          role: UserRole.USER,
        },
      });
    }

    const { token, refreshToken } = this.generateTokens(user.id);

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        role: user.role,
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
