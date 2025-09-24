// Clock in/out workflows and time tracking operations
// Ported from ClockingService.cs

import { EmployeeHours, ClockOperation, ValidationResult } from '../types/time-tracking.types';
import { timeCalculationService } from './time-calculation.service';
import { validationService } from './validation.service';

export interface ClockingRepository {
  findActiveClockIn(empNum: number): Promise<EmployeeHours | null>;
  createEmployeeHours(hours: EmployeeHours): Promise<EmployeeHours>;
  updateEmployeeHours(id: string, hours: Partial<EmployeeHours>): Promise<EmployeeHours>;
}

export class ClockingService {
  
  constructor(private repository: ClockingRepository) {}

  /**
   * Clock in an employee (ported from ClockingService.ClockInAsync)
   * @param operation - Clock in operation details
   * @returns Success result or error
   */
  async clockIn(operation: ClockOperation): Promise<{ success: boolean; error?: string; data?: EmployeeHours }> {
    try {
      // Validate inputs
      const empValidation = validationService.validateEmployeeNumber(operation.empNum);
      if (!empValidation.isValid) {
        return { success: false, error: empValidation.errors.join(', ') };
      }

      if (!operation.opNum) {
        return { success: false, error: 'Operation number is required' };
      }

      // Check if employee is already clocked in
      const existingClockIn = await this.repository.findActiveClockIn(operation.empNum);
      if (existingClockIn) {
        return { success: false, error: 'Employee is already clocked in' };
      }

      // Round the clocked time to nearest 3 minutes
      const roundedTime = timeCalculationService.roundTime(operation.clockedTime);
      
      // Create the employee hours record
      const employeeHours: EmployeeHours = {
        id: '', // Will be set by repository
        empNum: operation.empNum,
        jobCode: operation.opNum,
        timeIn: roundedTime.toISOString(),
        actualTimeIn: operation.clockedTime.toISOString(),
        timeOut: undefined, // Still clocked in
        actualTimeOut: undefined,
        costCode: operation.costCode,
        jobDesc: operation.jobDesc,
        quantity: undefined,
        splitCode: undefined,
        breakFlag: 0,
        managerApproval: false,
        managerName: undefined,
        inVariance: undefined,
        outVariance: undefined,
        timeSheetMinutes: 0, // Will be calculated on clock out
        timeOffset: undefined,
        nightShift: false,
        isConfirmed: false,
        flag: undefined,
        tzOffset: undefined,
        hasNote: false,
        isEdited: false
      };

      const result = await this.repository.createEmployeeHours(employeeHours);
      
      return { success: true, data: result };
      
    } catch (error) {
      console.error('Clock in error:', error);
      return { success: false, error: 'An error occurred during clock in' };
    }
  }

  /**
   * Clock out an employee (ported from ClockingService.ClockOutAsync)
   * @param empNum - Employee number
   * @param clockedTime - Time of clock out
   * @param units - Units/quantity produced
   * @param split - Split code
   * @param breakFlag - Break flag (0 or 1)
   * @returns Success result or error
   */
  async clockOut(
    empNum: number, 
    clockedTime: Date, 
    units?: string, 
    split?: string, 
    breakFlag: number = 0
  ): Promise<{ success: boolean; error?: string; data?: EmployeeHours }> {
    try {
      // Validate inputs
      const empValidation = validationService.validateEmployeeNumber(empNum);
      if (!empValidation.isValid) {
        return { success: false, error: empValidation.errors.join(', ') };
      }

      // Find the active clock in record
      const activeClockIn = await this.repository.findActiveClockIn(empNum);
      if (!activeClockIn) {
        return { success: false, error: 'No active clock in found for employee' };
      }

      // Validate units if provided
      if (units) {
        const unitsValidation = validationService.validateHoursEdit(
          { units } as any, 
          'units', 
          units
        );
        if (!unitsValidation.isValid) {
          return { success: false, error: unitsValidation.errors.join(', ') };
        }
      }

      // Validate split if provided
      if (split) {
        const splitValidation = validationService.validateHoursEdit(
          { split } as any, 
          'split', 
          split
        );
        if (!splitValidation.isValid) {
          return { success: false, error: splitValidation.errors.join(', ') };
        }
      }

      // Round the clock out time
      const roundedTime = timeCalculationService.roundTime(clockedTime);
      
      // Validate that clock out is after clock in
      const timeInDate = new Date(activeClockIn.timeIn || '');
      if (roundedTime <= timeInDate) {
        return { success: false, error: 'Clock out time must be after clock in time' };
      }

      // Calculate total minutes worked
      const totalMinutes = timeCalculationService.calculateMinutes(timeInDate, roundedTime);
      
      // Update the clock in record with clock out information
      const updates: Partial<EmployeeHours> = {
        timeOut: roundedTime.toISOString(),
        actualTimeOut: clockedTime.toISOString(),
        quantity: units,
        splitCode: split,
        breakFlag: breakFlag,
        timeSheetMinutes: totalMinutes
      };

      const result = await this.repository.updateEmployeeHours(activeClockIn.id, updates);
      
      return { success: true, data: result };
      
    } catch (error) {
      console.error('Clock out error:', error);
      return { success: false, error: 'An error occurred during clock out' };
    }
  }

  /**
   * Check if an employee is currently clocked in
   * @param empNum - Employee number
   * @returns True if employee is clocked in
   */
  async isEmployeeClockedIn(empNum: number): Promise<boolean> {
    try {
      const activeClockIn = await this.repository.findActiveClockIn(empNum);
      return activeClockIn !== null;
    } catch (error) {
      console.error('Error checking clock status:', error);
      return false;
    }
  }

  /**
   * Get current clock in status for an employee
   * @param empNum - Employee number
   * @returns Current clock in record if exists
   */
  async getCurrentClockIn(empNum: number): Promise<EmployeeHours | null> {
    try {
      return await this.repository.findActiveClockIn(empNum);
    } catch (error) {
      console.error('Error getting current clock in:', error);
      return null;
    }
  }

  /**
   * Force clock out an employee (for management override)
   * @param empNum - Employee number
   * @param clockOutTime - Override clock out time
   * @param managerName - Name of manager performing override
   * @returns Success result or error
   */
  async forceClockOut(
    empNum: number, 
    clockOutTime: Date, 
    managerName: string
  ): Promise<{ success: boolean; error?: string; data?: EmployeeHours }> {
    try {
      const activeClockIn = await this.repository.findActiveClockIn(empNum);
      if (!activeClockIn) {
        return { success: false, error: 'No active clock in found for employee' };
      }

      const timeInDate = new Date(activeClockIn.timeIn || '');
      const totalMinutes = timeCalculationService.calculateMinutes(timeInDate, clockOutTime);
      
      const updates: Partial<EmployeeHours> = {
        timeOut: clockOutTime.toISOString(),
        actualTimeOut: clockOutTime.toISOString(),
        timeSheetMinutes: totalMinutes,
        managerName: managerName,
        isEdited: true
      };

      const result = await this.repository.updateEmployeeHours(activeClockIn.id, updates);
      
      return { success: true, data: result };
      
    } catch (error) {
      console.error('Force clock out error:', error);
      return { success: false, error: 'An error occurred during force clock out' };
    }
  }

  /**
   * Validate clock operation before execution
   * @param operation - Clock operation to validate
   * @returns Validation result
   */
  async validateClockOperation(operation: ClockOperation): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Validate employee number
    const empValidation = validationService.validateEmployeeNumber(operation.empNum);
    if (!empValidation.isValid) {
      result.errors.push(...empValidation.errors);
      result.isValid = false;
    }

    // Validate operation number if provided
    if (operation.opNum !== undefined && operation.opNum <= 0) {
      result.errors.push('Operation number must be positive');
      result.isValid = false;
    }

    // Validate time
    const timeValidation = validationService.validateTimeEntry(operation.clockedTime.toISOString());
    if (!timeValidation.isValid) {
      result.errors.push(...timeValidation.errors);
      result.isValid = false;
    }
    result.warnings.push(...timeValidation.warnings);

    // Check if employee is already clocked in (for clock in operations)
    if (operation.opNum) { // This is a clock in operation
      const isClockedIn = await this.isEmployeeClockedIn(operation.empNum);
      if (isClockedIn) {
        result.errors.push('Employee is already clocked in');
        result.isValid = false;
      }
    }

    return result;
  }
}

// Factory function to create service with repository
export function createClockingService(repository: ClockingRepository): ClockingService {
  return new ClockingService(repository);
}
