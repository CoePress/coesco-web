import { instance } from '../utils';

export interface TimeTrackingStats {
    totalEmployees: number;
    activeSessions: number;
    todayHours: number;
    weekHours: number;
}

export interface Employee {
    empNum: number;
    name: string;
    clockedIn: boolean;
    currentOperation?: string;
    todayHours: number;
}

export interface Job {
    jobNum: string;
    description: string;
    customer: string;
    status: string;
}

export interface Operation {
    opNum: number;
    description: string;
    jobNum: string;
    standardTime?: number;
}

export interface TimeEntry {
    id: string;
    empNum: number;
    employeeName: string;
    opNum: number;
    operation: string;
    jobNum: string;
    clockInTime: string;
    clockOutTime?: string;
    totalTime?: number;
    units?: string;
    costCode?: string;
}

export interface ClockStatus {
    clockedIn: boolean;
    currentOperation?: Operation;
    clockInTime?: string;
    elapsedTime?: number;
}

export class TimeTrackingService {
    private static readonly BASE_PATH = '/time-tracking';

    // Statistics
    static async getStats(): Promise<TimeTrackingStats> {
        const response = await instance.get(`${this.BASE_PATH}/stats`);
        return response.data;
    }

    // Employee management
    static async getEmployees(): Promise<Employee[]> {
        const response = await instance.get(`${this.BASE_PATH}/employees`);
        return response.data;
    }

    static async getCurrentEmployee(): Promise<Employee> {
        const response = await instance.get(`${this.BASE_PATH}/current-employee`);
        return response.data;
    }

    // Clock operations
    static async getClockStatus(empNum: number): Promise<ClockStatus> {
        const response = await instance.get(`${this.BASE_PATH}/clock-status/${empNum}`);
        return response.data;
    }

    static async clockIn(empNum: number, opNum: number, costCode?: string): Promise<void> {
        await instance.post(`${this.BASE_PATH}/clock-in`, {
            empNum,
            opNum,
            costCode,
        });
    }

    static async clockOut(empNum: number, units?: string, split?: string): Promise<void> {
        await instance.post(`${this.BASE_PATH}/clock-out`, {
            empNum,
            units,
            split,
        });
    }

    // Jobs and operations
    static async getJobs(): Promise<Job[]> {
        const response = await instance.get(`${this.BASE_PATH}/jobs`);
        return response.data;
    }

    static async getOperations(jobNum?: string): Promise<Operation[]> {
        const params = jobNum ? { jobNum } : {};
        const response = await instance.get(`${this.BASE_PATH}/operations`, { params });
        return response.data;
    }

    static async startOperation(empNum: number, opNum: number): Promise<void> {
        await instance.post(`${this.BASE_PATH}/start-operation`, {
            empNum,
            opNum,
        });
    }

    // Time entries and history
    static async getTimeEntries(
        empNum?: number,
        startDate?: string,
        endDate?: string
    ): Promise<TimeEntry[]> {
        const params: any = {};
        if (empNum) params.empNum = empNum;
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        const response = await instance.post(`${this.BASE_PATH}/entries`, params);
        return response.data;
    }

    static async getHistory(
        empNum?: number,
        startDate?: string,
        endDate?: string
    ): Promise<TimeEntry[]> {
        const params: any = {};
        if (empNum) params.empNum = empNum;
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        const response = await instance.post(`${this.BASE_PATH}/history`, params);
        return response.data;
    }
}
