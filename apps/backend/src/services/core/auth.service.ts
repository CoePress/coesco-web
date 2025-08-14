import type { SignOptions } from "jsonwebtoken";

import { ConfidentialClientApplication } from "@azure/msal-node";
import { UserRole } from "@prisma/client";
import { compare } from "bcrypt";
import { sign, verify } from "jsonwebtoken";
import { randomUUID } from "node:crypto";

import type { IAuthResponse, IAuthTokens } from "@/types";

import { env } from "@/config/env";
import { UnauthorizedError } from "@/middleware/error.middleware";
import { prisma } from "@/utils/prisma";

export class AuthService {
  private msalClient: ConfidentialClientApplication;

  constructor() {
    this.msalClient = new ConfidentialClientApplication({
      auth: {
        clientId: env.AZURE_CLIENT_ID,
        clientSecret: env.AZURE_CLIENT_SECRET,
        authority: `https://login.microsoftonline.com/${env.AZURE_TENANT_ID}`,
      },
    });
  }

  private generateTokens(userId: string): IAuthTokens {
    const token = sign({ userId, role: UserRole.USER }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    } as SignOptions);

    const refreshToken = sign(
      { userId, role: UserRole.USER },
      env.JWT_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as SignOptions,
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

  async microsoftLogin(): Promise<string> {
    const sessionId = randomUUID();
    return (
      `https://login.microsoftonline.com/${env.AZURE_TENANT_ID}/oauth2/v2.0/authorize?`
      + `client_id=${env.AZURE_CLIENT_ID}&`
      + `response_type=code&`
      + `redirect_uri=${env.AZURE_REDIRECT_URI}&`
      + `response_mode=query&`
      + `scope=openid profile email&`
      + `prompt=select_account&`
      + `state=${sessionId}`
    );
  }

  async microsoftCallback(code: string, sessionId: string): Promise<any> {
    if (!code || !sessionId) {
      throw new UnauthorizedError("Code and session ID are required");
    }

    const tokenResponse = await this.msalClient.acquireTokenByCode({
      code,
      redirectUri: env.AZURE_REDIRECT_URI,
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

    const decoded = verify(accessToken, env.JWT_SECRET) as {
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
