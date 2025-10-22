/* eslint-disable no-restricted-globals */
import { UserRole } from "@prisma/client";
import axios from "axios";

import { InternalServerError } from "@/middleware/error.middleware";
import { logger } from "@/utils/logger";
import { prisma } from "@/utils/prisma";

import { MicrosoftService } from "../microsoft.service";

jest.mock("axios");
jest.mock("@/utils/prisma", () => ({
  prisma: {
    employee: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
  },
}));
jest.mock("@/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

global.fetch = jest.fn();

describe("microsoftService", () => {
  let service: MicrosoftService;

  beforeEach(() => {
    service = new MicrosoftService();
    jest.clearAllMocks();
  });

  describe("sync", () => {
    it("should skip blacklisted emails", async () => {
      const mockToken = "mock-token";
      (axios.post as jest.Mock).mockResolvedValue({
        data: { access_token: mockToken },
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({
          value: [
            { id: "1", mail: "ads@cpec.com", givenName: "Ads", surname: "User" },
            { id: "2", mail: "asy@cpec.com", givenName: "Asy", surname: "User" },
            { id: "3", mail: "COE@cpec.com", givenName: "Coe", surname: "User" },
            { id: "4", mail: "ele@cpec.com", givenName: "Ele", surname: "User" },
          ],
        }),
      });

      const result = await service.sync();

      expect(result.updated).toBe(0);
      expect(result.total).toBe(4);
      expect(prisma.employee.findFirst).not.toHaveBeenCalled();
    });

    it("should skip users without email or id", async () => {
      const mockToken = "mock-token";
      (axios.post as jest.Mock).mockResolvedValue({
        data: { access_token: mockToken },
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({
          value: [
            { id: null, mail: "abc@cpec.com", givenName: "User", surname: "One" },
            { id: "2", mail: null, givenName: "User", surname: "Two" },
            { id: "3", mail: undefined, givenName: "User", surname: "Three" },
          ],
        }),
      });

      const result = await service.sync();

      expect(result.updated).toBe(0);
      expect(result.total).toBe(3);
      expect(prisma.employee.findFirst).not.toHaveBeenCalled();
    });

    it("should skip emails that don't match employee regex", async () => {
      const mockToken = "mock-token";
      (axios.post as jest.Mock).mockResolvedValue({
        data: { access_token: mockToken },
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({
          value: [
            { id: "1", mail: "invalid@cpec.com", givenName: "User", surname: "One" },
            { id: "2", mail: "toolong@cpec.com", givenName: "User", surname: "Two" },
            { id: "3", mail: "ab@cpec.com", givenName: "User", surname: "Three" },
            { id: "4", mail: "test@other.com", givenName: "User", surname: "Four" },
          ],
        }),
      });

      const result = await service.sync();

      expect(result.updated).toBe(0);
      expect(result.total).toBe(4);
      expect(prisma.employee.findFirst).not.toHaveBeenCalled();
    });

    it("should accept valid employee emails (3 letters @cpec.com)", async () => {
      const mockToken = "mock-token";
      (axios.post as jest.Mock).mockResolvedValue({
        data: { access_token: mockToken },
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({
          value: [
            { id: "1", mail: "abc@cpec.com", givenName: "User", surname: "One" },
            { id: "2", mail: "xyz@cpec.com", givenName: "User", surname: "Two" },
            { id: "3", mail: "AAA@cpec.com", givenName: "User", surname: "Three" },
          ],
        }),
      });

      (prisma.employee.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.sync();

      expect(result.skipped).toBe(3);
      expect(prisma.employee.findFirst).toHaveBeenCalledTimes(3);
    });

    it("should skip if no employee found in database", async () => {
      const mockToken = "mock-token";
      (axios.post as jest.Mock).mockResolvedValue({
        data: { access_token: mockToken },
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({
          value: [
            { id: "1", mail: "abc@cpec.com", givenName: "Test", surname: "User" },
          ],
        }),
      });

      (prisma.employee.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.sync();

      expect(result.updated).toBe(0);
      expect(result.skipped).toBe(1);
      expect(logger.debug).toHaveBeenCalledWith("No employee found for email: abc@cpec.com");
    });

    it("should update user and employee when employee exists", async () => {
      const mockToken = "mock-token";
      (axios.post as jest.Mock).mockResolvedValue({
        data: { access_token: mockToken },
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({
          value: [
            {
              id: "ms-123",
              mail: "abc@cpec.com",
              givenName: "John",
              surname: "Doe",
              jobTitle: "Developer",
              department: "Engineering",
            },
          ],
        }),
      });

      const mockEmployee = {
        id: "emp-123",
        userId: "user-123",
        firstName: "Old",
        lastName: "Name",
        title: "Old Title",
        email: "abc@cpec.com",
      };

      (prisma.employee.findFirst as jest.Mock).mockResolvedValue(mockEmployee);

      const result = await service.sync();

      expect(result.updated).toBe(1);
      expect(result.skipped).toBe(0);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: {
          microsoftId: "ms-123",
          role: UserRole.USER,
          isActive: true,
        },
      });

      expect(prisma.employee.update).toHaveBeenCalledWith({
        where: { id: "emp-123" },
        data: {
          firstName: "John",
          lastName: "Doe",
          title: "Developer",
        },
      });
    });

    it("should set role to ADMIN for MIS department", async () => {
      const mockToken = "mock-token";
      (axios.post as jest.Mock).mockResolvedValue({
        data: { access_token: mockToken },
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({
          value: [
            {
              id: "ms-456",
              mail: "abc@cpec.com",
              givenName: "Admin",
              surname: "User",
              jobTitle: "IT Manager",
              department: "MIS",
            },
          ],
        }),
      });

      const mockEmployee = {
        id: "emp-456",
        userId: "user-456",
        firstName: "Admin",
        lastName: "User",
        title: "IT Manager",
        email: "abc@cpec.com",
      };

      (prisma.employee.findFirst as jest.Mock).mockResolvedValue(mockEmployee);

      await service.sync();

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-456" },
        data: {
          microsoftId: "ms-456",
          role: UserRole.ADMIN,
          isActive: true,
        },
      });
    });

    it("should preserve existing employee data when Microsoft data is missing", async () => {
      const mockToken = "mock-token";
      (axios.post as jest.Mock).mockResolvedValue({
        data: { access_token: mockToken },
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({
          value: [
            {
              id: "ms-789",
              mail: "abc@cpec.com",
              givenName: null,
              surname: null,
              jobTitle: null,
              department: "Sales",
            },
          ],
        }),
      });

      const mockEmployee = {
        id: "emp-789",
        userId: "user-789",
        firstName: "Existing",
        lastName: "Name",
        title: "Existing Title",
        email: "abc@cpec.com",
      };

      (prisma.employee.findFirst as jest.Mock).mockResolvedValue(mockEmployee);

      await service.sync();

      expect(prisma.employee.update).toHaveBeenCalledWith({
        where: { id: "emp-789" },
        data: {
          firstName: "Existing",
          lastName: "Name",
          title: "Existing Title",
        },
      });
    });

    it("should process multiple users correctly", async () => {
      const mockToken = "mock-token";
      (axios.post as jest.Mock).mockResolvedValue({
        data: { access_token: mockToken },
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({
          value: [
            { id: "1", mail: "abc@cpec.com", givenName: "User", surname: "One", department: "IT" },
            { id: "2", mail: "xyz@cpec.com", givenName: "User", surname: "Two", department: "MIS" },
            { id: "3", mail: "def@cpec.com", givenName: "User", surname: "Three", department: "Sales" },
            { id: "4", mail: "invalid@cpec.com", givenName: "Invalid", surname: "User" },
          ],
        }),
      });

      (prisma.employee.findFirst as jest.Mock)
        .mockResolvedValueOnce({ id: "e1", userId: "u1", firstName: "A", lastName: "B", title: "T1" })
        .mockResolvedValueOnce({ id: "e2", userId: "u2", firstName: "C", lastName: "D", title: "T2" })
        .mockResolvedValueOnce(null);

      const result = await service.sync();

      expect(result.updated).toBe(2);
      expect(result.skipped).toBe(1);
      expect(result.total).toBe(4);
    });

    it("should log sync start, progress, and completion", async () => {
      const mockToken = "mock-token";
      (axios.post as jest.Mock).mockResolvedValue({
        data: { access_token: mockToken },
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({
          value: [
            { id: "1", mail: "abc@cpec.com", givenName: "Test", surname: "User" },
          ],
        }),
      });

      (prisma.employee.findFirst as jest.Mock).mockResolvedValue({
        id: "emp-1",
        userId: "user-1",
        firstName: "Test",
        lastName: "User",
        title: "Dev",
      });

      await service.sync();

      expect(logger.info).toHaveBeenCalledWith("Starting Microsoft user sync...");
      expect(logger.info).toHaveBeenCalledWith("Found 1 Microsoft users");
      expect(logger.info).toHaveBeenCalledWith("Sync completed: 1 updated, 0 skipped, 1 total");
    });

    it("should throw InternalServerError on sync failure", async () => {
      const mockError = new Error("Network error");
      (axios.post as jest.Mock).mockRejectedValue(mockError);

      await expect(service.sync()).rejects.toThrow(InternalServerError);
      await expect(service.sync()).rejects.toThrow("Sync failed: Network error");

      expect(logger.error).toHaveBeenCalledWith(
        "Sync failed with error:",
        expect.objectContaining({
          message: "Network error",
        }),
      );
    });

    it("should handle pagination with @odata.nextLink", async () => {
      const mockToken = "mock-token";
      (axios.post as jest.Mock).mockResolvedValue({
        data: { access_token: mockToken },
      });

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            "value": [
              { id: "1", mail: "abc@cpec.com", givenName: "User", surname: "One" },
            ],
            "@odata.nextLink": "https://graph.microsoft.com/v1.0/users?$skip=1",
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            value: [
              { id: "2", mail: "xyz@cpec.com", givenName: "User", surname: "Two" },
            ],
          }),
        });

      (prisma.employee.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.sync();

      expect(result.total).toBe(2);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should use 30 second timeout for fetch requests", async () => {
      const mockToken = "mock-token";
      (axios.post as jest.Mock).mockResolvedValue({
        data: { access_token: mockToken },
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({
          value: [],
        }),
      });

      await service.sync();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        }),
      );
    });
  });

  describe("token generation", () => {
    it("should generate token with correct parameters", async () => {
      const mockToken = "test-access-token";
      (axios.post as jest.Mock).mockResolvedValue({
        data: { access_token: mockToken },
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({ value: [] }),
      });

      await service.sync();

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("oauth2/v2.0/token"),
        expect.any(URLSearchParams),
      );

      const callArgs = (axios.post as jest.Mock).mock.calls[0];
      const params = callArgs[1];
      expect(params.get("grant_type")).toBe("client_credentials");
      expect(params.get("scope")).toBe("https://graph.microsoft.com/.default");
    });

    it("should log error details when token generation fails", async () => {
      const mockError = {
        response: {
          data: { error_description: "Invalid client secret" },
          status: 401,
        },
        message: "Request failed",
      };

      (axios.post as jest.Mock).mockRejectedValue(mockError);

      await expect(service.sync()).rejects.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        "Token generation failed:",
        expect.objectContaining({
          error: { error_description: "Invalid client secret" },
          status: 401,
        }),
      );
    });
  });
});
