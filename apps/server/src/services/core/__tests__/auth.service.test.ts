import type { Request } from "express";

import { LoginMethod, UserRole } from "@prisma/client";
import { compare, hash } from "bcrypt";
import { sign, verify } from "jsonwebtoken";

import { env } from "@/config/env";
import { UnauthorizedError } from "@/middleware/error.middleware";
import { emailService, loginHistoryService, sessionService } from "@/services";
import { prisma } from "@/utils/prisma";

import { AuthService } from "../auth.service";

jest.mock("bcrypt");
jest.mock("jsonwebtoken");
jest.mock("@/utils/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    employee: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    token: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));
jest.mock("@/services", () => ({
  emailService: {
    sendPasswordReset: jest.fn(),
  },
  loginHistoryService: {
    logAttempt: jest.fn(),
  },
  sessionService: {
    createSession: jest.fn(),
    validateSession: jest.fn(),
  },
}));
jest.mock("@azure/msal-node", () => ({
  ConfidentialClientApplication: jest.fn().mockImplementation(() => ({
    acquireTokenByCode: jest.fn(),
  })),
}));

describe("authService", () => {
  let authService: AuthService;
  let mockRequest: Partial<Request>;

  beforeEach(() => {
    authService = new AuthService();
    mockRequest = {
      headers: { "user-agent": "test-agent" },
      ip: "127.0.0.1",
    };
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("login", () => {
    const mockUser = {
      id: "user-123",
      username: "testuser",
      password: "hashed-password",
      role: UserRole.USER,
      isActive: true,
      employee: {
        id: "emp-123",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        title: "Developer",
        number: "123",
      },
    };

    it("should successfully login with valid credentials", async () => {
      jest.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      jest.mocked(compare).mockResolvedValue(true as never);
      jest.mocked(sign).mockReturnValue("mock-token" as any);
      jest.mocked(sessionService.createSession).mockResolvedValue({
        id: "session-123",
      } as any);

      const result = await authService.login("testuser", "password123", mockRequest as Request);

      expect(result.token).toBe("mock-token");
      expect(result.refreshToken).toBe("mock-token");
      expect(result.user.id).toBe("user-123");
      expect(result.employee.id).toBe("emp-123");
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: { lastLogin: expect.any(Date) },
      });
      expect(sessionService.createSession).toHaveBeenCalled();
      expect(loginHistoryService.logAttempt).toHaveBeenCalledWith(
        expect.objectContaining({ success: true }),
      );
    });

    it("should throw error when username is missing", async () => {
      await expect(authService.login("", "password123")).rejects.toThrow(
        UnauthorizedError,
      );
      await expect(authService.login("", "password123")).rejects.toThrow(
        "Username and password are required",
      );
    });

    it("should throw error when password is missing", async () => {
      await expect(authService.login("testuser", "")).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it("should throw error and log attempt when user not found", async () => {
      jest.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(
        authService.login("nonexistent", "password123", mockRequest as Request),
      ).rejects.toThrow("Invalid credentials");

      expect(loginHistoryService.logAttempt).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          failureReason: "Invalid credentials",
        }),
      );
    });

    it("should throw error when user has no employee", async () => {
      jest.mocked(prisma.user.findUnique).mockResolvedValue({
        ...mockUser,
        employee: null,
      } as any);

      await expect(
        authService.login("testuser", "password123", mockRequest as Request),
      ).rejects.toThrow("Invalid credentials");
    });

    it("should throw error when account is inactive", async () => {
      jest.mocked(prisma.user.findUnique).mockResolvedValue({
        ...mockUser,
        isActive: false,
      } as any);

      await expect(
        authService.login("testuser", "password123", mockRequest as Request),
      ).rejects.toThrow("Account is inactive");

      expect(loginHistoryService.logAttempt).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          failureReason: "Account is inactive",
        }),
      );
    });

    it("should throw error when user has no password set", async () => {
      jest.mocked(prisma.user.findUnique).mockResolvedValue({
        ...mockUser,
        password: null,
      } as any);

      await expect(
        authService.login("testuser", "password123", mockRequest as Request),
      ).rejects.toThrow("Password login not available for this account");

      expect(loginHistoryService.logAttempt).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          failureReason: "Password login not available",
        }),
      );
    });

    it("should throw error when password is invalid", async () => {
      jest.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      jest.mocked(compare).mockResolvedValue(false as never);

      await expect(
        authService.login("testuser", "wrongpassword", mockRequest as Request),
      ).rejects.toThrow("Invalid credentials");

      expect(loginHistoryService.logAttempt).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          failureReason: "Invalid password",
        }),
      );
    });

    it("should work without request object", async () => {
      jest.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      jest.mocked(compare).mockResolvedValue(true as never);
      jest.mocked(sign).mockReturnValue("mock-token" as any);

      const result = await authService.login("testuser", "password123");

      expect(result.token).toBe("mock-token");
      expect(result.sessionId).toBeUndefined();
      expect(sessionService.createSession).not.toHaveBeenCalled();
      expect(loginHistoryService.logAttempt).not.toHaveBeenCalled();
    });

    it("should throw error when sessionService.createSession fails after retries", async () => {
      jest.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      jest.mocked(compare).mockResolvedValue(true as never);
      jest.mocked(sign).mockReturnValue("mock-token" as any);
      jest.mocked(sessionService.createSession).mockRejectedValue(
        new Error("Database connection lost"),
      );

      await expect(
        authService.login("testuser", "password123", mockRequest as Request),
      ).rejects.toThrow("Database connection lost");

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: { lastLogin: expect.any(Date) },
      });
      expect(sessionService.createSession).toHaveBeenCalledTimes(3);
    });

    it("should succeed even when loginHistoryService.logAttempt fails on success (non-blocking)", async () => {
      jest.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      jest.mocked(compare).mockResolvedValue(true as never);
      jest.mocked(sign).mockReturnValue("mock-token" as any);
      jest.mocked(sessionService.createSession).mockResolvedValue({
        id: "session-123",
      } as any);
      jest.mocked(loginHistoryService.logAttempt).mockRejectedValue(
        new Error("Audit log service unavailable"),
      );

      const result = await authService.login("testuser", "password123", mockRequest as Request);

      expect(result.token).toBe("mock-token");
      expect(result.sessionId).toBe("session-123");
      expect(sessionService.createSession).toHaveBeenCalled();
    });

    it("should succeed even when loginHistoryService.logAttempt fails on invalid credentials (non-blocking)", async () => {
      jest.mocked(prisma.user.findUnique).mockResolvedValue(null);
      jest.mocked(loginHistoryService.logAttempt).mockRejectedValue(
        new Error("Failed to log attempt"),
      );

      await expect(
        authService.login("testuser", "password123", mockRequest as Request),
      ).rejects.toThrow("Invalid credentials");

      expect(loginHistoryService.logAttempt).toHaveBeenCalled();
    });

    it("should throw error when prisma.user.update fails after password check", async () => {
      jest.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      jest.mocked(compare).mockResolvedValue(true as never);
      jest.mocked(prisma.user.update).mockRejectedValue(
        new Error("Database write failed"),
      );

      await expect(
        authService.login("testuser", "password123", mockRequest as Request),
      ).rejects.toThrow("Database write failed");
    });
  });

  describe("register", () => {
    const mockRegistrationData = {
      username: "newuser",
      password: "Password123!",
      firstName: "Jane",
      lastName: "Smith",
      title: "Manager",
      email: "jane@example.com",
    };

    const mockCreatedEmployee = {
      id: "emp-456",
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com",
      title: "Manager",
      number: "EMP-001",
      initials: "JS",
      user: {
        id: "user-456",
        username: "newuser",
        role: UserRole.USER,
      },
    };

    beforeEach(() => {
      jest.mocked(prisma.user.findUnique).mockResolvedValue(null);
      jest.mocked(prisma.employee.findUnique).mockResolvedValue(null);
      jest.mocked(hash).mockResolvedValue("hashed-password" as never);
      jest.mocked(sign).mockReturnValue("mock-token" as any);
    });

    it("should successfully register a new user", async () => {
      jest.mocked(prisma.employee.create).mockResolvedValue(mockCreatedEmployee as any);

      const result = await authService.register(mockRegistrationData);

      expect(result.token).toBe("mock-token");
      expect(result.user.id).toBe("user-456");
      expect(result.employee.id).toBe("emp-456");
      expect(hash).toHaveBeenCalledWith("Password123!", 12);
      expect(prisma.employee.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            firstName: "Jane",
            lastName: "Smith",
            initials: "JS",
          }),
        }),
      );
    });

    it("should throw error when username is missing", async () => {
      await expect(
        authService.register({ ...mockRegistrationData, username: "" }),
      ).rejects.toThrow("All fields are required");
    });

    it("should throw error when password is too short", async () => {
      await expect(
        authService.register({ ...mockRegistrationData, password: "Pass1!" }),
      ).rejects.toThrow("Password must be at least 8 characters long");
    });

    it("should throw error when password has no uppercase letter", async () => {
      await expect(
        authService.register({ ...mockRegistrationData, password: "password123!" }),
      ).rejects.toThrow("Password must contain at least one uppercase letter");
    });

    it("should throw error when password has no lowercase letter", async () => {
      await expect(
        authService.register({ ...mockRegistrationData, password: "PASSWORD123!" }),
      ).rejects.toThrow("Password must contain at least one lowercase letter");
    });

    it("should throw error when password has no number", async () => {
      await expect(
        authService.register({ ...mockRegistrationData, password: "Password!" }),
      ).rejects.toThrow("Password must contain at least one number");
    });

    it("should throw error when password has no special character", async () => {
      await expect(
        authService.register({ ...mockRegistrationData, password: "Password123" }),
      ).rejects.toThrow("Password must contain at least one special character");
    });

    it("should throw error when username already exists", async () => {
      jest.mocked(prisma.user.findUnique).mockResolvedValue({ id: "existing" } as any);

      await expect(authService.register(mockRegistrationData)).rejects.toThrow(
        "User already exists",
      );
    });

    it("should throw error when email already exists", async () => {
      jest.mocked(prisma.employee.findUnique).mockResolvedValue({ id: "existing" } as any);

      await expect(authService.register(mockRegistrationData)).rejects.toThrow(
        "Employee with this email already exists",
      );
    });

    it("should work without email", async () => {
      jest.mocked(prisma.employee.create).mockResolvedValue(mockCreatedEmployee as any);

      const dataWithoutEmail = { ...mockRegistrationData, email: undefined };
      const result = await authService.register(dataWithoutEmail);

      expect(result.token).toBe("mock-token");
      expect(prisma.employee.findUnique).not.toHaveBeenCalled();
    });
  });

  describe("requestPasswordReset", () => {
    it("should create reset token and send email when user exists", async () => {
      const mockEmployee = {
        id: "emp-123",
        firstName: "John",
        email: "john@example.com",
        user: {
          id: "user-123",
        },
      };

      jest.mocked(prisma.employee.findUnique).mockResolvedValue(mockEmployee as any);
      jest.mocked(prisma.token.create).mockResolvedValue({ id: "token-123" } as any);

      const result = await authService.requestPasswordReset("john@example.com");

      expect(result.success).toBe(true);
      expect(prisma.token.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "user-123",
            type: "PASSWORD_RESET",
            token: expect.any(String),
          }),
        }),
      );
      expect(emailService.sendPasswordReset).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "john@example.com",
          firstName: "John",
        }),
      );
    });

    it("should return success message even when user does not exist", async () => {
      jest.mocked(prisma.employee.findUnique).mockResolvedValue(null);

      const result = await authService.requestPasswordReset("nonexistent@example.com");

      expect(result.success).toBe(true);
      expect(result.message).toContain("If an account exists");
      expect(prisma.token.create).not.toHaveBeenCalled();
      expect(emailService.sendPasswordReset).not.toHaveBeenCalled();
    });

    it("should throw error when prisma.token.create fails", async () => {
      const mockEmployee = {
        id: "emp-123",
        firstName: "John",
        email: "john@example.com",
        user: {
          id: "user-123",
        },
      };

      jest.mocked(prisma.employee.findUnique).mockResolvedValue(mockEmployee as any);
      jest.mocked(prisma.token.create).mockRejectedValue(
        new Error("Database write failed"),
      );

      await expect(
        authService.requestPasswordReset("john@example.com"),
      ).rejects.toThrow("Database write failed");

      expect(emailService.sendPasswordReset).not.toHaveBeenCalled();
    });

    it("should succeed even when emailService.sendPasswordReset fails (non-blocking)", async () => {
      const mockEmployee = {
        id: "emp-123",
        firstName: "John",
        email: "john@example.com",
        user: {
          id: "user-123",
        },
      };

      jest.mocked(prisma.employee.findUnique).mockResolvedValue(mockEmployee as any);
      jest.mocked(prisma.token.create).mockResolvedValue({ id: "token-123" } as any);
      jest.mocked(emailService.sendPasswordReset).mockRejectedValue(
        new Error("SMTP server unavailable"),
      );

      const result = await authService.requestPasswordReset("john@example.com");

      expect(result.success).toBe(true);
      expect(prisma.token.create).toHaveBeenCalled();
      expect(emailService.sendPasswordReset).toHaveBeenCalled();
    });
  });

  describe("resetPassword", () => {
    const validToken = "valid-reset-token";
    const newPassword = "NewPassword123!";

    it("should successfully reset password with valid token", async () => {
      const mockTokenRecord = {
        id: "token-123",
        token: validToken,
        type: "PASSWORD_RESET",
        userId: "user-123",
        expiresAt: new Date(Date.now() + 3600000),
        user: { id: "user-123" },
      };

      jest.mocked(prisma.token.findUnique).mockResolvedValue(mockTokenRecord as any);
      jest.mocked(hash).mockResolvedValue("new-hashed-password" as never);

      const result = await authService.resetPassword(validToken, newPassword);

      expect(result.success).toBe(true);
      expect(result.message).toBe("Password has been reset successfully");
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: { password: "new-hashed-password" },
      });
      expect(prisma.token.delete).toHaveBeenCalledWith({ where: { id: "token-123" } });
    });

    it("should return error when token is missing", async () => {
      const result = await authService.resetPassword("", newPassword);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Token and new password are required");
    });

    it("should return error when password is too short", async () => {
      const result = await authService.resetPassword(validToken, "Short1!");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Password must be at least 8 characters long");
    });

    it("should return error when token is invalid", async () => {
      jest.mocked(prisma.token.findUnique).mockResolvedValue(null);

      const result = await authService.resetPassword(validToken, newPassword);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid or expired reset token");
    });

    it("should return error when token is expired", async () => {
      const mockTokenRecord = {
        id: "token-123",
        token: validToken,
        type: "PASSWORD_RESET",
        userId: "user-123",
        expiresAt: new Date(Date.now() - 1000),
        user: { id: "user-123" },
      };

      jest.mocked(prisma.token.findUnique).mockResolvedValue(mockTokenRecord as any);

      const result = await authService.resetPassword(validToken, newPassword);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Reset token has expired");
      expect(prisma.token.delete).toHaveBeenCalledWith({ where: { id: "token-123" } });
    });

    it("should validate all password requirements", async () => {
      const testCases = [
        { password: "password123!", error: "uppercase letter" },
        { password: "PASSWORD123!", error: "lowercase letter" },
        { password: "Password!", error: "number" },
        { password: "Password123", error: "special character" },
      ];

      for (const { password, error } of testCases) {
        const result = await authService.resetPassword(validToken, password);
        expect(result.success).toBe(false);
        expect(result.error).toContain(error);
      }
    });
  });

  describe("changePassword", () => {
    const userId = "user-123";
    const currentPassword = "OldPassword123!";
    const newPassword = "NewPassword123!";

    it("should successfully change password", async () => {
      const mockUser = {
        id: userId,
        password: "hashed-old-password",
      };

      jest.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      jest.mocked(compare).mockResolvedValue(true as never);
      jest.mocked(hash).mockResolvedValue("new-hashed-password" as never);

      const result = await authService.changePassword(userId, currentPassword, newPassword);

      expect(result.success).toBe(true);
      expect(result.message).toBe("Password changed successfully");
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { password: "new-hashed-password" },
      });
    });

    it("should return error when fields are missing", async () => {
      const result = await authService.changePassword("", currentPassword, newPassword);

      expect(result.success).toBe(false);
      expect(result.error).toContain("required");
    });

    it("should return error when current password is incorrect", async () => {
      const mockUser = {
        id: userId,
        password: "hashed-old-password",
      };

      jest.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      jest.mocked(compare).mockResolvedValue(false as never);

      const result = await authService.changePassword(userId, "wrongpassword", newPassword);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Current password is incorrect");
    });

    it("should return error when user not found", async () => {
      jest.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await authService.changePassword(userId, currentPassword, newPassword);

      expect(result.success).toBe(false);
      expect(result.error).toBe("User not found or password login not available");
    });

    it("should validate new password requirements", async () => {
      const mockUser = {
        id: userId,
        password: "hashed-old-password",
      };

      jest.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      jest.mocked(compare).mockResolvedValue(true as never);

      const result = await authService.changePassword(userId, currentPassword, "short");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Password must be at least 8 characters long");
    });
  });

  describe("session", () => {
    it("should successfully validate session", async () => {
      const mockAccessToken = "valid-token";
      const mockUser = {
        id: "user-123",
        role: UserRole.USER,
      };
      const mockEmployee = {
        id: "emp-123",
        firstName: "John",
        lastName: "Doe",
      };
      const mockSession = {
        id: "session-123",
      };

      jest.mocked(verify).mockReturnValue({ userId: "user-123", role: UserRole.USER } as any);
      jest.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      jest.mocked(prisma.employee.findUnique).mockResolvedValue(mockEmployee as any);
      jest.mocked(sessionService.validateSession).mockResolvedValue(mockSession as any);

      const result = await authService.session(mockAccessToken);

      expect(result.token).toBe(mockAccessToken);
      expect(result.user).toEqual(mockUser);
      expect(result.employee).toEqual(mockEmployee);
      expect(result.sessionId).toBe("session-123");
    });

    it("should throw error when token is missing", async () => {
      await expect(authService.session("")).rejects.toThrow("Access token is required");
    });

    it("should throw error when user not found", async () => {
      jest.mocked(verify).mockReturnValue({ userId: "user-123", role: UserRole.USER } as any);
      jest.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(authService.session("valid-token")).rejects.toThrow("User not found");
    });

    it("should throw error when JWT is malformed", async () => {
      jest.mocked(verify).mockImplementation(() => {
        throw new Error("jwt malformed");
      });

      await expect(authService.session("malformed-token")).rejects.toThrow("jwt malformed");
    });

    it("should throw error when JWT is expired", async () => {
      jest.mocked(verify).mockImplementation(() => {
        throw new Error("jwt expired");
      });

      await expect(authService.session("expired-token")).rejects.toThrow("jwt expired");
    });

    it("should throw error when JWT signature is invalid", async () => {
      jest.mocked(verify).mockImplementation(() => {
        throw new Error("invalid signature");
      });

      await expect(authService.session("invalid-sig-token")).rejects.toThrow("invalid signature");
    });

    it("should throw error when JWT verification throws generic error", async () => {
      jest.mocked(verify).mockImplementation(() => {
        throw new Error("Token verification failed");
      });

      await expect(authService.session("bad-token")).rejects.toThrow("Token verification failed");
    });

    it("should handle session with null employee (data integrity issue)", async () => {
      const mockAccessToken = "valid-token";
      const mockUser = {
        id: "user-123",
        role: UserRole.USER,
      };

      jest.mocked(verify).mockReturnValue({ userId: "user-123", role: UserRole.USER } as any);
      jest.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      jest.mocked(prisma.employee.findUnique).mockResolvedValue(null);
      jest.mocked(sessionService.validateSession).mockResolvedValue({ id: "session-123" } as any);

      const result = await authService.session(mockAccessToken);

      expect(result.token).toBe(mockAccessToken);
      expect(result.user).toEqual(mockUser);
      expect(result.employee).toBeNull();
      expect(result.sessionId).toBe("session-123");
    });

    it("should handle when validateSession returns null", async () => {
      const mockAccessToken = "valid-token";
      const mockUser = {
        id: "user-123",
        role: UserRole.USER,
      };
      const mockEmployee = {
        id: "emp-123",
        firstName: "John",
        lastName: "Doe",
      };

      jest.mocked(verify).mockReturnValue({ userId: "user-123", role: UserRole.USER } as any);
      jest.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      jest.mocked(prisma.employee.findUnique).mockResolvedValue(mockEmployee as any);
      jest.mocked(sessionService.validateSession).mockResolvedValue(null);

      const result = await authService.session(mockAccessToken);

      expect(result.token).toBe(mockAccessToken);
      expect(result.user).toEqual(mockUser);
      expect(result.employee).toEqual(mockEmployee);
      expect(result.sessionId).toBeUndefined();
    });

    it("should handle when sessionService.validateSession throws", async () => {
      const mockAccessToken = "valid-token";
      const mockUser = {
        id: "user-123",
        role: UserRole.USER,
      };
      const mockEmployee = {
        id: "emp-123",
        firstName: "John",
        lastName: "Doe",
      };

      jest.mocked(verify).mockReturnValue({ userId: "user-123", role: UserRole.USER } as any);
      jest.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      jest.mocked(prisma.employee.findUnique).mockResolvedValue(mockEmployee as any);
      jest.mocked(sessionService.validateSession).mockRejectedValue(
        new Error("Database connection failed"),
      );

      await expect(authService.session(mockAccessToken)).rejects.toThrow(
        "Database connection failed",
      );
    });
  });

  describe("microsoftLogin", () => {
    it("should return Microsoft OAuth URL", async () => {
      const url = await authService.microsoftLogin();

      expect(url).toContain("https://login.microsoftonline.com");
      expect(url).toContain("client_id=");
      expect(url).toContain("response_type=code");
      expect(url).toContain("scope=openid profile email");
      expect(url).toContain("state=");
    });
  });

  describe("microsoftCallback", () => {
    const mockCode = "auth-code-123";
    const mockState = "state-456";
    const mockMicrosoftUser = {
      id: "ms-user-123",
      userPrincipalName: "john@company.com",
      mail: "john@company.com",
      displayName: "John Doe",
    };
    const mockUser = {
      id: "user-123",
      username: "john@company.com",
      microsoftId: "ms-user-123",
      role: UserRole.USER,
      isActive: true,
      employee: {
        id: "emp-123",
        firstName: "John",
        lastName: "Doe",
        email: "john@company.com",
        title: "Developer",
        number: "123",
      },
    };

    let mockMsalClient: any;
    let mockFetch: jest.Mock;

    beforeEach(() => {
      mockMsalClient = (authService as any).msalClient;
      mockMsalClient.acquireTokenByCode = jest.fn();

      mockFetch = jest.fn();
      globalThis.fetch = mockFetch;

      jest.mocked(sign).mockReturnValue("mock-token" as any);
    });

    it("should throw error when code is missing", async () => {
      await expect(
        authService.microsoftCallback("", mockState, mockRequest as Request),
      ).rejects.toThrow("Code and session ID are required");
    });

    it("should throw error when state is missing", async () => {
      await expect(
        authService.microsoftCallback(mockCode, "", mockRequest as Request),
      ).rejects.toThrow("Code and session ID are required");
    });

    it("should throw error when token acquisition fails (returns null)", async () => {
      mockMsalClient.acquireTokenByCode.mockResolvedValue(null);

      await expect(
        authService.microsoftCallback(mockCode, mockState, mockRequest as Request),
      ).rejects.toThrow("Failed to acquire token");
    });

    it("should throw error when token acquisition throws", async () => {
      mockMsalClient.acquireTokenByCode.mockRejectedValue(
        new Error("MSAL error"),
      );

      await expect(
        authService.microsoftCallback(mockCode, mockState, mockRequest as Request),
      ).rejects.toThrow("MSAL error");
    });

    it("should throw error when Microsoft Graph API fails", async () => {
      mockMsalClient.acquireTokenByCode.mockResolvedValue({
        accessToken: "ms-access-token",
      });
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
      });

      await expect(
        authService.microsoftCallback(mockCode, mockState, mockRequest as Request),
      ).rejects.toThrow("Failed to get user info from Microsoft");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://graph.microsoft.com/v1.0/me",
        expect.objectContaining({
          headers: { Authorization: "Bearer ms-access-token" },
        }),
      );
    });

    it("should throw error when fetch throws", async () => {
      mockMsalClient.acquireTokenByCode.mockResolvedValue({
        accessToken: "ms-access-token",
      });
      mockFetch.mockRejectedValue(new Error("Network error"));

      await expect(
        authService.microsoftCallback(mockCode, mockState, mockRequest as Request),
      ).rejects.toThrow("Network error");
    });

    it("should throw error when Microsoft user not linked to account", async () => {
      mockMsalClient.acquireTokenByCode.mockResolvedValue({
        accessToken: "ms-access-token",
      });
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockMicrosoftUser),
      });
      jest.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(
        authService.microsoftCallback(mockCode, mockState, mockRequest as Request),
      ).rejects.toThrow("No account found for this Microsoft user");

      expect(loginHistoryService.logAttempt).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          failureReason: "No account found",
          loginMethod: LoginMethod.MICROSOFT,
        }),
      );
    });

    it("should throw error when user has no employee", async () => {
      mockMsalClient.acquireTokenByCode.mockResolvedValue({
        accessToken: "ms-access-token",
      });
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockMicrosoftUser),
      });
      jest.mocked(prisma.user.findUnique).mockResolvedValue({
        ...mockUser,
        employee: null,
      } as any);

      await expect(
        authService.microsoftCallback(mockCode, mockState, mockRequest as Request),
      ).rejects.toThrow("No account found for this Microsoft user");

      expect(loginHistoryService.logAttempt).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          failureReason: "No account found",
        }),
      );
    });

    it("should throw error when account is inactive", async () => {
      mockMsalClient.acquireTokenByCode.mockResolvedValue({
        accessToken: "ms-access-token",
      });
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockMicrosoftUser),
      });
      jest.mocked(prisma.user.findUnique).mockResolvedValue({
        ...mockUser,
        isActive: false,
      } as any);

      await expect(
        authService.microsoftCallback(mockCode, mockState, mockRequest as Request),
      ).rejects.toThrow("Account is inactive");

      expect(loginHistoryService.logAttempt).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          failureReason: "Account is inactive",
          userId: "user-123",
        }),
      );
    });

    it("should successfully login with Microsoft account", async () => {
      mockMsalClient.acquireTokenByCode.mockResolvedValue({
        accessToken: "ms-access-token",
      });
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockMicrosoftUser),
      });
      jest.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      jest.mocked(sessionService.createSession).mockResolvedValue({
        id: "session-123",
      } as any);

      const result = await authService.microsoftCallback(
        mockCode,
        mockState,
        mockRequest as Request,
      );

      expect(result.token).toBe("mock-token");
      expect(result.refreshToken).toBe("mock-token");
      expect(result.sessionId).toBe("session-123");
      expect(result.user.id).toBe("user-123");
      expect(result.employee.id).toBe("emp-123");

      expect(mockMsalClient.acquireTokenByCode).toHaveBeenCalledWith({
        code: mockCode,
        redirectUri: env.AZURE_REDIRECT_URI,
        scopes: ["openid", "profile", "email"],
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { microsoftId: "ms-user-123" },
        include: { employee: true },
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: { lastLogin: expect.any(Date) },
      });

      expect(sessionService.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-123",
          loginMethod: LoginMethod.MICROSOFT,
        }),
      );

      expect(loginHistoryService.logAttempt).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          userId: "user-123",
          loginMethod: LoginMethod.MICROSOFT,
        }),
      );
    });

    it("should work without request object", async () => {
      mockMsalClient.acquireTokenByCode.mockResolvedValue({
        accessToken: "ms-access-token",
      });
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockMicrosoftUser),
      });
      jest.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await authService.microsoftCallback(mockCode, mockState);

      expect(result.token).toBe("mock-token");
      expect(result.sessionId).toBeUndefined();
      expect(sessionService.createSession).not.toHaveBeenCalled();
      expect(loginHistoryService.logAttempt).not.toHaveBeenCalled();
    });

    it("should throw error when sessionService.createSession fails after retries during Microsoft login", async () => {
      mockMsalClient.acquireTokenByCode.mockResolvedValue({
        accessToken: "ms-access-token",
      });
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockMicrosoftUser),
      });
      jest.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      jest.mocked(sessionService.createSession).mockRejectedValue(
        new Error("Session store unavailable"),
      );

      await expect(
        authService.microsoftCallback(mockCode, mockState, mockRequest as Request),
      ).rejects.toThrow("Session store unavailable");

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: { lastLogin: expect.any(Date) },
      });
      expect(sessionService.createSession).toHaveBeenCalledTimes(3);
    });

    it("should succeed even when loginHistoryService.logAttempt fails during Microsoft login (non-blocking)", async () => {
      mockMsalClient.acquireTokenByCode.mockResolvedValue({
        accessToken: "ms-access-token",
      });
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockMicrosoftUser),
      });
      jest.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      jest.mocked(sessionService.createSession).mockResolvedValue({
        id: "session-123",
      } as any);
      jest.mocked(loginHistoryService.logAttempt).mockRejectedValue(
        new Error("Audit service down"),
      );

      const result = await authService.microsoftCallback(
        mockCode,
        mockState,
        mockRequest as Request,
      );

      expect(result.token).toBe("mock-token");
      expect(result.sessionId).toBe("session-123");
      expect(sessionService.createSession).toHaveBeenCalled();
    });

    it("should handle user with username fallback", async () => {
      const userWithoutUsername = {
        ...mockUser,
        username: null,
      };

      mockMsalClient.acquireTokenByCode.mockResolvedValue({
        accessToken: "ms-access-token",
      });
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockMicrosoftUser),
      });
      jest.mocked(prisma.user.findUnique).mockResolvedValue(userWithoutUsername as any);
      jest.mocked(sessionService.createSession).mockResolvedValue({
        id: "session-123",
      } as any);

      const result = await authService.microsoftCallback(
        mockCode,
        mockState,
        mockRequest as Request,
      );

      expect(result.token).toBe("mock-token");
      expect(loginHistoryService.logAttempt).toHaveBeenCalledWith(
        expect.objectContaining({
          username: mockMicrosoftUser.userPrincipalName,
        }),
      );
    });

    it("should handle Microsoft user with mail fallback when userPrincipalName missing", async () => {
      const msUserWithoutPrincipalName = {
        id: "ms-user-123",
        mail: "john@company.com",
      };

      mockMsalClient.acquireTokenByCode.mockResolvedValue({
        accessToken: "ms-access-token",
      });
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(msUserWithoutPrincipalName),
      });
      jest.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(
        authService.microsoftCallback(mockCode, mockState, mockRequest as Request),
      ).rejects.toThrow("No account found for this Microsoft user");

      expect(loginHistoryService.logAttempt).toHaveBeenCalledWith(
        expect.objectContaining({
          username: "john@company.com",
        }),
      );
    });
  });
});
