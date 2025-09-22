import { useState } from 'react';
import Card from '../../components/ui/card';
import Button from '../../components/ui/button';

interface Employee {
    id: string;
    name: string;
    empNum: number;
    department: string;
    status: 'active' | 'inactive';
}

interface TimeEntry {
    id: string;
    employee: string;
    date: string;
    jobNum: string;
    operation: string;
    hours: number;
    status: 'pending' | 'approved' | 'rejected';
}

export default function ManagerHoursPage() {
    const [selectedEmployee, setSelectedEmployee] = useState('all');
    const [actionType, setActionType] = useState<'review' | 'add' | 'edit'>('review');

    // Mock data
    const [employees] = useState<Employee[]>([
        { id: 'emp1', name: 'John Doe', empNum: 101, department: 'Manufacturing', status: 'active' },
        { id: 'emp2', name: 'Jane Smith', empNum: 102, department: 'Assembly', status: 'active' },
        { id: 'emp3', name: 'Mike Johnson', empNum: 103, department: 'Quality', status: 'active' },
        { id: 'emp4', name: 'Sarah Wilson', empNum: 104, department: 'Manufacturing', status: 'active' }
    ]);

    const [pendingEntries] = useState<TimeEntry[]>([
        { id: 'te1', employee: 'John Doe', date: '2025-09-22', jobNum: 'J001', operation: 'Op 20', hours: 8.0, status: 'pending' },
        { id: 'te2', employee: 'Jane Smith', date: '2025-09-22', jobNum: 'J002', operation: 'Op 30', hours: 7.5, status: 'pending' },
        { id: 'te3', employee: 'Mike Johnson', date: '2025-09-21', jobNum: 'J003', operation: 'Op 40', hours: 8.0, status: 'pending' }
    ]);

    const [newEntry, setNewEntry] = useState({
        employee: '',
        date: '',
        jobNum: '',
        operation: '',
        hours: '',
        notes: ''
    });

    const handleApproveEntry = (entryId: string) => {
        console.log('Approving entry:', entryId);
        // API call to approve entry
    };

    const handleRejectEntry = (entryId: string) => {
        console.log('Rejecting entry:', entryId);
        // API call to reject entry
    };

    const handleAddEntry = () => {
        if (!newEntry.employee || !newEntry.date || !newEntry.jobNum || !newEntry.hours) {
            alert('Please fill in all required fields.');
            return;
        }

        console.log('Adding new entry:', newEntry);
        // API call to add entry

        // Reset form
        setNewEntry({
            employee: '',
            date: '',
            jobNum: '',
            operation: '',
            hours: '',
            notes: ''
        });
    };

    const getPendingCount = () => {
        return pendingEntries.filter(entry =>
            selectedEmployee === 'all' || entry.employee === selectedEmployee
        ).length;
    };

    const renderReviewSection = () => (
        <Card>
            <h3 className="text-lg font-semibold text-text mb-4">Pending Time Entries for Approval</h3>
            <div className="space-y-3">
                {pendingEntries
                    .filter(entry => selectedEmployee === 'all' || entry.employee === selectedEmployee)
                    .map((entry) => (
                        <div key={entry.id} className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <span className="font-semibold text-text">{entry.employee}</span>
                                        <span className="text-text-muted">{entry.date}</span>
                                        <span className="text-text-muted">{entry.jobNum} - {entry.operation}</span>
                                        <span className="text-text-muted">{entry.hours} hours</span>
                                    </div>
                                    <span className="inline-block px-2 py-1 text-xs bg-orange-200 text-orange-800 rounded">
                                        Pending Approval
                                    </span>
                                </div>
                                <div className="flex space-x-2">
                                    <Button
                                        onClick={() => handleApproveEntry(entry.id)}
                                        variant="primary"
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        Approve
                                    </Button>
                                    <Button
                                        onClick={() => handleRejectEntry(entry.id)}
                                        variant="secondary"
                                        size="sm"
                                        className="text-red-600 border-red-300 hover:bg-red-50"
                                    >
                                        Reject
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}

                {getPendingCount() === 0 && (
                    <div className="text-center py-8">
                        <p className="text-text-muted">No pending entries for approval.</p>
                    </div>
                )}
            </div>
        </Card>
    );

    const renderAddSection = () => (
        <Card>
            <h3 className="text-lg font-semibold text-text mb-4">Add Time Entry for Employee</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-text mb-2">Employee <span className="text-red-500">*</span></label>
                    <select
                        value={newEntry.employee}
                        onChange={(e) => setNewEntry({ ...newEntry, employee: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Select Employee</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.name}>{emp.name} (#{emp.empNum})</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-text mb-2">Date <span className="text-red-500">*</span></label>
                    <input
                        type="date"
                        value={newEntry.date}
                        onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text mb-2">Job Number <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        value={newEntry.jobNum}
                        onChange={(e) => setNewEntry({ ...newEntry, jobNum: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. J001"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text mb-2">Operation</label>
                    <input
                        type="text"
                        value={newEntry.operation}
                        onChange={(e) => setNewEntry({ ...newEntry, operation: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. Op 20"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text mb-2">Hours <span className="text-red-500">*</span></label>
                    <input
                        type="number"
                        step="0.25"
                        value={newEntry.hours}
                        onChange={(e) => setNewEntry({ ...newEntry, hours: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="8.0"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text mb-2">Notes</label>
                    <input
                        type="text"
                        value={newEntry.notes}
                        onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Optional notes"
                    />
                </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
                <Button
                    onClick={() => setNewEntry({
                        employee: '',
                        date: '',
                        jobNum: '',
                        operation: '',
                        hours: '',
                        notes: ''
                    })}
                    variant="secondary"
                >
                    Clear Form
                </Button>
                <Button
                    onClick={handleAddEntry}
                    variant="primary"
                >
                    Add Entry
                </Button>
            </div>
        </Card>
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-text mb-2">Manager Hours</h1>
                <p className="text-text-muted">Manage employee time entries and approvals</p>
            </div>

            {/* Action Selector */}
            <Card>
                <div className="flex space-x-4">
                    <Button
                        onClick={() => setActionType('review')}
                        variant={actionType === 'review' ? 'primary' : 'secondary'}
                    >
                        Review & Approve ({getPendingCount()})
                    </Button>
                    <Button
                        onClick={() => setActionType('add')}
                        variant={actionType === 'add' ? 'primary' : 'secondary'}
                    >
                        Add Hours for Employee
                    </Button>
                    <Button
                        onClick={() => setActionType('edit')}
                        variant={actionType === 'edit' ? 'primary' : 'secondary'}
                    >
                        Edit Existing Hours
                    </Button>
                </div>
            </Card>

            {/* Employee Filter */}
            <Card>
                <div className="flex items-center space-x-4">
                    <label className="text-sm font-medium text-text">Filter by Employee:</label>
                    <select
                        value={selectedEmployee}
                        onChange={(e) => setSelectedEmployee(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Employees</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.name}>{emp.name}</option>
                        ))}
                    </select>
                </div>
            </Card>

            {/* Content based on action type */}
            {actionType === 'review' && renderReviewSection()}
            {actionType === 'add' && renderAddSection()}
            {actionType === 'edit' && (
                <Card>
                    <h3 className="text-lg font-semibold text-text mb-4">Edit Existing Hours</h3>
                    <p className="text-text-muted">Edit functionality coming soon...</p>
                </Card>
            )}

            {/* Quick Stats */}
            <Card>
                <h3 className="text-lg font-semibold text-text mb-4">Quick Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-text">{employees.filter(e => e.status === 'active').length}</p>
                        <p className="text-text-muted">Active Employees</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-orange-600">{pendingEntries.length}</p>
                        <p className="text-text-muted">Pending Approvals</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-text">24</p>
                        <p className="text-text-muted">Entries This Week</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-text">186.5</p>
                        <p className="text-text-muted">Total Hours This Week</p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
