import type { Request } from "express";
import type { SignOptions } from "jsonwebtoken";

import { ConfidentialClientApplication } from "@azure/msal-node";
import { LoginMethod, UserRole } from "@prisma/client";
import { compare, hash } from "bcrypt";
import { sign, verify } from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { IAuthResponse, IAuthTokens } from "@/types";

import { __dev__, env } from "@/config/env";
import { UnauthorizedError } from "@/middleware/error.middleware";
import { getClientIp } from "@/utils";
import { logger } from "@/utils/logger";
import { prisma } from "@/utils/prisma";

import { emailService, loginHistoryService, sessionService } from "..";

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

  private async safeLogAttempt(data: Parameters<typeof loginHistoryService.logAttempt>[0]): Promise<void> {
    try {
      await loginHistoryService.logAttempt(data);
    }
    catch (error) {
      logger.error("Failed to log login attempt:", error);
    }
  }

  private async createSessionWithRetry(
    data: Parameters<typeof sessionService.createSession>[0],
    maxRetries = 3,
  ): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await sessionService.createSession(data);
      }
      catch (error) {
        lastError = error as Error;
        logger.error(`Session creation attempt ${attempt}/${maxRetries} failed:`, error);

        if (attempt < maxRetries) {
          const delayMs = Math.min(1000 * 2 ** (attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    throw lastError;
  }

  private async safeQueuePasswordResetEmail(data: { to: string; resetToken: string; firstName: string }): Promise<void> {
    try {
      await emailService.sendPasswordReset(data);
    }
    catch (error) {
      logger.error("Failed to send password reset email:", error);
    }
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

  private parseExpiresIn(expiresIn: string): number {
    const units: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 24 * 60 * 60 * 1000;
    }

    const [, value, unit] = match;
    return Number.parseInt(value, 10) * units[unit];
  }

  async login(username: string, password: string, req?: Request): Promise<any> {
    if (!username || !password) {
      throw new UnauthorizedError("Username and password are required");
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: { employee: true },
    });

    if (!user || !user.employee) {
      if (req) {
        await this.safeLogAttempt({
          username,
          loginMethod: LoginMethod.PASSWORD,
          success: false,
          failureReason: "Invalid credentials",
          ipAddress: getClientIp(req),
          userAgent: req.headers["user-agent"],
        });
      }
      throw new UnauthorizedError("Invalid credentials");
    }

    if (!user.isActive) {
      if (req) {
        await this.safeLogAttempt({
          userId: user.id,
          username,
          loginMethod: LoginMethod.PASSWORD,
          success: false,
          failureReason: "Account is inactive",
          ipAddress: getClientIp(req),
          userAgent: req.headers["user-agent"],
        });
      }
      throw new UnauthorizedError("Account is inactive");
    }

    if (!user.password) {
      if (req) {
        await this.safeLogAttempt({
          userId: user.id,
          username,
          loginMethod: LoginMethod.PASSWORD,
          success: false,
          failureReason: "Password login not available",
          ipAddress: getClientIp(req),
          userAgent: req.headers["user-agent"],
        });
      }
      throw new UnauthorizedError("Password login not available for this account");
    }

    const isValidPassword = await compare(password, user.password);
    if (!isValidPassword) {
      if (req) {
        await this.safeLogAttempt({
          userId: user.id,
          username,
          loginMethod: LoginMethod.PASSWORD,
          success: false,
          failureReason: "Invalid password",
          ipAddress: getClientIp(req),
          userAgent: req.headers["user-agent"],
        });
      }
      throw new UnauthorizedError("Invalid credentials");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const { token, refreshToken } = this.generateTokens(user.id);

    let sessionId: string | undefined;

    if (req) {
      const session = await this.createSessionWithRetry({
        userId: user.id,
        token,
        refreshToken,
        loginMethod: LoginMethod.PASSWORD,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
        expiresIn: this.parseExpiresIn(env.JWT_EXPIRES_IN),
      });

      sessionId = session.id;

      await this.safeLogAttempt({
        userId: user.id,
        username,
        loginMethod: LoginMethod.PASSWORD,
        success: true,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
      });
    }

    return {
      token,
      refreshToken,
      sessionId,
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

    if (!/[A-Z]/.test(password)) {
      throw new UnauthorizedError("Password must contain at least one uppercase letter");
    }

    if (!/[a-z]/.test(password)) {
      throw new UnauthorizedError("Password must contain at least one lowercase letter");
    }

    if (!/\d/.test(password)) {
      throw new UnauthorizedError("Password must contain at least one number");
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw new UnauthorizedError("Password must contain at least one special character");
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

  async microsoftCallback(code: string, state: string, req?: Request): Promise<any> {
    if (!code || !state) {
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
      if (req) {
        await this.safeLogAttempt({
          username: userInfo.userPrincipalName || userInfo.mail,
          loginMethod: LoginMethod.MICROSOFT,
          success: false,
          failureReason: "No account found",
          ipAddress: getClientIp(req),
          userAgent: req.headers["user-agent"],
        });
      }
      throw new UnauthorizedError("No account found for this Microsoft user");
    }

    if (!user.isActive) {
      if (req) {
        await this.safeLogAttempt({
          userId: user.id,
          username: user.username || userInfo.userPrincipalName,
          loginMethod: LoginMethod.MICROSOFT,
          success: false,
          failureReason: "Account is inactive",
          ipAddress: getClientIp(req),
          userAgent: req.headers["user-agent"],
        });
      }
      throw new UnauthorizedError("Account is inactive");
    }

    const { token, refreshToken } = this.generateTokens(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    let sessionId: string | undefined;

    if (req) {
      const session = await this.createSessionWithRetry({
        userId: user.id,
        token,
        refreshToken,
        loginMethod: LoginMethod.MICROSOFT,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
        expiresIn: this.parseExpiresIn(env.JWT_EXPIRES_IN),
      });

      sessionId = session.id;

      await this.safeLogAttempt({
        userId: user.id,
        username: user.username || userInfo.userPrincipalName,
        loginMethod: LoginMethod.MICROSOFT,
        success: true,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
      });
    }

    return {
      token,
      refreshToken,
      sessionId,
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

    const session = await sessionService.validateSession(accessToken);

    return {
      token: accessToken,
      refreshToken: "",
      sessionId: session?.id,
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
    if (!__dev__) {
      return;
    }

    // eslint-disable-next-line node/prefer-global/process
    const defaultUsersPath = join(process.cwd(), "src/config/default-users.json");
    const defaultUsers = JSON.parse(readFileSync(defaultUsersPath, "utf-8"));

    for (const userData of defaultUsers) {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: userData.username },
            { employee: { email: userData.employee.email } },
          ],
        },
        include: { employee: true },
      });

      if (!existingUser) {
        const hashedPassword = await hash(userData.password, 12);
        const initials = `${userData.employee.firstName.charAt(0)}${userData.employee.lastName.charAt(0)}`.toUpperCase();

        await prisma.employee.create({
          data: {
            firstName: userData.employee.firstName,
            lastName: userData.employee.lastName,
            initials,
            email: userData.employee.email,
            title: userData.employee.title,
            number: userData.employee.number,
            user: {
              create: {
                username: userData.username,
                password: hashedPassword,
                role: userData.role as UserRole,
                isActive: true,
              },
            },
            createdById: "system",
            updatedById: "system",
          },
        });
      }
    }
  }

  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    const employee = await prisma.employee.findUnique({
      where: { email },
      include: { user: true },
    });

    if (!employee || !employee.user) {
      return {
        success: true,
        message: "If an account exists with this email, a password reset link has been sent.",
      };
    }

    const resetToken = randomUUID();
    const expiresAt = new Date(Date.now() + 3600000);

    await prisma.token.create({
      data: {
        userId: employee.user.id,
        type: "PASSWORD_RESET",
        token: resetToken,
        expiresAt,
      },
    });

    this.safeQueuePasswordResetEmail({
      to: email,
      resetToken,
      firstName: employee.firstName,
    });

    return {
      success: true,
      message: "If an account exists with this email, a password reset link has been sent.",
    };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!token || !newPassword) {
      return {
        success: false,
        error: "Token and new password are required",
      };
    }

    if (newPassword.length < 8) {
      return {
        success: false,
        error: "Password must be at least 8 characters long",
      };
    }

    if (!/[A-Z]/.test(newPassword)) {
      return {
        success: false,
        error: "Password must contain at least one uppercase letter",
      };
    }

    if (!/[a-z]/.test(newPassword)) {
      return {
        success: false,
        error: "Password must contain at least one lowercase letter",
      };
    }

    if (!/\d/.test(newPassword)) {
      return {
        success: false,
        error: "Password must contain at least one number",
      };
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      return {
        success: false,
        error: "Password must contain at least one special character",
      };
    }

    const tokenRecord = await prisma.token.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.type !== "PASSWORD_RESET") {
      return {
        success: false,
        error: "Invalid or expired reset token",
      };
    }

    if (tokenRecord.expiresAt < new Date()) {
      await prisma.token.delete({ where: { id: tokenRecord.id } });
      return {
        success: false,
        error: "Reset token has expired",
      };
    }

    const hashedPassword = await hash(newPassword, 12);

    await prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { password: hashedPassword },
    });

    await prisma.token.delete({ where: { id: tokenRecord.id } });

    return {
      success: true,
      message: "Password has been reset successfully",
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!userId || !currentPassword || !newPassword) {
      return {
        success: false,
        error: "User ID, current password, and new password are required",
      };
    }

    if (newPassword.length < 8) {
      return {
        success: false,
        error: "Password must be at least 8 characters long",
      };
    }

    if (!/[A-Z]/.test(newPassword)) {
      return {
        success: false,
        error: "Password must contain at least one uppercase letter",
      };
    }

    if (!/[a-z]/.test(newPassword)) {
      return {
        success: false,
        error: "Password must contain at least one lowercase letter",
      };
    }

    if (!/\d/.test(newPassword)) {
      return {
        success: false,
        error: "Password must contain at least one number",
      };
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      return {
        success: false,
        error: "Password must contain at least one special character",
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.password) {
      return {
        success: false,
        error: "User not found or password login not available",
      };
    }

    const isValidPassword = await compare(currentPassword, user.password);
    if (!isValidPassword) {
      return {
        success: false,
        error: "Current password is incorrect",
      };
    }

    const hashedPassword = await hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return {
      success: true,
      message: "Password changed successfully",
    };
  }

  async testLogin(req?: Request): Promise<any> {
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

    if (req) {
      await this.createSessionWithRetry({
        userId: user.id,
        token,
        refreshToken,
        loginMethod: LoginMethod.PASSWORD,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
        expiresIn: this.parseExpiresIn(env.JWT_EXPIRES_IN),
      });

      await this.safeLogAttempt({
        userId: user.id,
        username: user.username!,
        loginMethod: LoginMethod.PASSWORD,
        success: true,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
      });
    }

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
