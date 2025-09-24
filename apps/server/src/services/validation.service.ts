// Business validation rules and logic
// Ported from EditHoursService.cs validation methods

import { Hours, EmployeeJobCode, ValidationResult } from '../types/time-tracking.types';

export class ValidationService {

  /**
   * Validate hours entry for editing (ported from EditHoursService.ValidateHours)
   * @param hour - The hour record to validate
   * @param field - The field being validated
   * @param newValue - The new value being set
   * @returns Validation result with status and messages
   */
  validateHoursEdit(hour: Hours, field: string, newValue: string | number): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    switch (field) {
      case 'jobCode':
        return this.validateJobCode(newValue as string, result);

      case 'costCode':
        return this.validateCostCode(newValue as string, result);

      case 'units':
        return this.validateUnits(newValue as string, result);

      case 'split':
        return this.validateSplit(newValue as string, result);

      case 'timeIn':
      case 'timeOut':
        return this.validateTime(hour, field, newValue as string, result);

      default:
        result.errors.push(`Unknown field: ${field}`);
        result.isValid = false;
    }

    return result;
  }

  /**
   * Validate job code selection
   * @param jobCode - Job code string (format: "123 - Description")
   * @param result - Validation result to populate
   */
  private validateJobCode(jobCode: string, result: ValidationResult): ValidationResult {
    if (!jobCode || jobCode.trim() === '') {
      result.errors.push('Job code is required');
      result.isValid = false;
      return result;
    }

    // Validate format: "number - description"
    const parts = jobCode.split(' - ');
    if (parts.length !== 2) {
      result.errors.push('Job code must be in format "123 - Description"');
      result.isValid = false;
      return result;
    }

    const code = parseInt(parts[0]);
    if (isNaN(code) || code <= 0) {
      result.errors.push('Job code must be a positive number');
      result.isValid = false;
      return result;
    }

    return result;
  }

  /**
   * Validate cost code entry
   * @param costCode - Cost code string
   * @param result - Validation result to populate
   */
  private validateCostCode(costCode: string, result: ValidationResult): ValidationResult {
    if (!costCode || costCode.trim() === '') {
      result.errors.push('Cost code is required');
      result.isValid = false;
      return result;
    }

    // Cost code format validation (jobSfx\\bomItem\\sequence)
    const parts = costCode.split('\\');
    if (parts.length !== 3) {
      result.errors.push('Cost code must be in format "suffix\\item\\sequence"');
      result.isValid = false;
      return result;
    }

    if (parts.some(part => part.trim() === '')) {
      result.errors.push('All cost code parts must be filled');
      result.isValid = false;
      return result;
    }

    return result;
  }

  /**
   * Validate units/quantity entry
   * @param units - Units string
   * @param result - Validation result to populate
   */
  private validateUnits(units: string, result: ValidationResult): ValidationResult {
    if (!units || units.trim() === '') {
      result.warnings.push('Units not specified');
      return result;
    }

    const quantity = parseFloat(units);
    if (isNaN(quantity)) {
      result.errors.push('Units must be a valid number');
      result.isValid = false;
      return result;
    }

    if (quantity < 0) {
      result.errors.push('Units cannot be negative');
      result.isValid = false;
      return result;
    }

    return result;
  }

  /**
   * Validate split code entry
   * @param split - Split code string
   * @param result - Validation result to populate
   */
  private validateSplit(split: string, result: ValidationResult): ValidationResult {
    if (!split || split.trim() === '') {
      result.warnings.push('Split code not specified');
      return result;
    }

    // Basic format validation for split codes
    if (split.length > 10) {
      result.errors.push('Split code is too long (max 10 characters)');
      result.isValid = false;
      return result;
    }

    return result;
  }

  /**
   * Validate time entry changes
   * @param hour - Current hour record
   * @param field - Field being changed (timeIn or timeOut)
   * @param newTimeStr - New time value
   * @param result - Validation result to populate
   */
  private validateTime(hour: Hours, field: string, newTimeStr: string, result: ValidationResult): ValidationResult {
    if (!newTimeStr || newTimeStr.trim() === '') {
      result.errors.push('Time cannot be empty');
      result.isValid = false;
      return result;
    }

    const newTime = new Date(newTimeStr);
    if (isNaN(newTime.getTime())) {
      result.errors.push('Invalid time format');
      result.isValid = false;
      return result;
    }

    // Additional validation based on field
    if (field === 'timeIn') {
      const timeOut = new Date(hour.timeOut || '');
      if (timeOut.getTime() > 0 && newTime >= timeOut) {
        result.errors.push('Time in must be before time out');
        result.isValid = false;
      }
    } else if (field === 'timeOut') {
      const timeIn = new Date(hour.timeIn || '');
      if (newTime <= timeIn) {
        result.errors.push('Time out must be after time in');
        result.isValid = false;
      }
    }

    return result;
  }

  /**
   * Validate operation number (ported from SelectOpPage.IsValidOpNum)
   * @param opNum - Operation number
   * @param validOperations - Array of valid operation numbers
   * @returns True if operation is valid
   */
  validateOperationNumber(opNum: number, validOperations: number[]): boolean {
    return validOperations.includes(opNum);
  }

  /**
   * Check if an employee can edit hours (ported from ManagerViewModel.Ability2EditHours)
   * @param isManager - Is the user a manager
   * @param startDate - Edit window start date
   * @param endDate - Edit window end date
   * @returns True if editing is allowed
   */
  canEditHours(isManager: boolean, startDate?: Date, endDate?: Date): boolean {
    if (!isManager) {
      return false;
    }

    if (!startDate || !endDate) {
      return false;
    }

    const now = new Date();
    return now >= startDate && now <= endDate;
  }

  /**
   * Validate employee number entry
   * @param empNum - Employee number
   * @returns Validation result
   */
  validateEmployeeNumber(empNum: number | string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    const num = typeof empNum === 'string' ? parseInt(empNum) : empNum;

    if (isNaN(num)) {
      result.errors.push('Employee number must be a valid number');
      result.isValid = false;
      return result;
    }

    if (num <= 0) {
      result.errors.push('Employee number must be positive');
      result.isValid = false;
      return result;
    }

    return result;
  }

  /**
   * Validate time entry is not empty and within reasonable bounds
   * @param timeStr - Time string to validate
   * @returns Validation result
   */
  validateTimeEntry(timeStr: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    if (!timeStr || timeStr.trim() === '') {
      result.errors.push('Time cannot be empty');
      result.isValid = false;
      return result;
    }

    const time = new Date(timeStr);
    if (isNaN(time.getTime())) {
      result.errors.push('Invalid time format');
      result.isValid = false;
      return result;
    }

    // Check if time is reasonable (within last year and next day)
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    if (time < oneYearAgo) {
      result.warnings.push('Time is more than a year ago');
    }

    if (time > tomorrow) {
      result.warnings.push('Time is in the future');
    }

    return result;
  }

  /**
   * Check if cost code is required for a job
   * @param employeeJobCode - Employee job code configuration
   * @returns True if cost code is required
   */
  isCostCodeRequired(employeeJobCode: EmployeeJobCode): boolean {
    return employeeJobCode.requiresCostCode;
  }

  /**
   * Check if quantity is required for a job
   * @param employeeJobCode - Employee job code configuration
   * @returns True if quantity is required
   */
  isQuantityRequired(employeeJobCode: EmployeeJobCode): boolean {
    return employeeJobCode.askQuantity;
  }

  /**
   * Check if split code is required for a job
   * @param employeeJobCode - Employee job code configuration
   * @returns True if split code is required
   */
  isSplitCodeRequired(employeeJobCode: EmployeeJobCode): boolean {
    return employeeJobCode.askSplitCode;
  }
}

// Export singleton instance
export const validationService = new ValidationService();
