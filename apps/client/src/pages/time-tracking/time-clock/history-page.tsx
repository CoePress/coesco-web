import { useState } from 'react';
import Card from '../../../components/ui/card';
import Button from '../../../components/ui/button';
import { BasePageProps } from './types';

export default function HistoryPage({
    navigationContext,
    NavigateToPage
}: BasePageProps) {
    const [dateRange, setDateRange] = useState('week');

    const handleViewDetails = () => {
        NavigateToPage('HistoryDisplay', {
            ...navigationContext,
            fromPage: 'History',
            dateRange
        });
    };

    const handleBack = () => {
        NavigateToPage('Hours', {
            ...navigationContext,
            fromPage: 'History'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-text mb-2">Time History</h2>
                    <p className="text-text-muted">View your time tracking history</p>
                </div>
                <Button onClick={handleBack} variant="secondary">
                    Back to Hours
                </Button>
            </div>

            <Card>
                <h3 className="text-lg font-semibold text-text mb-4">History Options</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text mb-2">Date Range</label>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>
                    <Button onClick={handleViewDetails} variant="primary">
                        View History Details
                    </Button>
                </div>
            </Card>
        </div>
    );
}
