// Cost code business logic and validation
// Ported from various services handling cost code requirements

import { CostCode, EmployeeJobCode, ValidationResult } from '../types/time-tracking.types';

export interface CostCodeRepository {
  findCostCodesByJobCode(jobCode: number): Promise<CostCode[]>;
  findEmployeeJobCode(empNum: number, jobCode: number): Promise<EmployeeJobCode | null>;
}

export class CostCodeService {
  
  constructor(private repository: CostCodeRepository) {}

  /**
   * Check if cost code is required for a specific job and employee
   * Ported from ManagerAddHoursViewModel.ReqCostCodeCheck
   * @param empNum - Employee number
   * @param jobCode - Job/operation code
   * @returns True if cost code is required
   */
  async isCostCodeRequired(empNum: number, jobCode: number): Promise<boolean> {
    try {
      const employeeJobCode = await this.repository.findEmployeeJobCode(empNum, jobCode);
      
      if (!employeeJobCode) {
        return false; // If no job code configuration found, assume not required
      }

      return employeeJobCode.requiresCostCode;
      
    } catch (error) {
      console.error('Error checking cost code requirement:', error);
      return false; // Default to not required on error
    }
  }

  /**
   * Get available cost codes for a job
   * @param jobCode - Job/operation code
   * @returns Array of available cost codes
   */
  async getCostCodesForJob(jobCode: number): Promise<CostCode[]> {
    try {
      const costCodes = await this.repository.findCostCodesByJobCode(jobCode);
      
      // Filter to only active cost codes
      return costCodes.filter(cc => cc.active);
      
    } catch (error) {
      console.error('Error getting cost codes for job:', error);
      return [];
    }
  }

  /**
   * Validate cost code format and existence
   * Ported from validation logic in EditHoursService
   * @param costCodeString - Cost code string to validate
   * @param jobCode - Job code to validate against
   * @returns Validation result
   */
  async validateCostCode(costCodeString: string, jobCode: number): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Basic format validation
    if (!costCodeString || costCodeString.trim() === '') {
      result.errors.push('Cost code is required');
      result.isValid = false;
      return result;
    }

    // Parse cost code format: "suffix\\item\\sequence"
    const parts = costCodeString.split('\\');
    if (parts.length !== 3) {
      result.errors.push('Cost code must be in format "suffix\\item\\sequence"');
      result.isValid = false;
      return result;
    }

    const [jobSfx, bomItem, sequence] = parts;
    
    if (!jobSfx || !bomItem || !sequence) {
      result.errors.push('All cost code parts (suffix, item, sequence) must be provided');
      result.isValid = false;
      return result;
    }

    // Check if cost code exists for the job
    try {
      const availableCostCodes = await this.getCostCodesForJob(jobCode);
      const costCodeExists = availableCostCodes.some(cc => 
        cc.jobSfx === jobSfx && 
        cc.bomItem === bomItem && 
        cc.sequence === sequence
      );

      if (!costCodeExists) {
        result.errors.push('Cost code does not exist for this job');
        result.isValid = false;
      }
      
    } catch (error) {
      console.error('Error validating cost code existence:', error);
      result.warnings.push('Could not verify cost code existence');
    }

    return result;
  }

  /**
   * Build cost code string from components
   * @param jobSfx - Job suffix
   * @param bomItem - BOM item
   * @param sequence - Sequence
   * @returns Formatted cost code string
   */
  buildCostCodeString(jobSfx: string, bomItem: string, sequence: string): string {
    return `${jobSfx}\\${bomItem}\\${sequence}`;
  }

  /**
   * Parse cost code string into components
   * @param costCodeString - Cost code string to parse
   * @returns Cost code components or null if invalid format
   */
  parseCostCode(costCodeString: string): { jobSfx: string; bomItem: string; sequence: string } | null {
    if (!costCodeString) {
      return null;
    }

    const parts = costCodeString.split('\\');
    if (parts.length !== 3) {
      return null;
    }

    return {
      jobSfx: parts[0],
      bomItem: parts[1],
      sequence: parts[2]
    };
  }

  /**
   * Get employee job configuration
   * @param empNum - Employee number
   * @param jobCode - Job code
   * @returns Employee job configuration or null
   */
  async getEmployeeJobConfig(empNum: number, jobCode: number): Promise<EmployeeJobCode | null> {
    try {
      return await this.repository.findEmployeeJobCode(empNum, jobCode);
    } catch (error) {
      console.error('Error getting employee job config:', error);
      return null;
    }
  }

  /**
   * Check if quantity is required for a job
   * @param empNum - Employee number
   * @param jobCode - Job code
   * @returns True if quantity is required
   */
  async isQuantityRequired(empNum: number, jobCode: number): Promise<boolean> {
    try {
      const employeeJobCode = await this.repository.findEmployeeJobCode(empNum, jobCode);
      return employeeJobCode?.askQuantity ?? false;
    } catch (error) {
      console.error('Error checking quantity requirement:', error);
      return false;
    }
  }

  /**
   * Check if split code is required for a job
   * @param empNum - Employee number
   * @param jobCode - Job code
   * @returns True if split code is required
   */
  async isSplitCodeRequired(empNum: number, jobCode: number): Promise<boolean> {
    try {
      const employeeJobCode = await this.repository.findEmployeeJobCode(empNum, jobCode);
      return employeeJobCode?.askSplitCode ?? false;
    } catch (error) {
      console.error('Error checking split code requirement:', error);
      return false;
    }
  }

  /**
   * Check if a job is clockable for an employee
   * @param empNum - Employee number
   * @param jobCode - Job code
   * @returns True if job is clockable
   */
  async isJobClockable(empNum: number, jobCode: number): Promise<boolean> {
    try {
      const employeeJobCode = await this.repository.findEmployeeJobCode(empNum, jobCode);
      return employeeJobCode?.clockable ?? false;
    } catch (error) {
      console.error('Error checking job clockable status:', error);
      return false;
    }
  }

  /**
   * Get job requirements for an employee and job
   * @param empNum - Employee number
   * @param jobCode - Job code
   * @returns Job requirements object
   */
  async getJobRequirements(empNum: number, jobCode: number): Promise<{
    costCodeRequired: boolean;
    quantityRequired: boolean;
    splitCodeRequired: boolean;
    clockable: boolean;
  }> {
    try {
      const employeeJobCode = await this.repository.findEmployeeJobCode(empNum, jobCode);
      
      if (!employeeJobCode) {
        return {
          costCodeRequired: false,
          quantityRequired: false,
          splitCodeRequired: false,
          clockable: false
        };
      }

      return {
        costCodeRequired: employeeJobCode.requiresCostCode,
        quantityRequired: employeeJobCode.askQuantity,
        splitCodeRequired: employeeJobCode.askSplitCode,
        clockable: employeeJobCode.clockable
      };
      
    } catch (error) {
      console.error('Error getting job requirements:', error);
      return {
        costCodeRequired: false,
        quantityRequired: false,
        splitCodeRequired: false,
        clockable: false
      };
    }
  }

  /**
   * Format cost codes for display in UI
   * @param costCodes - Array of cost codes
   * @returns Array of formatted strings for display
   */
  formatCostCodesForDisplay(costCodes: CostCode[]): string[] {
    return costCodes.map(cc => cc.costCode);
  }

  /**
   * Find cost code by formatted string
   * @param costCodes - Array of cost codes to search
   * @param costCodeString - Formatted cost code string
   * @returns Matching cost code or null
   */
  findCostCodeByString(costCodes: CostCode[], costCodeString: string): CostCode | null {
    return costCodes.find(cc => cc.costCode === costCodeString) || null;
  }
}

// Factory function to create service with repository
export function createCostCodeService(repository: CostCodeRepository): CostCodeService {
  return new CostCodeService(repository);
}
