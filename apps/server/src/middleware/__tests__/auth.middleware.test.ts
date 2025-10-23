import type { NextFunction, Response } from "express";

import { verify } from "jsonwebtoken";

import type { AuthenticatedRequest } from "@/middleware/auth.middleware";

import { asyncHandler, protect } from "@/middleware/auth.middleware";
import { UnauthorizedError } from "@/middleware/error.middleware";
import { sessionService } from "@/services";
import { prisma } from "@/utils/prisma";
import { API_KEYS, env as mockEnv } from "@/config/env";
import { contextStorage } from "@/utils/context";

jest.mock("jsonwebtoken");
jest.mock("@/config/env", () => {
  const mockAPIKeys = new Set<string>();
  const mockCookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "strict" as const,
  };
  const mockEnv = {
    JWT_SECRET: "test-secret",
  };

  return {
    API_KEYS: mockAPIKeys,
    cookieOptions: mockCookieOptions,
    env: mockEnv,
  };
});
jest.mock("@/services", () => ({
  sessionService: {
    validateSession: jest.fn(),
    updateActivity: jest.fn(),
  },
}));
jest.mock("@/utils/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));
jest.mock("@/utils/context", () => {
  const mockRun = jest.fn((context, callback) => callback());
  return {
    contextStorage: {
      run: mockRun,
    },
  };
});

describe("auth.middleware", () => {
  let mockRequest: AuthenticatedRequest;
  let mockResponse: Response;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      cookies: {},
    } as AuthenticatedRequest;
    mockResponse = {
      clearCookie: jest.fn(),
    } as unknown as Response;
    mockNext = jest.fn() as jest.Mock;
    API_KEYS.clear();
    jest.mocked(contextStorage.run).mockClear();
    jest.mocked(verify).mockClear();
    jest.mocked(sessionService.validateSession).mockClear();
    jest.mocked(sessionService.updateActivity).mockClear();
    jest.mocked(prisma.user.findUnique).mockClear();
  });

  describe("asyncHandler", () => {
    it("should call the function and pass through on success", async () => {
      const mockFn = jest.fn().mockResolvedValue(undefined);
      const handler = asyncHandler(mockFn);

      await handler(mockRequest, mockResponse, mockNext);

      expect(mockFn).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("should catch errors and pass to next", async () => {
      const error = new Error("Test error");
      const mockFn = jest.fn().mockRejectedValue(error);
      const handler = asyncHandler(mockFn);

      await expect(
        handler(mockRequest, mockResponse, mockNext),
      ).rejects.toThrow(error);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("protect - API Key Authentication", () => {
    it("should authenticate with valid API key", async () => {
      mockRequest.headers = { "x-api-key": "test-api-key" };
      API_KEYS.add("test-api-key");

      await protect(mockRequest, mockResponse, mockNext);

      expect(mockRequest.user).toEqual({ id: "system", role: "SYSTEM" });
      expect(contextStorage.run).toHaveBeenCalled();
    });

    it("should not authenticate with invalid API key", async () => {
      mockRequest.headers = { "x-api-key": "invalid-key" };
      mockRequest.cookies = {};
      API_KEYS.add("test-api-key");

      await expect(
        protect(mockRequest, mockResponse, mockNext),
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe("protect - JWT Authentication", () => {
    it("should authenticate with valid access token", async () => {
      const mockAccessToken = "valid-access-token";
      const mockSession = {
        id: "session-123",
        userId: "user-123",
        accessToken: mockAccessToken,
      };
      const mockUser = {
        id: "user-123",
        role: "USER",
        employee: {
          id: "emp-123",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          title: "Developer",
          number: "123",
          initials: "JD",
        },
      };

      mockRequest.cookies = { accessToken: mockAccessToken, refreshToken: "refresh-token" };
      (verify as jest.Mock).mockReturnValue({ userId: "user-123", role: "USER" });
      (sessionService.validateSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (sessionService.updateActivity as jest.Mock).mockResolvedValue(undefined);

      await protect(mockRequest, mockResponse, mockNext);

      expect(verify).toHaveBeenCalledWith(mockAccessToken, mockEnv.JWT_SECRET);
      expect(sessionService.validateSession).toHaveBeenCalledWith(mockAccessToken);
      expect(sessionService.updateActivity).toHaveBeenCalledWith(mockSession.id);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-123" },
        include: { employee: true },
      });
      expect(mockRequest.user).toEqual({ id: "user-123", role: "USER" });
      expect(mockRequest.employee).toEqual({
        id: "emp-123",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        title: "Developer",
        number: "123",
        initials: "JD",
      });
      expect(contextStorage.run).toHaveBeenCalled();
    });

    it("should handle employee with null email and initials", async () => {
      const mockAccessToken = "valid-access-token";
      const mockSession = {
        id: "session-123",
        userId: "user-123",
        accessToken: mockAccessToken,
      };
      const mockUser = {
        id: "user-123",
        role: "USER",
        employee: {
          id: "emp-123",
          firstName: "Jane",
          lastName: "Smith",
          email: null,
          title: "Manager",
          number: "456",
          initials: null,
        },
      };

      mockRequest.cookies = { accessToken: mockAccessToken, refreshToken: "refresh-token" };
      (verify as jest.Mock).mockReturnValue({ userId: "user-123", role: "USER" });
      (sessionService.validateSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await protect(mockRequest, mockResponse, mockNext);

      expect(mockRequest.employee).toEqual({
        id: "emp-123",
        firstName: "Jane",
        lastName: "Smith",
        email: undefined,
        title: "Manager",
        number: "456",
        initials: undefined,
      });
    });

    it("should throw error when no tokens provided", async () => {
      mockRequest.cookies = {};

      await expect(
        protect(mockRequest, mockResponse, mockNext),
      ).rejects.toThrow(UnauthorizedError);
      await expect(
        protect(mockRequest, mockResponse, mockNext),
      ).rejects.toThrow("Unauthorized");
    });

    it("should throw error when access token is invalid", async () => {
      mockRequest.cookies = { accessToken: "invalid-token", refreshToken: "refresh-token" };
      (verify as jest.Mock).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      await expect(
        protect(mockRequest, mockResponse, mockNext),
      ).rejects.toThrow(UnauthorizedError);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith("accessToken", expect.any(Object));
      expect(mockResponse.clearCookie).toHaveBeenCalledWith("refreshToken", expect.any(Object));
    });

    it("should throw error when decoded token has no userId", async () => {
      mockRequest.cookies = { accessToken: "token", refreshToken: "refresh-token" };
      (verify as jest.Mock).mockReturnValue({ role: "USER" });

      await expect(
        protect(mockRequest, mockResponse, mockNext),
      ).rejects.toThrow(UnauthorizedError);
      await expect(
        protect(mockRequest, mockResponse, mockNext),
      ).rejects.toThrow("Unauthorized");
    });

    it("should throw error when session is invalid", async () => {
      mockRequest.cookies = { accessToken: "token", refreshToken: "refresh-token" };
      (verify as jest.Mock).mockReturnValue({ userId: "user-123", role: "USER" });
      (sessionService.validateSession as jest.Mock).mockResolvedValue(null);

      await expect(
        protect(mockRequest, mockResponse, mockNext),
      ).rejects.toThrow(UnauthorizedError);
      await expect(
        protect(mockRequest, mockResponse, mockNext),
      ).rejects.toThrow("Invalid or expired session");

      expect(mockResponse.clearCookie).toHaveBeenCalledWith("accessToken", expect.any(Object));
      expect(mockResponse.clearCookie).toHaveBeenCalledWith("refreshToken", expect.any(Object));
    });

    it("should throw error when user not found", async () => {
      const mockAccessToken = "valid-access-token";
      const mockSession = {
        id: "session-123",
        userId: "user-123",
        accessToken: mockAccessToken,
      };

      mockRequest.cookies = { accessToken: mockAccessToken, refreshToken: "refresh-token" };
      (verify as jest.Mock).mockReturnValue({ userId: "user-123", role: "USER" });
      (sessionService.validateSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        protect(mockRequest, mockResponse, mockNext),
      ).rejects.toThrow(UnauthorizedError);
      await expect(
        protect(mockRequest, mockResponse, mockNext),
      ).rejects.toThrow("Unauthorized");
    });

    it("should throw error when user has no employee", async () => {
      const mockAccessToken = "valid-access-token";
      const mockSession = {
        id: "session-123",
        userId: "user-123",
        accessToken: mockAccessToken,
      };
      const mockUser = {
        id: "user-123",
        role: "USER",
        employee: null,
      };

      mockRequest.cookies = { accessToken: mockAccessToken, refreshToken: "refresh-token" };
      (verify as jest.Mock).mockReturnValue({ userId: "user-123", role: "USER" });
      (sessionService.validateSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        protect(mockRequest, mockResponse, mockNext),
      ).rejects.toThrow(UnauthorizedError);
      await expect(
        protect(mockRequest, mockResponse, mockNext),
      ).rejects.toThrow("Unauthorized");
    });
  });
});
