import { _migrateDepartments, _migrateEmployeeManagers, _migrateEmployees, closeDatabaseConnections } from "@/scripts/data-pipeline";
import { legacyService, microsoftService } from "@/services";
import { logger } from "@/utils/logger";
import { prisma } from "@/utils/prisma";

export interface EmployeeSyncResult {
  success: boolean;
  legacySync: {
    departments: { total: number; created: number; skipped: number; errors: number };
    employees: { total: number; created: number; skipped: number; errors: number };
    managers: { total: number; created: number; skipped: number; errors: number };
  };
  microsoftSync: {
    updated: number;
    skipped: number;
    total: number;
  };
  duration: number;
  error?: string;
}

export class EmployeeSyncService {
  async syncAll(): Promise<EmployeeSyncResult> {
    const startTime = Date.now();

    try {
      logger.info("Starting full employee sync...");

      logger.info("Migrating departments from legacy database...");
      const departmentResult = await _migrateDepartments(legacyService);

      logger.info("Migrating employees from legacy database...");
      const employeeResult = await _migrateEmployees(legacyService);

      logger.info("Migrating employee manager relationships...");
      const managerResult = await _migrateEmployeeManagers(legacyService);

      await closeDatabaseConnections();

      logger.info("Syncing employees with Microsoft...");
      const microsoftResult = await microsoftService.sync();

      const duration = Date.now() - startTime;

      logger.info(`Full employee sync completed in ${duration}ms`);

      return {
        success: true,
        legacySync: {
          departments: {
            total: departmentResult.total,
            created: departmentResult.created,
            skipped: departmentResult.skipped,
            errors: departmentResult.errors,
          },
          employees: {
            total: employeeResult.total,
            created: employeeResult.created,
            skipped: employeeResult.skipped,
            errors: employeeResult.errors,
          },
          managers: {
            total: managerResult.total,
            created: managerResult.created,
            skipped: managerResult.skipped,
            errors: managerResult.errors,
          },
        },
        microsoftSync: microsoftResult,
        duration,
      };
    }
    catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error("Full employee sync failed:", error);

      return {
        success: false,
        legacySync: {
          departments: { total: 0, created: 0, skipped: 0, errors: 0 },
          employees: { total: 0, created: 0, skipped: 0, errors: 0 },
          managers: { total: 0, created: 0, skipped: 0, errors: 0 },
        },
        microsoftSync: {
          updated: 0,
          skipped: 0,
          total: 0,
        },
        duration,
        error: error.message,
      };
    }
  }

  async syncFromLegacy(): Promise<EmployeeSyncResult> {
    const startTime = Date.now();

    try {
      logger.info("Starting legacy database employee sync...");

      const departmentResult = await _migrateDepartments(legacyService);
      const employeeResult = await _migrateEmployees(legacyService);
      const managerResult = await _migrateEmployeeManagers(legacyService);

      await closeDatabaseConnections();

      const duration = Date.now() - startTime;

      logger.info(`Legacy employee sync completed in ${duration}ms`);

      return {
        success: true,
        legacySync: {
          departments: {
            total: departmentResult.total,
            created: departmentResult.created,
            skipped: departmentResult.skipped,
            errors: departmentResult.errors,
          },
          employees: {
            total: employeeResult.total,
            created: employeeResult.created,
            skipped: employeeResult.skipped,
            errors: employeeResult.errors,
          },
          managers: {
            total: managerResult.total,
            created: managerResult.created,
            skipped: managerResult.skipped,
            errors: managerResult.errors,
          },
        },
        microsoftSync: {
          updated: 0,
          skipped: 0,
          total: 0,
        },
        duration,
      };
    }
    catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error("Legacy employee sync failed:", error);

      return {
        success: false,
        legacySync: {
          departments: { total: 0, created: 0, skipped: 0, errors: 0 },
          employees: { total: 0, created: 0, skipped: 0, errors: 0 },
          managers: { total: 0, created: 0, skipped: 0, errors: 0 },
        },
        microsoftSync: {
          updated: 0,
          skipped: 0,
          total: 0,
        },
        duration,
        error: error.message,
      };
    }
  }

  async syncFromMicrosoft(): Promise<EmployeeSyncResult> {
    const startTime = Date.now();

    try {
      logger.info("Starting Microsoft employee sync...");

      const microsoftResult = await microsoftService.sync();

      const duration = Date.now() - startTime;

      logger.info(`Microsoft employee sync completed in ${duration}ms`);

      return {
        success: true,
        legacySync: {
          departments: { total: 0, created: 0, skipped: 0, errors: 0 },
          employees: { total: 0, created: 0, skipped: 0, errors: 0 },
          managers: { total: 0, created: 0, skipped: 0, errors: 0 },
        },
        microsoftSync: microsoftResult,
        duration,
      };
    }
    catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error("Microsoft employee sync failed:", error);

      return {
        success: false,
        legacySync: {
          departments: { total: 0, created: 0, skipped: 0, errors: 0 },
          employees: { total: 0, created: 0, skipped: 0, errors: 0 },
          managers: { total: 0, created: 0, skipped: 0, errors: 0 },
        },
        microsoftSync: {
          updated: 0,
          skipped: 0,
          total: 0,
        },
        duration,
        error: error.message,
      };
    }
  }

  async getSyncStats() {
    try {
      const [totalEmployees, totalUsers, totalDepartments, employeesWithMicrosoft, employeesWithManagers] = await Promise.all([
        prisma.employee.count(),
        prisma.user.count(),
        prisma.department.count(),
        prisma.employee.count({ where: { user: { microsoftId: { not: null } } } }),
        prisma.employee.count({ where: { managerId: { not: null } } }),
      ]);

      return {
        employees: {
          total: totalEmployees,
          withMicrosoft: employeesWithMicrosoft,
          withManagers: employeesWithManagers,
        },
        users: {
          total: totalUsers,
        },
        departments: {
          total: totalDepartments,
        },
      };
    }
    catch (error: any) {
      logger.error("Failed to get sync stats:", error);
      throw error;
    }
  }
}
