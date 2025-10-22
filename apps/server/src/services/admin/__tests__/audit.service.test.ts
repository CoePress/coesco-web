/* eslint-disable dot-notation */
import type { AuditLog, BugReport, EmailLog } from "@prisma/client";

import fs from "node:fs";

import { env } from "@/config/env";
import { auditLogRepository, bugReportRepository, emailLogRepository } from "@/repositories";
import { employeeService } from "@/services";

import { AuditService } from "../audit.service";

jest.mock("node:fs");
jest.mock("@/repositories", () => ({
  auditLogRepository: {
    getAll: jest.fn(),
    getById: jest.fn(),
  },
  bugReportRepository: {
    getAll: jest.fn(),
    getById: jest.fn(),
  },
  emailLogRepository: {
    getAll: jest.fn(),
    getById: jest.fn(),
  },
}));
jest.mock("@/services", () => ({
  employeeService: {
    getEmployeeById: jest.fn(),
  },
}));

describe("auditService", () => {
  let auditService: AuditService;

  beforeEach(() => {
    jest.clearAllMocks();
    auditService = new AuditService();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe("getAuditLogs", () => {
    it("should return enriched audit logs", async () => {
      const mockAuditLogs: AuditLog[] = [
        {
          id: "1",
          model: "User",
          recordId: "user1",
          action: "CREATE",
          changedBy: "emp1",
          diff: {},
          createdAt: new Date(),
        } as AuditLog,
      ];

      (auditLogRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: mockAuditLogs,
      });

      (employeeService.getEmployeeById as jest.Mock).mockResolvedValue({
        success: true,
        data: { firstName: "John", lastName: "Doe" },
      });

      const result = await auditService.getAuditLogs();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].changedByName).toBe("John Doe");
    });

    it("should return result if repository fails", async () => {
      (auditLogRepository.getAll as jest.Mock).mockResolvedValue({
        success: false,
        error: "Database error",
      });

      const result = await auditService.getAuditLogs();

      expect(result.success).toBe(false);
      expect((result as any).error).toBe("Database error");
    });

    it("should pass query params to repository", async () => {
      (auditLogRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      const params = { limit: 10, page: 1 };
      await auditService.getAuditLogs(params);

      expect(auditLogRepository.getAll).toHaveBeenCalledWith(params);
    });
  });

  describe("getAuditLog", () => {
    it("should return enriched single audit log", async () => {
      const mockAuditLog: AuditLog = {
        id: "1",
        model: "User",
        recordId: "user1",
        action: "UPDATE",
        changedBy: "emp1",
        diff: {},
        createdAt: new Date(),
      } as AuditLog;

      (auditLogRepository.getById as jest.Mock).mockResolvedValue({
        success: true,
        data: mockAuditLog,
      });

      (employeeService.getEmployeeById as jest.Mock).mockResolvedValue({
        success: true,
        data: { firstName: "Jane", lastName: "Smith" },
      });

      const result = await auditService.getAuditLog("1");

      expect(result.success).toBe(true);
      expect(result.data?.changedByName).toBe("Jane Smith");
    });

    it("should return result if repository fails", async () => {
      (auditLogRepository.getById as jest.Mock).mockResolvedValue({
        success: false,
        error: "Not found",
      });

      const result = await auditService.getAuditLog("1");

      expect(result.success).toBe(false);
      expect((result as any).error).toBe("Not found");
    });
  });

  describe("getAuditLogsByRecord", () => {
    it("should return audit logs filtered by model and recordId", async () => {
      const mockAuditLogs: AuditLog[] = [
        {
          id: "1",
          model: "Order",
          recordId: "order123",
          action: "CREATE",
          changedBy: "emp1",
          diff: {},
          createdAt: new Date(),
        } as AuditLog,
      ];

      (auditLogRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: mockAuditLogs,
      });

      (employeeService.getEmployeeById as jest.Mock).mockResolvedValue({
        success: true,
        data: { firstName: "Bob", lastName: "Johnson" },
      });

      const result = await auditService.getAuditLogsByRecord("Order", "order123");

      expect(result.success).toBe(true);
      expect(auditLogRepository.getAll).toHaveBeenCalledWith({
        where: { model: "Order", recordId: "order123" },
        sort: "createdAt",
        order: "asc",
      });
    });

    it("should enrich logs with employee names", async () => {
      const mockAuditLogs: AuditLog[] = [
        {
          id: "1",
          model: "Order",
          recordId: "order123",
          action: "CREATE",
          changedBy: "emp1",
          diff: {},
          createdAt: new Date(),
        } as AuditLog,
      ];

      (auditLogRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: mockAuditLogs,
      });

      (employeeService.getEmployeeById as jest.Mock).mockResolvedValue({
        success: true,
        data: { firstName: "Alice", lastName: "Brown" },
      });

      const result = await auditService.getAuditLogsByRecord("Order", "order123");

      expect(result.data?.[0].changedByName).toBe("Alice Brown");
    });
  });

  describe("getEmailLogs", () => {
    it("should return email logs from repository", async () => {
      const mockEmailLogs: EmailLog[] = [
        {
          id: "1",
          to: "test@example.com",
          subject: "Test",
          template: "test-template",
          status: "SENT",
          sentAt: new Date(),
          error: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as EmailLog,
      ];

      (emailLogRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: mockEmailLogs,
      });

      const result = await auditService.getEmailLogs();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEmailLogs);
    });

    it("should pass params to repository", async () => {
      (emailLogRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      const params = { limit: 5 };
      await auditService.getEmailLogs(params);

      expect(emailLogRepository.getAll).toHaveBeenCalledWith(params);
    });
  });

  describe("getEmailLog", () => {
    it("should return single email log from repository", async () => {
      const mockEmailLog: EmailLog = {
        id: "1",
        to: "test@example.com",
        subject: "Test",
        template: "test-template",
        status: "SENT",
        sentAt: new Date(),
        error: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as EmailLog;

      (emailLogRepository.getById as jest.Mock).mockResolvedValue({
        success: true,
        data: mockEmailLog,
      });

      const result = await auditService.getEmailLog("1");

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEmailLog);
      expect(emailLogRepository.getById).toHaveBeenCalledWith("1");
    });
  });

  describe("getBugReports", () => {
    it("should return bug reports from repository", async () => {
      const mockBugReports: BugReport[] = [
        {
          id: "1",
          title: "Bug",
          description: "Description",
          userEmail: null,
          userName: null,
          url: null,
          userAgent: null,
          issueKey: null,
          issueUrl: null,
          status: "SUBMITTED",
          createdAt: new Date(),
          createdById: "emp1",
        } as BugReport,
      ];

      (bugReportRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: mockBugReports,
      });

      const result = await auditService.getBugReports();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBugReports);
    });

    it("should pass params to repository", async () => {
      (bugReportRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      const params = { limit: 10 };
      await auditService.getBugReports(params);

      expect(bugReportRepository.getAll).toHaveBeenCalledWith(params);
    });
  });

  describe("getBugReport", () => {
    it("should return single bug report from repository", async () => {
      const mockBugReport: BugReport = {
        id: "1",
        title: "Bug",
        description: "Description",
        userEmail: null,
        userName: null,
        url: null,
        userAgent: null,
        issueKey: null,
        issueUrl: null,
        status: "SUBMITTED",
        createdAt: new Date(),
        createdById: "emp1",
      } as BugReport;

      (bugReportRepository.getById as jest.Mock).mockResolvedValue({
        success: true,
        data: mockBugReport,
      });

      const result = await auditService.getBugReport("1");

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBugReport);
      expect(bugReportRepository.getById).toHaveBeenCalledWith("1");
    });
  });

  describe("getLogFiles", () => {
    it("should return paginated log files", async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([
        "app.log",
        "error.log",
        "old.log.gz",
        "other.txt",
      ]);

      const result = await auditService.getLogFiles(1, 2);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(3);
      expect(result.meta.totalPages).toBe(2);
    });

    it("should filter only .log and .gz files", async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([
        "app.log",
        "error.log.gz",
        "readme.txt",
        "data.json",
      ]);

      const result = await auditService.getLogFiles(1, 10);

      expect(result.data).toEqual(["error.log.gz", "app.log"]);
    });

    it("should sort files in reverse order", async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([
        "a.log",
        "c.log",
        "b.log",
      ]);

      const result = await auditService.getLogFiles(1, 10);

      expect(result.data).toEqual(["c.log", "b.log", "a.log"]);
    });

    it("should return empty result if logs directory does not exist", async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = await auditService.getLogFiles();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it("should handle second page correctly", async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([
        "1.log",
        "2.log",
        "3.log",
        "4.log",
        "5.log",
      ]);

      const result = await auditService.getLogFiles(2, 2);

      expect(result.data).toHaveLength(2);
      expect(result.meta.page).toBe(2);
    });
  });

  describe("getLogFile", () => {
    beforeEach(() => {
      Object.defineProperty(env, "LOGS_DIR", {
        value: "/var/logs",
        writable: true,
        configurable: true,
      });
    });

    it("should return log file path", async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = await auditService.getLogFile("app.log");

      expect(result.success).toBe(true);
      expect(result.data?.path).toContain("app.log");
      expect(result.data?.isGzipped).toBe(false);
    });

    it("should detect gzipped files", async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = await auditService.getLogFile("app.log.gz");

      expect(result.data?.isGzipped).toBe(true);
    });

    it("should throw error if file does not exist", async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(auditService.getLogFile("nonexistent.log")).rejects.toThrow(
        "Log file not found",
      );
    });

    it("should prevent path traversal attacks", async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      await expect(auditService.getLogFile("../../etc/passwd")).rejects.toThrow(
        "Invalid log file path",
      );
    });

    it("should allow valid nested paths within LOGS_DIR", async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = await auditService.getLogFile("2024/app.log");

      expect(result.success).toBe(true);
    });
  });

  describe("enrichWithEmployeeNames", () => {
    it("should enrich audit logs with employee names", async () => {
      const mockAuditLogs: AuditLog[] = [
        {
          id: "1",
          model: "User",
          recordId: "user1",
          action: "CREATE",
          changedBy: "emp1",
          diff: {},
          createdAt: new Date(),
        } as AuditLog,
      ];

      (employeeService.getEmployeeById as jest.Mock).mockResolvedValue({
        success: true,
        data: { firstName: "John", lastName: "Doe" },
      });

      const result = await auditService["enrichWithEmployeeNames"](mockAuditLogs);

      expect(result[0].changedByName).toBe("John Doe");
    });

    it("should handle system user", async () => {
      const mockAuditLogs: AuditLog[] = [
        {
          id: "1",
          model: "User",
          recordId: "user1",
          action: "CREATE",
          changedBy: "system",
          diff: {},
          createdAt: new Date(),
        } as AuditLog,
      ];

      const result = await auditService["enrichWithEmployeeNames"](mockAuditLogs);

      expect(result[0].changedByName).toBe("System");
      expect(employeeService.getEmployeeById).not.toHaveBeenCalledWith("system");
    });

    it("should handle multiple unique employees", async () => {
      const mockAuditLogs: AuditLog[] = [
        {
          id: "1",
          model: "User",
          recordId: "user1",
          action: "CREATE",
          changedBy: "emp1",
          diff: {},
          createdAt: new Date(),
        } as AuditLog,
        {
          id: "2",
          model: "User",
          recordId: "user2",
          action: "UPDATE",
          changedBy: "emp2",
          diff: {},
          createdAt: new Date(),
        } as AuditLog,
        {
          id: "3",
          model: "User",
          recordId: "user3",
          action: "DELETE",
          changedBy: "emp1",
          diff: {},
          createdAt: new Date(),
        } as AuditLog,
      ];

      (employeeService.getEmployeeById as jest.Mock)
        .mockResolvedValueOnce({
          success: true,
          data: { firstName: "John", lastName: "Doe" },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { firstName: "Jane", lastName: "Smith" },
        });

      const result = await auditService["enrichWithEmployeeNames"](mockAuditLogs);

      expect(employeeService.getEmployeeById).toHaveBeenCalledTimes(2);
      expect(result[0].changedByName).toBe("John Doe");
      expect(result[1].changedByName).toBe("Jane Smith");
      expect(result[2].changedByName).toBe("John Doe");
    });

    it("should handle employee not found", async () => {
      const mockAuditLogs: AuditLog[] = [
        {
          id: "1",
          model: "User",
          recordId: "user1",
          action: "CREATE",
          changedBy: "emp1",
          diff: {},
          createdAt: new Date(),
        } as AuditLog,
      ];

      (employeeService.getEmployeeById as jest.Mock).mockResolvedValue({
        success: false,
        error: "Not found",
      });

      const result = await auditService["enrichWithEmployeeNames"](mockAuditLogs);

      expect(result[0].changedByName).toBeUndefined();
    });

    it("should handle employee service errors gracefully", async () => {
      const mockAuditLogs: AuditLog[] = [
        {
          id: "1",
          model: "User",
          recordId: "user1",
          action: "CREATE",
          changedBy: "emp1",
          diff: {},
          createdAt: new Date(),
        } as AuditLog,
      ];

      (employeeService.getEmployeeById as jest.Mock).mockRejectedValue(
        new Error("Database error"),
      );

      const result = await auditService["enrichWithEmployeeNames"](mockAuditLogs);

      expect(result[0].changedByName).toBeUndefined();
    });
  });
});
