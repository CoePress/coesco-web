import { useState } from 'react';
import Card from '../../components/ui/card';
import Button from '../../components/ui/button';

interface TimeEntry {
    id: string;
    date: string;
    jobNum: string;
    operation: string;
    startTime: string;
    endTime: string;
    totalHours: number;
    unitsProduced?: number;
    notes?: string;
    employee: string;
}

export default function TimeHistoryPage() {
    const [dateRange, setDateRange] = useState('week');
    const [selectedEmployee, setSelectedEmployee] = useState('all');
    const [selectedJob, setSelectedJob] = useState('all');

    // Mock time entries data
    const [timeEntries] = useState<TimeEntry[]>([
        {
            id: 'te001',
            date: '2025-09-22',
            jobNum: 'J001',
            operation: 'Op 20',
            startTime: '08:00',
            endTime: '12:00',
            totalHours: 4.0,
            unitsProduced: 25,
            notes: 'Normal production run',
            employee: 'John Doe'
        },
        {
            id: 'te002',
            date: '2025-09-22',
            jobNum: 'J002',
            operation: 'Op 30',
            startTime: '13:00',
            endTime: '17:00',
            totalHours: 4.0,
            unitsProduced: 18,
            notes: '',
            employee: 'Jane Smith'
        },
        {
            id: 'te003',
            date: '2025-09-21',
            jobNum: 'J001',
            operation: 'Op 10',
            startTime: '08:00',
            endTime: '16:00',
            totalHours: 8.0,
            unitsProduced: 45,
            notes: 'Machine setup required',
            employee: 'John Doe'
        },
        {
            id: 'te004',
            date: '2025-09-21',
            jobNum: 'J003',
            operation: 'Op 40',
            startTime: '09:00',
            endTime: '17:00',
            totalHours: 8.0,
            unitsProduced: 0,
            notes: 'Quality inspection',
            employee: 'Mike Johnson'
        }
    ]);

    const getFilteredEntries = () => {
        return timeEntries.filter(entry => {
            const employeeMatch = selectedEmployee === 'all' || entry.employee === selectedEmployee;
            const jobMatch = selectedJob === 'all' || entry.jobNum === selectedJob;
            return employeeMatch && jobMatch;
        });
    };

    const getTotalHours = () => {
        return getFilteredEntries().reduce((total, entry) => total + entry.totalHours, 0);
    };

    const getTotalUnits = () => {
        return getFilteredEntries().reduce((total, entry) => total + (entry.unitsProduced || 0), 0);
    };

    const getUniqueEmployees = () => {
        return [...new Set(timeEntries.map(entry => entry.employee))];
    };

    const getUniqueJobs = () => {
        return [...new Set(timeEntries.map(entry => entry.jobNum))];
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-text mb-2">Time History</h1>
                <p className="text-text-muted">View and analyze time tracking history</p>
            </div>

            {/* Filters */}
            <Card>
                <h3 className="text-lg font-semibold text-text mb-4">Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-text mb-2">Date Range</label>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text mb-2">Employee</label>
                        <select
                            value={selectedEmployee}
                            onChange={(e) => setSelectedEmployee(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Employees</option>
                            {getUniqueEmployees().map(employee => (
                                <option key={employee} value={employee}>{employee}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text mb-2">Job</label>
                        <select
                            value={selectedJob}
                            onChange={(e) => setSelectedJob(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Jobs</option>
                            {getUniqueJobs().map(job => (
                                <option key={job} value={job}>{job}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </Card>

            {/* Summary Statistics */}
            <Card>
                <h3 className="text-lg font-semibold text-text mb-4">Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-text">{getFilteredEntries().length}</p>
                        <p className="text-text-muted">Time Entries</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-text">{getTotalHours().toFixed(1)}</p>
                        <p className="text-text-muted">Total Hours</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-text">{getTotalUnits()}</p>
                        <p className="text-text-muted">Units Produced</p>
                    </div>
                </div>
            </Card>

            {/* Time Entries List */}
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-text">Time Entries</h3>
                    <Button variant="secondary" size="sm">
                        Export to CSV
                    </Button>
                </div>
                <div className="space-y-3">
                    {getFilteredEntries().map((entry) => (
                        <div key={entry.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-4 mb-2">
                                        <span className="font-semibold text-text">{entry.date}</span>
                                        <span className="text-text-muted">{entry.employee}</span>
                                        <span className="text-text-muted">{entry.jobNum} - {entry.operation}</span>
                                        <span className="text-text-muted">{entry.startTime} - {entry.endTime}</span>
                                    </div>
                                    <div className="flex items-center space-x-4 text-sm text-text-muted">
                                        <span>Hours: {entry.totalHours}</span>
                                        {entry.unitsProduced !== undefined && entry.unitsProduced > 0 && (
                                            <span>Units: {entry.unitsProduced}</span>
                                        )}
                                        <span>Rate: {entry.unitsProduced && entry.totalHours > 0 ? (entry.unitsProduced / entry.totalHours).toFixed(1) : 'N/A'} units/hr</span>
                                    </div>
                                    {entry.notes && (
                                        <p className="text-sm text-text-muted mt-2 italic">"{entry.notes}"</p>
                                    )}
                                </div>
                                <div className="flex space-x-2">
                                    <Button variant="secondary" size="sm">
                                        Edit
                                    </Button>
                                    <Button variant="secondary" size="sm">
                                        Split
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {getFilteredEntries().length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-text-muted">No time entries found for the selected filters.</p>
                    </div>
                )}
            </Card>

            {/* Actions */}
            <Card>
                <h3 className="text-lg font-semibold text-text mb-4">Actions</h3>
                <div className="flex space-x-4">
                    <Button variant="primary">
                        Generate Report
                    </Button>
                    <Button variant="secondary">
                        Bulk Edit
                    </Button>
                    <Button variant="secondary">
                        Archive Old Entries
                    </Button>
                </div>
            </Card>
        </div>
    );
}
