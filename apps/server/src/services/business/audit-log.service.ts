import type { AuditLog } from "@prisma/client";

import type { IQueryParams } from "@/types";

import { auditLogService as auditLogRepository, employeeService } from "@/services/repository";

export type EnrichedAuditLog = AuditLog & {
  changedByName?: string;
};

export class AuditLogBusinessService {
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
          const result = await employeeService.getById(employeeId);
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
