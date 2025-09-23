import { useState } from 'react';
import Card from '../../../components/ui/card';
import Button from '../../../components/ui/button';
import { BasePageProps } from './types';

interface Operation {
    opNum: string;
    description: string;
    department: string;
    isActive: boolean;
}

export default function SelectOpPage({
    currentEmployee,
    navigationContext,
    NavigateToPage,
    NavigateToRootPage
}: BasePageProps) {
    const [selectedOperation, setSelectedOperation] = useState<string>('');

    // Mock operations data
    const [operations] = useState<Operation[]>([
        { opNum: 'Op 10', description: 'Material Prep', department: 'Manufacturing', isActive: true },
        { opNum: 'Op 20', description: 'Machining', department: 'Manufacturing', isActive: true },
        { opNum: 'Op 30', description: 'Assembly', department: 'Assembly', isActive: true },
        { opNum: 'Op 40', description: 'Quality Check', department: 'Quality', isActive: true },
        { opNum: 'Op 50', description: 'Finishing', department: 'Finishing', isActive: true },
        { opNum: 'Op 60', description: 'Packaging', department: 'Shipping', isActive: true }
    ]);

    const handleOperationSelect = (operation: Operation) => {
        setSelectedOperation(operation.opNum);
    };

    const handleContinue = () => {
        if (!selectedOperation) {
            alert('Please select an operation first.');
            return;
        }

        // Navigate to SelectJobPartsPage (Cost Code Selection)
        NavigateToPage('SelectJobParts', {
            ...navigationContext,
            selectedOperation,
            fromPage: 'SelectOp'
        });
    };

    const handleBack = () => {
        if (navigationContext?.flowType === 'changeoperation') {
            // For change operation flow, go back to TimeClock
            NavigateToRootPage();
        } else {
            // For other flows, go back to TimeClock
            NavigateToRootPage();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-text mb-2">Select Operation</h2>
                    <p className="text-text-muted">Choose the operation you want to work on</p>
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
                        <p className="text-sm text-text-muted">Flow: {navigationContext?.flowType || 'Unknown'}</p>
                    </div>
                    {selectedOperation && (
                        <div className="text-right">
                            <p className="text-sm text-text-muted">Selected Operation:</p>
                            <p className="font-semibold text-text">{selectedOperation}</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Operations List */}
            <Card>
                <h3 className="text-lg font-semibold text-text mb-4">Available Operations</h3>
                <div className="grid gap-3">
                    {operations.filter(op => op.isActive).map((operation) => (
                        <div
                            key={operation.opNum}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedOperation === operation.opNum
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                            onClick={() => handleOperationSelect(operation)}
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="font-semibold text-text">{operation.opNum}</h4>
                                    <p className="text-text-muted">{operation.description}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-text-muted">Department</p>
                                    <p className="text-sm font-medium text-text">{operation.department}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

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
                        onClick={handleContinue}
                        variant="primary"
                        disabled={!selectedOperation}
                    >
                        Continue to Job Selection
                    </Button>
                </div>
            </Card>

            {/* Flow Information */}
            <Card className="bg-yellow-50 border-yellow-200">
                <h4 className="font-semibold text-text mb-2">Next Step</h4>
                <p className="text-sm text-text-muted">
                    After selecting an operation, you'll choose the specific job and cost code to work on.
                </p>
            </Card>
        </div>
    );
}
