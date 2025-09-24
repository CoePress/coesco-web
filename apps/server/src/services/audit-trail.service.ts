// Data history and audit trail system
// Ported from EmployeeService.AddDataHistoryAsync

import { DataHistory, EmployeeHours } from '../types/time-tracking.types';

export interface AuditRepository {
  createDataHistory(history: DataHistory): Promise<DataHistory>;
  findDataHistoryByHoursId(hoursId: string): Promise<DataHistory[]>;
  findDataHistoryByEmployee(empNum: number): Promise<DataHistory[]>;
}

export class AuditTrailService {
  
  constructor(private repository: AuditRepository) {}

  /**
   * Add data history record when hours are modified
   * Ported from EmployeeService.AddDataHistoryAsync
   * @param params - Audit trail parameters
   * @returns Success result
   */
  async addDataHistory(params: {
    hoursId: string;
    empNum: number;
    fieldChanged: string;
    collectionName: string;
    oldData: string;
    newData: string;
    editDescription: string;
    userName: string;
    userRole: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate that data actually changed
      if (params.oldData === params.newData) {
        return { success: true }; // No change, no audit needed
      }

      // Create data history record
      const dataHistory: DataHistory = {
        id: '', // Will be set by repository
        collectionName: params.collectionName,
        fieldChanged: params.fieldChanged,
        hoursId: params.hoursId,
        empNum: params.empNum,
        oldData: params.oldData,
        newData: params.newData,
        editDescription: params.editDescription,
        timeChanged: new Date().toISOString(),
        userName: `${params.userName} - ${params.userRole}`
      };

      await this.repository.createDataHistory(dataHistory);
      
      return { success: true };
      
    } catch (error) {
      console.error('Error adding data history:', error);
      return { success: false, error: 'Failed to create audit trail record' };
    }
  }

  /**
   * Track time in changes
   * @param hoursRecord - The hours record being changed
   * @param newTimeIn - New time in value
   * @param userName - User making the change
   * @param userRole - Role of user making change
   * @returns Success result
   */
  async trackTimeInChange(
    hoursRecord: EmployeeHours,
    newTimeIn: string,
    userName: string,
    userRole: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.addDataHistory({
      hoursId: hoursRecord.id,
      empNum: hoursRecord.empNum,
      fieldChanged: 'timeIn',
      collectionName: 'EmployeeHours',
      oldData: hoursRecord.timeIn || '',
      newData: newTimeIn,
      editDescription: 'Time in modified',
      userName,
      userRole
    });
  }

  /**
   * Track time out changes
   * @param hoursRecord - The hours record being changed
   * @param newTimeOut - New time out value
   * @param userName - User making the change
   * @param userRole - Role of user making change
   * @returns Success result
   */
  async trackTimeOutChange(
    hoursRecord: EmployeeHours,
    newTimeOut: string,
    userName: string,
    userRole: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.addDataHistory({
      hoursId: hoursRecord.id,
      empNum: hoursRecord.empNum,
      fieldChanged: 'timeOut',
      collectionName: 'EmployeeHours',
      oldData: hoursRecord.timeOut || '',
      newData: newTimeOut,
      editDescription: 'Time out modified',
      userName,
      userRole
    });
  }

  /**
   * Track cost code changes
   * @param hoursRecord - The hours record being changed
   * @param newCostCode - New cost code value
   * @param userName - User making the change
   * @param userRole - Role of user making change
   * @returns Success result
   */
  async trackCostCodeChange(
    hoursRecord: EmployeeHours,
    newCostCode: string,
    userName: string,
    userRole: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.addDataHistory({
      hoursId: hoursRecord.id,
      empNum: hoursRecord.empNum,
      fieldChanged: 'costCode',
      collectionName: 'EmployeeHours',
      oldData: hoursRecord.costCode || '',
      newData: newCostCode,
      editDescription: 'Cost code modified',
      userName,
      userRole
    });
  }

  /**
   * Track quantity/units changes
   * @param hoursRecord - The hours record being changed
   * @param newQuantity - New quantity value
   * @param userName - User making the change
   * @param userRole - Role of user making change
   * @returns Success result
   */
  async trackQuantityChange(
    hoursRecord: EmployeeHours,
    newQuantity: string,
    userName: string,
    userRole: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.addDataHistory({
      hoursId: hoursRecord.id,
      empNum: hoursRecord.empNum,
      fieldChanged: 'units',
      collectionName: 'EmployeeHours',
      oldData: hoursRecord.quantity || '',
      newData: newQuantity,
      editDescription: 'Quantity modified',
      userName,
      userRole
    });
  }

  /**
   * Track split code changes
   * @param hoursRecord - The hours record being changed
   * @param newSplitCode - New split code value
   * @param userName - User making the change
   * @param userRole - Role of user making change
   * @returns Success result
   */
  async trackSplitCodeChange(
    hoursRecord: EmployeeHours,
    newSplitCode: string,
    userName: string,
    userRole: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.addDataHistory({
      hoursId: hoursRecord.id,
      empNum: hoursRecord.empNum,
      fieldChanged: 'split',
      collectionName: 'EmployeeHours',
      oldData: hoursRecord.splitCode || '',
      newData: newSplitCode,
      editDescription: 'Split code modified',
      userName,
      userRole
    });
  }

  /**
   * Track manager approval
   * @param hoursRecord - The hours record being approved
   * @param managerName - Name of approving manager
   * @param userName - User making the change
   * @param userRole - Role of user making change
   * @returns Success result
   */
  async trackApproval(
    hoursRecord: EmployeeHours,
    managerName: string,
    userName: string,
    userRole: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.addDataHistory({
      hoursId: hoursRecord.id,
      empNum: hoursRecord.empNum,
      fieldChanged: 'approve',
      collectionName: 'EmployeeHours',
      oldData: hoursRecord.managerApproval ? 'Approved' : 'Not Approved',
      newData: 'Approved',
      editDescription: `Approved by ${managerName}`,
      userName,
      userRole
    });
  }

  /**
   * Track manager unapproval
   * @param hoursRecord - The hours record being unapproved
   * @param managerName - Name of manager removing approval
   * @param userName - User making the change
   * @param userRole - Role of user making change
   * @returns Success result
   */
  async trackUnapproval(
    hoursRecord: EmployeeHours,
    managerName: string,
    userName: string,
    userRole: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.addDataHistory({
      hoursId: hoursRecord.id,
      empNum: hoursRecord.empNum,
      fieldChanged: 'unapprove',
      collectionName: 'EmployeeHours',
      oldData: 'Approved',
      newData: 'Not Approved',
      editDescription: `Approval removed by ${managerName}`,
      userName,
      userRole
    });
  }

  /**
   * Get audit history for a specific hours record
   * @param hoursId - Hours record ID
   * @returns Array of audit history records
   */
  async getAuditHistory(hoursId: string): Promise<DataHistory[]> {
    try {
      return await this.repository.findDataHistoryByHoursId(hoursId);
    } catch (error) {
      console.error('Error getting audit history:', error);
      return [];
    }
  }

  /**
   * Get audit history for an employee
   * @param empNum - Employee number
   * @returns Array of audit history records
   */
  async getEmployeeAuditHistory(empNum: number): Promise<DataHistory[]> {
    try {
      return await this.repository.findDataHistoryByEmployee(empNum);
    } catch (error) {
      console.error('Error getting employee audit history:', error);
      return [];
    }
  }

  /**
   * Track multiple field changes in a single operation
   * @param hoursRecord - The hours record being changed
   * @param changes - Object with field names and new values
   * @param userName - User making the change
   * @param userRole - Role of user making change
   * @param description - Description of the change operation
   * @returns Success result
   */
  async trackMultipleChanges(
    hoursRecord: EmployeeHours,
    changes: Record<string, { oldValue: string; newValue: string }>,
    userName: string,
    userRole: string,
    description: string = 'Multiple fields modified'
  ): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    for (const [fieldName, change] of Object.entries(changes)) {
      const result = await this.addDataHistory({
        hoursId: hoursRecord.id,
        empNum: hoursRecord.empNum,
        fieldChanged: fieldName,
        collectionName: 'EmployeeHours',
        oldData: change.oldValue,
        newData: change.newValue,
        editDescription: description,
        userName,
        userRole
      });

      if (!result.success) {
        errors.push(`Failed to track change for ${fieldName}: ${result.error}`);
      }
    }

    return {
      success: errors.length === 0,
      errors
    };
  }
}

// Factory function to create service with repository
export function createAuditTrailService(repository: AuditRepository): AuditTrailService {
  return new AuditTrailService(repository);
}
