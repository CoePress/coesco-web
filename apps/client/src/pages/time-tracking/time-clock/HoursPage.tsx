import { useState } from 'react';
import Card from '../../../components/ui/card';
import Button from '../../../components/ui/button';
import { BasePageProps } from './types';

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
}

export default function HoursPage({
    currentEmployee,
    navigationContext,
    NavigateToPage,
    NavigateToRootPage
}: BasePageProps) {
    const [showNoteDialog, setShowNoteDialog] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [selectedEntry, setSelectedEntry] = useState<string>('');

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
            notes: 'Normal production run'
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
            notes: ''
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
            notes: 'Machine setup required'
        }
    ]);

    const handleHistory = () => {
        NavigateToPage('History', {
            ...navigationContext,
            fromPage: 'Hours'
        });
    };

    const handleSplitHours = () => {
        NavigateToPage('SplitHours', {
            ...navigationContext,
            fromPage: 'Hours'
        });
    };

    const handleEditHours = () => {
        NavigateToPage('EditHoursEmp', {
            ...navigationContext,
            fromPage: 'Hours'
        });
    };

    const handleAddNote = (entryId: string) => {
        setSelectedEntry(entryId);
        const entry = timeEntries.find(e => e.id === entryId);
        setNoteText(entry?.notes || '');
        setShowNoteDialog(true);
    };

    const handleSaveNote = () => {
        console.log('Saving note for entry:', selectedEntry, 'Note:', noteText);
        // API call to save note
        setShowNoteDialog(false);
        setNoteText('');
        setSelectedEntry('');
    };

    const handleBack = () => {
        NavigateToRootPage();
    };

    const getTotalHoursToday = () => {
        const today = new Date().toISOString().split('T')[0];
        return timeEntries
            .filter(entry => entry.date === today)
            .reduce((total, entry) => total + entry.totalHours, 0);
    };

    const getTotalUnitsToday = () => {
        const today = new Date().toISOString().split('T')[0];
        return timeEntries
            .filter(entry => entry.date === today)
            .reduce((total, entry) => total + (entry.unitsProduced || 0), 0);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-text mb-2">Hours Management</h2>
                    <p className="text-text-muted">Review and manage your time entries</p>
                </div>
                <Button onClick={handleBack} variant="secondary">
                    Back to Time Clock
                </Button>
            </div>

            {/* Employee Context */}
            <Card className="bg-blue-50 border-blue-200">
                <div className="flex justify-between items-center">
                    <div>
                        <h4 className="font-semibold text-text">Employee: {currentEmployee.name}</h4>
                        <p className="text-sm text-text-muted">Employee #: {currentEmployee.empNum}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-text-muted">Today's Totals:</p>
                        <p className="font-semibold text-text">{getTotalHoursToday()} hours | {getTotalUnitsToday()} units</p>
                    </div>
                </div>
            </Card>

            {/* Action Buttons */}
            <Card>
                <h3 className="text-lg font-semibold text-text mb-4">Hours Management Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Button
                        onClick={handleHistory}
                        variant="secondary"
                        className="flex flex-col items-center p-4 h-auto"
                    >
                        <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Time History</span>
                    </Button>

                    <Button
                        onClick={handleSplitHours}
                        variant="secondary"
                        className="flex flex-col items-center p-4 h-auto"
                    >
                        <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        <span>Split Hours</span>
                    </Button>

                    <Button
                        onClick={handleEditHours}
                        variant="secondary"
                        className="flex flex-col items-center p-4 h-auto"
                    >
                        <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Edit Hours</span>
                    </Button>

                    <Button
                        onClick={handleBack}
                        variant="primary"
                        className="flex flex-col items-center p-4 h-auto"
                    >
                        <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Done</span>
                    </Button>
                </div>
            </Card>

            {/* Recent Time Entries */}
            <Card>
                <h3 className="text-lg font-semibold text-text mb-4">Recent Time Entries</h3>
                <div className="space-y-3">
                    {timeEntries.slice(0, 5).map((entry) => (
                        <div key={entry.id} className="p-4 border border-gray-200 rounded-lg">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-4 mb-2">
                                        <span className="font-semibold text-text">{entry.date}</span>
                                        <span className="text-text-muted">{entry.jobNum} - {entry.operation}</span>
                                        <span className="text-text-muted">{entry.startTime} - {entry.endTime}</span>
                                    </div>
                                    <div className="flex items-center space-x-4 text-sm text-text-muted">
                                        <span>Hours: {entry.totalHours}</span>
                                        {entry.unitsProduced && <span>Units: {entry.unitsProduced}</span>}
                                    </div>
                                    {entry.notes && (
                                        <p className="text-sm text-text-muted mt-2 italic">"{entry.notes}"</p>
                                    )}
                                </div>
                                <Button
                                    onClick={() => handleAddNote(entry.id)}
                                    variant="secondary"
                                    size="sm"
                                >
                                    {entry.notes ? 'Edit Note' : 'Add Note'}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Note Dialog */}
            {showNoteDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-text mb-4">Add/Edit Note</h3>
                        <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter your note..."
                        />
                        <div className="flex justify-end space-x-2 mt-4">
                            <Button
                                onClick={() => setShowNoteDialog(false)}
                                variant="secondary"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveNote}
                                variant="primary"
                            >
                                Save Note
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Navigation Flow Info */}
            <Card className="bg-yellow-50 border-yellow-200">
                <h4 className="font-semibold text-text mb-2">Available Actions</h4>
                <div className="text-sm text-text-muted space-y-1">
                    <p><strong>History:</strong> View detailed time history and reports</p>
                    <p><strong>Split Hours:</strong> Divide time entries across multiple jobs</p>
                    <p><strong>Edit Hours:</strong> Modify existing time entries</p>
                    <p><strong>Done:</strong> Return to Time Clock hub</p>
                </div>
            </Card>
        </div>
    );
}
