import type { SignOptions } from "jsonwebtoken";

import { ConfidentialClientApplication } from "@azure/msal-node";
import { UserRole } from "@prisma/client";
import { compare, hash } from "bcrypt";
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

  async login(username: string, password: string): Promise<any> {
    if (!username || !password) {
      throw new UnauthorizedError("Username and password are required");
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: { employee: true },
    });

    if (!user || !user.employee) {
      throw new UnauthorizedError("Invalid credentials");
    }

    if (!user.isActive) {
      throw new UnauthorizedError("Account is inactive");
    }

    if (!user.password) {
      throw new UnauthorizedError("Password login not available for this account");
    }

    const isValidPassword = await compare(password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedError("Invalid credentials");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

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
        title: user.employee.title,
      },
    };
  }

  async register(userData: {
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    title: string;
    email?: string;
  }): Promise<any> {
    const { username, password, firstName, lastName, title, email } = userData;

    if (!username || !password || !firstName || !lastName) {
      throw new UnauthorizedError("All fields are required");
    }

    if (password.length < 8) {
      throw new UnauthorizedError("Password must be at least 8 characters long");
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      throw new UnauthorizedError("User already exists");
    }

    if (email) {
      const existingEmployee = await prisma.employee.findUnique({
        where: { email },
      });

      if (existingEmployee) {
        throw new UnauthorizedError("Employee with this email already exists");
      }
    }

    const hashedPassword = await hash(password, 12);

    const employee = await prisma.employee.create({
      data: {
        firstName,
        lastName,
        initials: `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase(),
        email,
        title,
        number: randomUUID().slice(0, 8),
        user: {
          create: {
            username,
            password: hashedPassword,
            role: UserRole.USER,
            isActive: true,
          },
        },
        createdById: "system",
        updatedById: "system",
      },
      include: {
        user: true,
      },
    });

    const { token, refreshToken } = this.generateTokens(employee.user!.id);

    return {
      token,
      refreshToken,
      user: {
        id: employee.user!.id,
        role: employee.user!.role,
      },
      employee: {
        id: employee.id,
        number: employee.number,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        title: employee.title,
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
        title: user.employee.title,
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

  async initializeDefaultUser(): Promise<void> {
    const adminEmail = "admin@cpec.com";
    const adminUsername = "admin";

    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { username: adminUsername },
          { employee: { email: adminEmail } },
        ],
      },
      include: { employee: true },
    });

    if (!existingAdmin) {
      const hashedAdminPassword = await hash("admin123", 12);

      await prisma.employee.create({
        data: {
          firstName: "Default",
          lastName: "Admin",
          initials: "DA",
          email: adminEmail,
          title: "Administrator",
          number: "ADM001",
          user: {
            create: {
              username: adminUsername,
              password: hashedAdminPassword,
              role: UserRole.ADMIN,
              isActive: true,
            },
          },
          createdById: "system",
          updatedById: "system",
        },
      });
    }

    const userEmail = "user@cpec.com";
    const userUsername = "user";

    const existingRegularUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: userUsername },
          { employee: { email: userEmail } },
        ],
      },
      include: { employee: true },
    });

    if (!existingRegularUser) {
      const hashedUserPassword = await hash("user123", 12);

      await prisma.employee.create({
        data: {
          firstName: "Regular",
          lastName: "User",
          initials: "RU",
          email: userEmail,
          title: "Employee",
          number: "USR001",
          user: {
            create: {
              username: userUsername,
              password: hashedUserPassword,
              role: UserRole.USER,
              isActive: true,
            },
          },
          createdById: "system",
          updatedById: "system",
        },
      });
    }
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
          initials: "sys",
          email: "sample@example.com",
          title: "Sales Manager",
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
        title: employee.title,
      },
    };
  }
}
