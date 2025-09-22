import { useState } from 'react';
import Card from '../../../components/ui/card';
import Button from '../../../components/ui/button';
import { BasePageProps } from './types';

export default function UnitsProdPage({
    currentEmployee,
    navigationContext,
    NavigateToPage,
    NavigateToRootPage,
    ClockOutAsync
}: BasePageProps) {
    const [unitsProduced, setUnitsProduced] = useState<string>('');
    const [scrapCount, setScrapCount] = useState<string>('');
    const [notes, setNotes] = useState<string>('');

    const handleSubmit = async () => {
        if (!unitsProduced || parseInt(unitsProduced) < 0) {
            alert('Please enter a valid number of units produced.');
            return;
        }

        try {
            const flowType = navigationContext?.flowType;

            if (flowType === 'clockout') {
                // Clock out after submitting units
                await ClockOutAsync();
                NavigateToRootPage();
            } else if (flowType === 'changeoperation') {
                // Clock out current operation, then go to select new operation
                await ClockOutAsync();
                NavigateToPage('SelectOp', {
                    ...navigationContext,
                    fromPage: 'UnitsProd'
                });
            } else {
                // Default behavior - go back to TimeClock
                NavigateToRootPage();
            }
        } catch (error) {
            console.error('Operation failed:', error);
            alert('Operation failed. Please try again.');
        }
    };

    const handleBack = () => {
        // Go back to TimeClock hub
        NavigateToRootPage();
    };

    const getTitle = () => {
        switch (navigationContext?.flowType) {
            case 'clockout':
                return 'Production Entry - Clock Out';
            case 'changeoperation':
                return 'Production Entry - Change Operation';
            default:
                return 'Production Entry';
        }
    };

    const getSubmitButtonText = () => {
        switch (navigationContext?.flowType) {
            case 'clockout':
                return 'Submit & Clock Out';
            case 'changeoperation':
                return 'Submit & Change Operation';
            default:
                return 'Submit Production';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-text mb-2">{getTitle()}</h2>
                    <p className="text-text-muted">Enter production details for your work session</p>
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
                        <p className="text-sm text-text-muted">Current Job: {currentEmployee.currentJob}</p>
                        <p className="text-sm text-text-muted">Current Operation: {currentEmployee.currentOperation}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-text-muted">Flow Type:</p>
                        <p className="font-semibold text-text capitalize">{navigationContext?.flowType || 'Production Entry'}</p>
                    </div>
                </div>
            </Card>

            {/* Production Entry Form */}
            <Card>
                <h3 className="text-lg font-semibold text-text mb-4">Production Details</h3>
                <div className="space-y-4">
                    {/* Units Produced */}
                    <div>
                        <label htmlFor="unitsProduced" className="block text-sm font-medium text-text mb-2">
                            Units Produced <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            id="unitsProduced"
                            value={unitsProduced}
                            onChange={(e) => setUnitsProduced(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter number of units produced"
                            min="0"
                            step="1"
                        />
                    </div>

                    {/* Scrap Count */}
                    <div>
                        <label htmlFor="scrapCount" className="block text-sm font-medium text-text mb-2">
                            Scrap Count (Optional)
                        </label>
                        <input
                            type="number"
                            id="scrapCount"
                            value={scrapCount}
                            onChange={(e) => setScrapCount(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter number of scrapped units"
                            min="0"
                            step="1"
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-text mb-2">
                            Notes (Optional)
                        </label>
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter any additional notes about your work session..."
                        />
                    </div>
                </div>
            </Card>

            {/* Production Summary */}
            {(unitsProduced || scrapCount) && (
                <Card className="bg-green-50 border-green-200">
                    <h4 className="font-semibold text-text mb-2">Production Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        {unitsProduced && (
                            <div>
                                <p className="text-text-muted">Good Units:</p>
                                <p className="font-semibold text-text text-lg">{unitsProduced}</p>
                            </div>
                        )}
                        {scrapCount && (
                            <div>
                                <p className="text-text-muted">Scrap Units:</p>
                                <p className="font-semibold text-text text-lg">{scrapCount}</p>
                            </div>
                        )}
                        {unitsProduced && scrapCount && (
                            <div className="col-span-2 pt-2 border-t border-green-300">
                                <p className="text-text-muted">Total Processed:</p>
                                <p className="font-semibold text-text text-lg">
                                    {parseInt(unitsProduced) + parseInt(scrapCount || '0')}
                                </p>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* Action Buttons */}
            <Card>
                <div className="flex justify-between items-center">
                    <Button
                        onClick={handleBack}
                        variant="secondary"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="primary"
                        disabled={!unitsProduced}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {getSubmitButtonText()}
                    </Button>
                </div>
            </Card>

            {/* Flow Information */}
            <Card className="bg-yellow-50 border-yellow-200">
                <h4 className="font-semibold text-text mb-2">What happens next?</h4>
                <p className="text-sm text-text-muted">
                    {navigationContext?.flowType === 'clockout' &&
                        'After submitting, you will be clocked out and returned to the Time Clock hub.'}
                    {navigationContext?.flowType === 'changeoperation' &&
                        'After submitting, you will be clocked out of the current operation and can select a new one.'}
                    {!navigationContext?.flowType &&
                        'After submitting, your production data will be recorded and you\'ll return to the Time Clock hub.'}
                </p>
            </Card>
        </div>
    );
}
