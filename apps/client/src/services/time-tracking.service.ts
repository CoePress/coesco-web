// Client-side time tracking service
// Handles API communication for time tracking operations

import {
  TimeEntry,
  Employee,
  Job,
  ClockInRequest,
  ClockOutRequest,
  ApiResponse,
  EmployeeStatus,
  TimeTrackingStats,
  HistoryEntry
} from '../types/time-tracking.types';

const API_BASE = '/api/time-tracking';

export class TimeTrackingService {

  /**
   * Clock in an employee
   */
  async clockIn(request: ClockInRequest): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE}/clock-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        errors: ['Failed to clock in. Please try again.']
      };
    }
  }

  /**
   * Clock out an employee
   */
  async clockOut(request: ClockOutRequest): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE}/clock-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        errors: ['Failed to clock out. Please try again.']
      };
    }
  }

  /**
   * Get employee clock status
   */
  async getEmployeeStatus(empNum: number): Promise<ApiResponse<EmployeeStatus>> {
    try {
      const response = await fetch(`${API_BASE}/status/${empNum}`);
      return await response.json();
    } catch (error) {
      return {
        success: false,
        errors: ['Failed to get employee status']
      };
    }
  }

  /**
   * Get overall time tracking statistics
   */
  async getStats(): Promise<ApiResponse<TimeTrackingStats>> {
    try {
      const response = await fetch(`${API_BASE}/status`);
      return await response.json();
    } catch (error) {
      return {
        success: false,
        errors: ['Failed to get statistics']
      };
    }
  }

  /**
   * Get list of employees
   */
  async getEmployees(): Promise<ApiResponse<Employee[]>> {
    try {
      const response = await fetch(`${API_BASE}/employees`);
      return await response.json();
    } catch (error) {
      return {
        success: false,
        errors: ['Failed to get employees']
      };
    }
  }

  /**
   * Get list of jobs
   */
  async getJobs(): Promise<ApiResponse<Job[]>> {
    try {
      const response = await fetch(`${API_BASE}/jobs`);
      return await response.json();
    } catch (error) {
      return {
        success: false,
        errors: ['Failed to get jobs']
      };
    }
  }

  /**
   * Get time entries with optional filters
   */
  async getTimeEntries(filters?: {
    startDate?: string;
    endDate?: string;
    employeeFilter?: string;
    statusFilter?: string;
  }): Promise<ApiResponse<TimeEntry[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.startDate) queryParams.append('startDate', filters.startDate);
      if (filters?.endDate) queryParams.append('endDate', filters.endDate);
      if (filters?.employeeFilter) queryParams.append('employeeFilter', filters.employeeFilter);
      if (filters?.statusFilter) queryParams.append('statusFilter', filters.statusFilter);

      const url = `${API_BASE}/entries${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      return {
        success: false,
        errors: ['Failed to get time entries']
      };
    }
  }

  /**
   * Get history entries
   */
  async getHistory(filters?: {
    startDate?: string;
    endDate?: string;
    employeeFilter?: string;
  }): Promise<ApiResponse<HistoryEntry[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.startDate) queryParams.append('startDate', filters.startDate);
      if (filters?.endDate) queryParams.append('endDate', filters.endDate);
      if (filters?.employeeFilter) queryParams.append('employeeFilter', filters.employeeFilter);

      const url = `${API_BASE}/history${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      return {
        success: false,
        errors: ['Failed to get history']
      };
    }
  }

  /**
   * Get current employee (demo/testing)
   */
  async getCurrentEmployee(): Promise<ApiResponse<Employee>> {
    try {
      const response = await fetch(`${API_BASE}/current-employee`);
      return await response.json();
    } catch (error) {
      return {
        success: false,
        errors: ['Failed to get current employee']
      };
    }
  }

  /**
   * Create a new time entry (for managers)
   */
  async createTimeEntry(entry: Partial<TimeEntry>): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE}/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        errors: ['Failed to create time entry']
      };
    }
  }

  /**
   * Update a time entry (for managers)
   */
  async updateTimeEntry(id: string, updates: Partial<TimeEntry>): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE}/entries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        errors: ['Failed to update time entry']
      };
    }
  }

  /**
   * Delete a time entry (for managers)
   */
  async deleteTimeEntry(id: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE}/entries/${id}`, {
        method: 'DELETE',
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        errors: ['Failed to delete time entry']
      };
    }
  }
}

// Export singleton instance
export const timeTrackingService = new TimeTrackingService();
