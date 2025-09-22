import { Router, Request, Response } from 'express';

// Enhanced time tracking interfaces
interface TimeTrackingResult {
    success: boolean;
    data?: any;
    errors?: string[];
    warnings?: string[];
}

interface ClockInRequest {
    empNum?: number;
    employeeId?: string;
    employeeName?: string;
    jobCode?: number;
    costCode?: string;
    jobDesc?: string;
}

interface ClockOutRequest {
    empNum?: number;
    quantity?: number;
    splitCode?: string;
}

interface Employee {
    id: string;
    name: string;
    number: string;
}

interface TimeEntry {
    id: string;
    employeeId: string;
    employeeName: string;
    date: string;
    clockIn: string;
    clockOut?: string;
    totalHours: number;
    operation?: string;
    job?: string;
    status: 'active' | 'completed';
}

interface HistoryEntry {
    id: string;
    timestamp: string;
    action: 'clock-in' | 'clock-out' | 'edit' | 'delete' | 'create';
    employeeName: string;
    employeeId: string;
    description: string;
    oldValue?: string;
    newValue?: string;
    modifiedBy?: string;
}

interface Job {
    id: string;
    jobNumber: string;
    description: string;
    customer: string;
    operations: { operation: number; description: string; }[];
}

// Enhanced in-memory time tracking service
class SimpleTimeTrackingService {
    private activeClockIns = new Map<string, any>();
    private timeEntries: TimeEntry[] = [];
    private historyEntries: HistoryEntry[] = [];
    private employees: Employee[] = [
        { id: '1', name: 'John Doe', number: '001' },
        { id: '2', name: 'Jane Smith', number: '002' },
        { id: '3', name: 'Bob Johnson', number: '003' },
        { id: '4', name: 'Alice Brown', number: '004' },
        { id: '5', name: 'Mike Wilson', number: '005' },
    ];
    private jobs: Job[] = [
        {
            id: 'job1',
            jobNumber: 'J12345',
            description: 'Manufacturing Order - Widget Assembly',
            customer: 'ACME Corp',
            operations: [
                { operation: 10, description: 'Setup and Preparation' },
                { operation: 20, description: 'Material Handling' },
                { operation: 30, description: 'Assembly Process' },
                { operation: 40, description: 'Quality Control' },
                { operation: 50, description: 'Packaging' },
            ],
        },
        {
            id: 'job2',
            jobNumber: 'J12346',
            description: 'Custom Fabrication - Steel Components',
            customer: 'Industrial Solutions Inc',
            operations: [
                { operation: 10, description: 'Material Prep' },
                { operation: 20, description: 'Cutting Operations' },
                { operation: 30, description: 'Welding' },
                { operation: 40, description: 'Finishing' },
            ],
        },
        {
            id: 'job3',
            jobNumber: 'J12347',
            description: 'Maintenance Work Order',
            customer: 'Internal',
            operations: [
                { operation: 10, description: 'Inspection' },
                { operation: 20, description: 'Repair Work' },
                { operation: 30, description: 'Testing' },
            ],
        },
    ];

    constructor() {
        this.generateSampleData();
    }

    private generateSampleData() {
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        // Generate sample time entries for the past week
        for (let i = 0; i < 7; i++) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];

            this.employees.forEach((emp, index) => {
                if (Math.random() > 0.3) { // 70% chance employee worked on this day
                    const clockIn = `${Math.floor(Math.random() * 3) + 7}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;
                    const clockOut = `${Math.floor(Math.random() * 3) + 15}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;
                    const hours = Math.random() * 4 + 6; // 6-10 hours

                    this.timeEntries.push({
                        id: `entry_${Date.now()}_${index}_${i}`,
                        employeeId: emp.id,
                        employeeName: emp.name,
                        date: dateStr,
                        clockIn,
                        clockOut: i === 0 && index === 0 ? undefined : clockOut,
                        totalHours: hours,
                        operation: `${(Math.floor(Math.random() * 5) + 1) * 10}`,
                        job: this.jobs[Math.floor(Math.random() * this.jobs.length)].jobNumber,
                        status: i === 0 && index === 0 ? 'active' : 'completed',
                    });
                }
            });
        }

        // Generate sample history entries
        const actions = ['clock-in', 'clock-out', 'edit', 'create'] as const;
        for (let i = 0; i < 20; i++) {
            const timestamp = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
            const employee = this.employees[Math.floor(Math.random() * this.employees.length)];
            const action = actions[Math.floor(Math.random() * actions.length)];

            this.historyEntries.push({
                id: `hist_${i}`,
                timestamp: timestamp.toISOString(),
                action,
                employeeName: employee.name,
                employeeId: employee.id,
                description: this.getActionDescription(action, employee.name),
            });
        }
    }

    private getActionDescription(action: string, employeeName: string): string {
        switch (action) {
            case 'clock-in':
                return `${employeeName} clocked in for work`;
            case 'clock-out':
                return `${employeeName} clocked out`;
            case 'edit':
                return `Time entry modified for ${employeeName}`;
            case 'create':
                return `New time entry created for ${employeeName}`;
            default:
                return `${action} performed for ${employeeName}`;
        }
    }

    async getEmployeeStatus(empNum: number): Promise<TimeTrackingResult> {
        const active = this.activeClockIns.get(empNum.toString());
        return {
            success: true,
            data: {
                empNum,
                isClocked: !!active,
                activeEntry: active || null
            }
        };
    }

    async getStats(): Promise<TimeTrackingResult> {
        const today = new Date().toISOString().split('T')[0];
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        const weekStartStr = weekStart.toISOString().split('T')[0];

        const todayEntries = this.timeEntries.filter(entry => entry.date === today);
        const weekEntries = this.timeEntries.filter(entry => entry.date >= weekStartStr);

        return {
            success: true,
            data: {
                totalEmployees: this.employees.length,
                activeSessions: this.timeEntries.filter(entry => entry.status === 'active').length,
                todayHours: todayEntries.reduce((sum, entry) => sum + entry.totalHours, 0),
                weekHours: weekEntries.reduce((sum, entry) => sum + entry.totalHours, 0),
            }
        };
    }

    async clockIn(request: ClockInRequest): Promise<TimeTrackingResult> {
        const employeeId = request.employeeId || request.empNum?.toString();
        if (!employeeId) {
            return {
                success: false,
                errors: ['Employee ID is required']
            };
        }

        if (this.activeClockIns.has(employeeId)) {
            return {
                success: false,
                errors: ['Employee is already clocked in']
            };
        }

        const clockInTime = new Date().toISOString();
        const entry = {
            id: `entry_${Date.now()}`,
            employeeId,
            employeeName: request.employeeName || 'Unknown',
            timeIn: clockInTime,
            jobCode: request.jobCode || 0,
            costCode: request.costCode,
            jobDesc: request.jobDesc,
            isActive: true
        };

        this.activeClockIns.set(employeeId, entry);

        // Add to history
        this.historyEntries.unshift({
            id: `hist_${Date.now()}`,
            timestamp: clockInTime,
            action: 'clock-in',
            employeeName: request.employeeName || 'Unknown',
            employeeId,
            description: `${request.employeeName} clocked in for work`,
        });

        return {
            success: true,
            data: {
                clockInTime,
                entry
            }
        };
    }

    async clockOut(request: ClockOutRequest): Promise<TimeTrackingResult> {
        const employeeId = request.empNum?.toString();
        if (!employeeId) {
            return {
                success: false,
                errors: ['Employee ID is required']
            };
        }

        const active = this.activeClockIns.get(employeeId);
        if (!active) {
            return {
                success: false,
                errors: ['No active clock in found for employee']
            };
        }

        const clockOutTime = new Date().toISOString();
        active.timeOut = clockOutTime;
        active.quantity = request.quantity;
        active.splitCode = request.splitCode;
        active.isActive = false;

        this.activeClockIns.delete(employeeId);

        // Add to history
        this.historyEntries.unshift({
            id: `hist_${Date.now()}`,
            timestamp: clockOutTime,
            action: 'clock-out',
            employeeName: active.employeeName,
            employeeId,
            description: `${active.employeeName} clocked out`,
        });

        return {
            success: true,
            data: active
        };
    }

    async getEmployees(): Promise<Employee[]> {
        return this.employees;
    }

    async getJobs(): Promise<Job[]> {
        return this.jobs;
    }

    async getTimeEntries(filters: any): Promise<TimeEntry[]> {
        let entries = [...this.timeEntries];

        if (filters.startDate) {
            entries = entries.filter(entry => entry.date >= filters.startDate);
        }

        if (filters.endDate) {
            entries = entries.filter(entry => entry.date <= filters.endDate);
        }

        if (filters.employeeId) {
            entries = entries.filter(entry => entry.employeeId === filters.employeeId);
        }

        return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    async getHistory(filters: any): Promise<HistoryEntry[]> {
        let entries = [...this.historyEntries];

        if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            entries = entries.filter(entry => new Date(entry.timestamp) >= startDate);
        }

        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999);
            entries = entries.filter(entry => new Date(entry.timestamp) <= endDate);
        }

        if (filters.employeeFilter) {
            entries = entries.filter(entry =>
                entry.employeeName.toLowerCase().includes(filters.employeeFilter.toLowerCase())
            );
        }

        return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    async getCurrentEmployee(): Promise<Employee | null> {
        // For demo purposes, return the first active employee
        const activeEmployeeId = Array.from(this.activeClockIns.keys())[0];
        if (activeEmployeeId) {
            return this.employees.find(emp => emp.id === activeEmployeeId) || null;
        }
        return null;
    }
}

// Initialize service
const timeTrackingService = new SimpleTimeTrackingService();

// Create router
const timeTrackingRouter = Router();

// Get employee status
timeTrackingRouter.get('/status/:empNum', async (req: Request, res: Response) => {
    try {
        const empNum = parseInt(req.params.empNum);
        const result = await timeTrackingService.getEmployeeStatus(empNum);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            errors: ['Internal server error']
        });
    }
});

// Get overall status
timeTrackingRouter.get('/status', async (req: Request, res: Response) => {
    try {
        // Return mock status for now
        res.json({
            isClockedIn: false,
            currentSession: null
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            errors: ['Internal server error']
        });
    }
});

// Get stats
timeTrackingRouter.get('/stats', async (req: Request, res: Response) => {
    try {
        const result = await timeTrackingService.getStats();
        res.json(result.data);
    } catch (error) {
        res.status(500).json({
            success: false,
            errors: ['Internal server error']
        });
    }
});

// Get employees
timeTrackingRouter.get('/employees', async (req: Request, res: Response) => {
    try {
        const employees = await timeTrackingService.getEmployees();
        res.json(employees);
    } catch (error) {
        res.status(500).json({
            success: false,
            errors: ['Internal server error']
        });
    }
});

// Get jobs
timeTrackingRouter.get('/jobs', async (req: Request, res: Response) => {
    try {
        const jobs = await timeTrackingService.getJobs();
        res.json(jobs);
    } catch (error) {
        res.status(500).json({
            success: false,
            errors: ['Internal server error']
        });
    }
});

// Get current employee
timeTrackingRouter.get('/current-employee', async (req: Request, res: Response) => {
    try {
        const employee = await timeTrackingService.getCurrentEmployee();
        if (employee) {
            res.json(employee);
        } else {
            res.status(404).json({ error: 'No current employee found' });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            errors: ['Internal server error']
        });
    }
});

// Clock in
timeTrackingRouter.post('/clock-in', async (req: Request, res: Response) => {
    try {
        const result = await timeTrackingService.clockIn(req.body);
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            errors: ['Internal server error']
        });
    }
});

// Clock out
timeTrackingRouter.post('/clock-out', async (req: Request, res: Response) => {
    try {
        const result = await timeTrackingService.clockOut(req.body);
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            errors: ['Internal server error']
        });
    }
});

// Get time entries
timeTrackingRouter.post('/entries', async (req: Request, res: Response) => {
    try {
        const entries = await timeTrackingService.getTimeEntries(req.body);
        res.json(entries);
    } catch (error) {
        res.status(500).json({
            success: false,
            errors: ['Internal server error']
        });
    }
});

// Get history
timeTrackingRouter.post('/history', async (req: Request, res: Response) => {
    try {
        const history = await timeTrackingService.getHistory(req.body);
        res.json(history);
    } catch (error) {
        res.status(500).json({
            success: false,
            errors: ['Internal server error']
        });
    }
});

// Get job history (same as regular history for now)
timeTrackingRouter.post('/job-history', async (req: Request, res: Response) => {
    try {
        // Mock job history data
        const jobHistory = [
            {
                id: 'jh1',
                jobNumber: 'J12345',
                employeeName: 'John Doe',
                operation: '010 - Setup',
                startTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
                endTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                totalHours: 2.0,
                status: 'completed'
            },
            {
                id: 'jh2',
                jobNumber: 'J12346',
                employeeName: 'Jane Smith',
                operation: '020 - Assembly',
                startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                endTime: undefined,
                totalHours: undefined,
                status: 'active'
            }
        ];
        res.json(jobHistory);
    } catch (error) {
        res.status(500).json({
            success: false,
            errors: ['Internal server error']
        });
    }
});

// Start operation
timeTrackingRouter.post('/start-operation', async (req: Request, res: Response) => {
    try {
        // Mock successful operation start
        res.json({
            success: true,
            message: 'Operation started successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            errors: ['Internal server error']
        });
    }
});

export default timeTrackingRouter;
