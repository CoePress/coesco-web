import { useState } from 'react';
import Card from '../../../components/ui/card';
import Button from '../../../components/ui/button';
import { BasePageProps } from './types';

interface TimeEntry {
    id: string;
    date: string;
    jobNum: string;
    operation: string;
    totalHours: number;
}

interface SplitEntry {
    jobNum: string;
    operation: string;
    hours: string;
}

export default function SplitHoursPage({
    currentEmployee,
    navigationContext,
    NavigateToPage
}: BasePageProps) {
    const [selectedEntry, setSelectedEntry] = useState<string>('');
    const [splitEntries, setSplitEntries] = useState<SplitEntry[]>([
        { jobNum: '', operation: '', hours: '' }
    ]);

    // Mock time entries that can be split
    const [timeEntries] = useState<TimeEntry[]>([
        {
            id: 'te001',
            date: '2025-09-22',
            jobNum: 'J001',
            operation: 'Op 20',
            totalHours: 8.0
        },
        {
            id: 'te002',
            date: '2025-09-22',
            jobNum: 'J002',
            operation: 'Op 30',
            totalHours: 4.0
        }
    ]);

    const getSelectedTimeEntry = (): TimeEntry | undefined => {
        return timeEntries.find(entry => entry.id === selectedEntry);
    };

    const addSplitEntry = () => {
        setSplitEntries([...splitEntries, { jobNum: '', operation: '', hours: '' }]);
    };

    const removeSplitEntry = (index: number) => {
        if (splitEntries.length > 1) {
            setSplitEntries(splitEntries.filter((_, i) => i !== index));
        }
    };

    const updateSplitEntry = (index: number, field: keyof SplitEntry, value: string) => {
        const updated = [...splitEntries];
        updated[index][field] = value;
        setSplitEntries(updated);
    };

    const getTotalSplitHours = (): number => {
        return splitEntries.reduce((total, entry) => {
            return total + (parseFloat(entry.hours) || 0);
        }, 0);
    };

    const handleSave = () => {
        const selectedTimeEntry = getSelectedTimeEntry();
        if (!selectedTimeEntry) {
            alert('Please select a time entry to split.');
            return;
        }

        const totalSplit = getTotalSplitHours();
        if (Math.abs(totalSplit - selectedTimeEntry.totalHours) > 0.01) {
            alert(`Split hours (${totalSplit}) must equal original hours (${selectedTimeEntry.totalHours}).`);
            return;
        }

        const invalidEntries = splitEntries.some(entry =>
            !entry.jobNum || !entry.operation || !entry.hours || parseFloat(entry.hours) <= 0
        );

        if (invalidEntries) {
            alert('Please fill in all split entry fields with valid values.');
            return;
        }

        console.log('Saving split hours:', splitEntries);
        // API call to save split hours
        alert('Hours split successfully!');

        // Go back to Hours page
        NavigateToPage('Hours', {
            ...navigationContext,
            fromPage: 'SplitHours'
        });
    };

    const handleBack = () => {
        NavigateToPage('Hours', {
            ...navigationContext,
            fromPage: 'SplitHours'
        });
    };

    const selectedTimeEntry = getSelectedTimeEntry();
    const totalSplit = getTotalSplitHours();
    const hoursMatch = selectedTimeEntry ? Math.abs(totalSplit - selectedTimeEntry.totalHours) < 0.01 : false;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-text mb-2">Split Hours</h2>
                    <p className="text-text-muted">Divide time entries across multiple jobs or operations</p>
                </div>
                <Button onClick={handleBack} variant="secondary">
                    Back to Hours
                </Button>
            </div>

            {/* Employee Context */}
            <Card className="bg-blue-50 border-blue-200">
                <div className="flex justify-between items-center">
                    <div>
                        <h4 className="font-semibold text-text">Employee: {currentEmployee.name}</h4>
                        <p className="text-sm text-text-muted">Employee #: {currentEmployee.empNum}</p>
                    </div>
                    {selectedTimeEntry && (
                        <div className="text-right">
                            <p className="text-sm text-text-muted">Splitting Entry:</p>
                            <p className="font-semibold text-text">{selectedTimeEntry.jobNum} - {selectedTimeEntry.operation} ({selectedTimeEntry.totalHours}h)</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Select Time Entry */}
            <Card>
                <h3 className="text-lg font-semibold text-text mb-4">Select Time Entry to Split</h3>
                <div className="space-y-3">
                    {timeEntries.map((entry) => (
                        <div
                            key={entry.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedEntry === entry.id
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                            onClick={() => setSelectedEntry(entry.id)}
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="font-semibold text-text">{entry.date}</h4>
                                    <p className="text-text-muted">{entry.jobNum} - {entry.operation}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-text-muted">Total Hours</p>
                                    <p className="text-lg font-semibold text-text">{entry.totalHours}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Split Entries - Only show if entry selected */}
            {selectedEntry && (
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-text">Split into Multiple Entries</h3>
                        <Button onClick={addSplitEntry} variant="secondary" size="sm">
                            Add Split Entry
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {splitEntries.map((entry, index) => (
                            <div key={index} className="p-4 border border-gray-200 rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium text-text">Split Entry {index + 1}</h4>
                                    {splitEntries.length > 1 && (
                                        <Button
                                            onClick={() => removeSplitEntry(index)}
                                            variant="secondary"
                                            size="sm"
                                            className="text-red-600 hover:bg-red-50"
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text mb-2">Job Number</label>
                                        <input
                                            type="text"
                                            value={entry.jobNum}
                                            onChange={(e) => updateSplitEntry(index, 'jobNum', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g. J001"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-text mb-2">Operation</label>
                                        <input
                                            type="text"
                                            value={entry.operation}
                                            onChange={(e) => updateSplitEntry(index, 'operation', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g. Op 20"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-text mb-2">Hours</label>
                                        <input
                                            type="number"
                                            step="0.25"
                                            min="0"
                                            value={entry.hours}
                                            onChange={(e) => updateSplitEntry(index, 'hours', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Hours Summary */}
                    <div className={`mt-4 p-4 rounded-lg ${hoursMatch ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-text-muted">Original Hours: {selectedTimeEntry?.totalHours}</p>
                                <p className="text-sm text-text-muted">Split Total: {totalSplit.toFixed(2)}</p>
                            </div>
                            <div className="text-right">
                                <p className={`font-semibold ${hoursMatch ? 'text-green-600' : 'text-red-600'}`}>
                                    {hoursMatch ? '✓ Hours Match' : '✗ Hours Don\'t Match'}
                                </p>
                                {!hoursMatch && (
                                    <p className="text-sm text-red-600">
                                        Difference: {(totalSplit - (selectedTimeEntry?.totalHours || 0)).toFixed(2)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Action Buttons */}
            {selectedEntry && (
                <Card>
                    <div className="flex justify-between items-center">
                        <Button
                            onClick={handleBack}
                            variant="secondary"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            variant="primary"
                            disabled={!hoursMatch}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            Save Split Hours
                        </Button>
                    </div>
                </Card>
            )}

            {/* Instructions */}
            <Card className="bg-yellow-50 border-yellow-200">
                <h4 className="font-semibold text-text mb-2">How to Split Hours</h4>
                <div className="text-sm text-text-muted space-y-1">
                    <p>1. Select the time entry you want to split</p>
                    <p>2. Add split entries for different jobs/operations</p>
                    <p>3. Ensure the total split hours equal the original hours</p>
                    <p>4. Save to apply the split</p>
                </div>
            </Card>
        </div>
    );
}
