// Core business logic facade for easy integration
// Provides a single entry point for all time tracking business logic

import { TimeCalculationService } from './time-calculation.service';
import { ValidationService } from './validation.service';
import { ClockingService, ClockingRepository } from './clocking.service';
import { CostCodeService, CostCodeRepository } from './cost-code.service';
import { AuditTrailService, AuditRepository } from './audit-trail.service';

/**
 * Core business logic facade for easy integration
 * Provides a single entry point for all time tracking business logic
 */
export class TimeTrackingCore {
  public readonly timeCalculation: TimeCalculationService;
  public readonly validation: ValidationService;
  public readonly clocking: ClockingService;
  public readonly costCode: CostCodeService;
  public readonly auditTrail: AuditTrailService;

  constructor(
    clockingRepository: ClockingRepository,
    costCodeRepository: CostCodeRepository,
    auditRepository: AuditRepository
  ) {
    // Initialize singleton services
    this.timeCalculation = new TimeCalculationService();
    this.validation = new ValidationService();
    
    // Initialize repository-dependent services
    this.clocking = new ClockingService(clockingRepository);
    this.costCode = new CostCodeService(costCodeRepository);
    this.auditTrail = new AuditTrailService(auditRepository);
  }

  /**
   * Validate and execute a complete clock in operation
   * @param operation - Clock in operation details
   * @returns Complete operation result with validation and audit trail
   */
  async executeClockIn(operation: {
    empNum: number;
    opNum: number;
    clockedTime: Date;
    costCode?: string;
    jobDesc?: string;
    userName: string;
    userRole: string;
  }) {
    // Validate the operation
    const validation = await this.clocking.validateClockOperation({
      empNum: operation.empNum,
      opNum: operation.opNum,
      clockedTime: operation.clockedTime,
      costCode: operation.costCode,
      jobDesc: operation.jobDesc
    });

    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors,
        warnings: validation.warnings
      };
    }

    // Check cost code requirements
    const costCodeRequired = await this.costCode.isCostCodeRequired(operation.empNum, operation.opNum);
    if (costCodeRequired && !operation.costCode) {
      return {
        success: false,
        errors: ['Cost code is required for this job'],
        warnings: validation.warnings
      };
    }

    // Validate cost code if provided
    if (operation.costCode) {
      const costCodeValidation = await this.costCode.validateCostCode(operation.costCode, operation.opNum);
      if (!costCodeValidation.isValid) {
        return {
          success: false,
          errors: costCodeValidation.errors,
          warnings: [...validation.warnings, ...costCodeValidation.warnings]
        };
      }
    }

    // Execute clock in
    const clockInResult = await this.clocking.clockIn({
      empNum: operation.empNum,
      opNum: operation.opNum,
      clockedTime: operation.clockedTime,
      costCode: operation.costCode,
      jobDesc: operation.jobDesc
    });

    if (!clockInResult.success) {
      return {
        success: false,
        errors: [clockInResult.error || 'Clock in failed'],
        warnings: validation.warnings
      };
    }

    // Create audit trail
    if (clockInResult.data) {
      await this.auditTrail.addDataHistory({
        hoursId: clockInResult.data.id,
        empNum: operation.empNum,
        fieldChanged: 'clockIn',
        collectionName: 'EmployeeHours',
        oldData: '',
        newData: `Clocked in at ${operation.clockedTime.toISOString()}`,
        editDescription: 'Employee clocked in',
        userName: operation.userName,
        userRole: operation.userRole
      });
    }

    return {
      success: true,
      data: clockInResult.data,
      warnings: validation.warnings
    };
  }

  /**
   * Validate and execute a complete clock out operation
   * @param operation - Clock out operation details
   * @returns Complete operation result with validation and audit trail
   */
  async executeClockOut(operation: {
    empNum: number;
    clockedTime: Date;
    units?: string;
    split?: string;
    breakFlag?: number;
    userName: string;
    userRole: string;
  }) {
    // Get current clock in
    const currentClockIn = await this.clocking.getCurrentClockIn(operation.empNum);
    if (!currentClockIn) {
      return {
        success: false,
        errors: ['No active clock in found for employee'],
        warnings: []
      };
    }

    // Validate units and split if provided
    const validationErrors: string[] = [];
    
    if (operation.units) {
      const unitsValidation = this.validation.validateHoursEdit(
        { units: operation.units } as any,
        'units',
        operation.units
      );
      if (!unitsValidation.isValid) {
        validationErrors.push(...unitsValidation.errors);
      }
    }

    if (operation.split) {
      const splitValidation = this.validation.validateHoursEdit(
        { split: operation.split } as any,
        'split',
        operation.split
      );
      if (!splitValidation.isValid) {
        validationErrors.push(...splitValidation.errors);
      }
    }

    if (validationErrors.length > 0) {
      return {
        success: false,
        errors: validationErrors,
        warnings: []
      };
    }

    // Execute clock out
    const clockOutResult = await this.clocking.clockOut(
      operation.empNum,
      operation.clockedTime,
      operation.units,
      operation.split,
      operation.breakFlag || 0
    );

    if (!clockOutResult.success) {
      return {
        success: false,
        errors: [clockOutResult.error || 'Clock out failed'],
        warnings: []
      };
    }

    // Create audit trail
    if (clockOutResult.data) {
      await this.auditTrail.addDataHistory({
        hoursId: clockOutResult.data.id,
        empNum: operation.empNum,
        fieldChanged: 'clockOut',
        collectionName: 'EmployeeHours',
        oldData: 'Clocked in',
        newData: `Clocked out at ${operation.clockedTime.toISOString()}`,
        editDescription: 'Employee clocked out',
        userName: operation.userName,
        userRole: operation.userRole
      });
    }

    return {
      success: true,
      data: clockOutResult.data,
      warnings: []
    };
  }
}

/**
 * Factory function to create the core business logic facade
 * @param repositories - Repository implementations for data access
 * @returns Configured TimeTrackingCore instance
 */
export function createTimeTrackingCore(repositories: {
  clocking: ClockingRepository;
  costCode: CostCodeRepository;
  audit: AuditRepository;
}): TimeTrackingCore {
  return new TimeTrackingCore(
    repositories.clocking,
    repositories.costCode,
    repositories.audit
  );
}

// Utility functions for common operations
export const TimeTrackingUtils = {
  /**
   * Format time for display
   */
  formatTime(date: Date): string {
    return date.toLocaleString();
  },

  /**
   * Parse time string safely
   */
  parseTime(timeString: string): Date | null {
    try {
      const date = new Date(timeString);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  },

  /**
   * Calculate work day boundaries
   */
  getWorkDayBounds(date: Date): { start: Date; end: Date } {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  },

  /**
   * Check if two dates are on the same day
   */
  isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  },

  /**
   * Get week boundaries for a date
   */
  getWeekBounds(date: Date): { start: Date; end: Date } {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day; // Sunday = 0
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  }
};
