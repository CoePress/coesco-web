import type { AuditLog, EmailLog } from "@prisma/client";

import fs from "node:fs";
import path from "node:path";

import type { IQueryParams } from "@/types";

import { env } from "@/config/env";
import { auditLogRepository, emailLogRepository } from "@/repositories";

import { employeeService } from "..";

export type EnrichedAuditLog = AuditLog & {
  changedByName?: string;
};

export class AuditService {
  async getAuditLogs(params?: IQueryParams<AuditLog>) {
    const result = await auditLogRepository.getAll(params);

    if (!result.success || !result.data) {
      return result;
    }

    const enrichedData = await this.enrichWithEmployeeNames(result.data);

    return {
      ...result,
      data: enrichedData,
    };
  }

  async getAuditLog(id: string) {
    const result = await auditLogRepository.getById(id);

    if (!result.success || !result.data) {
      return result;
    }

    const enrichedData = await this.enrichWithEmployeeNames([result.data]);

    return {
      ...result,
      data: enrichedData[0],
    };
  }

  async getAuditLogsByRecord(model: string, recordId: string) {
    const result = await auditLogRepository.getAll({
      where: { model, recordId },
      sort: "createdAt",
      order: "asc",
    } as IQueryParams<AuditLog>);

    if (!result.success || !result.data) {
      return result;
    }

    const enrichedData = await this.enrichWithEmployeeNames(result.data);

    return {
      ...result,
      data: enrichedData,
    };
  }

  async getEmailLogs(params?: IQueryParams<EmailLog>) {
    return await emailLogRepository.getAll(params);
  }

  async getEmailLog(id: string) {
    return await emailLogRepository.getById(id);
  }

  async getLogFiles() {
    if (!fs.existsSync(env.LOGS_DIR)) {
      return {
        success: true,
        data: [],
      };
    }

    const files = fs.readdirSync(env.LOGS_DIR).filter(f => f.endsWith(".log") || f.endsWith(".gz"));
    const sortedFiles = files.sort().reverse();

    return {
      success: true,
      data: sortedFiles,
    };
  }

  async getLogFile(filename: string) {
    const logPath = path.join(env.LOGS_DIR, filename);

    if (!fs.existsSync(logPath)) {
      throw new Error("Log file not found");
    }

    // Security: ensure the path is within LOGS_DIR to prevent path traversal
    const normalizedPath = path.normalize(logPath);
    const normalizedLogsDir = path.normalize(env.LOGS_DIR);
    if (!normalizedPath.startsWith(normalizedLogsDir)) {
      throw new Error("Invalid log file path");
    }

    return {
      success: true,
      data: {
        path: logPath,
        isGzipped: logPath.endsWith(".gz"),
      },
    };
  }

  private async enrichWithEmployeeNames(auditLogs: AuditLog[]): Promise<EnrichedAuditLog[]> {
    const uniqueEmployeeIds = [...new Set(auditLogs.map(log => log.changedBy))];

    const employeeMap = new Map<string, string>();

    await Promise.all(
      uniqueEmployeeIds.map(async (employeeId) => {
        if (employeeId === "system") {
          employeeMap.set("system", "System");
          return;
        }

        try {
          const result = await employeeService.getEmployeeById(employeeId);
          if (result.success && result.data) {
            const fullName = `${result.data.firstName} ${result.data.lastName}`;
            employeeMap.set(employeeId, fullName);
          }
        }
        catch {
          // If employee not found, we'll just leave it as the ID
        }
      }),
    );

    return auditLogs.map(log => ({
      ...log,
      changedByName: employeeMap.get(log.changedBy),
    }));
  }
}
