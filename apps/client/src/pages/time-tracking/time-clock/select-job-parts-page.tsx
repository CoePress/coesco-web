import { useState } from 'react';
import Card from '../../../components/ui/card';
import Button from '../../../components/ui/button';
import { BasePageProps } from './types';

interface Job {
    jobNum: string;
    description: string;
    customer: string;
    isActive: boolean;
    parts: JobPart[];
}

interface JobPart {
    partNum: string;
    description: string;
    operation: string;
    estimatedHours: number;
}

export default function SelectJobPartsPage({
    currentEmployee,
    navigationContext,
    NavigateToPage,
    NavigateToRootPage,
    ClockInAsync
}: BasePageProps) {
    const [selectedJob, setSelectedJob] = useState<string>('');
    const [selectedPart, setSelectedPart] = useState<string>('');

    // Mock jobs data
    const [jobs] = useState<Job[]>([
        {
            jobNum: 'J001',
            description: 'Widget Assembly Project',
            customer: 'ABC Manufacturing',
            isActive: true,
            parts: [
                { partNum: 'P001-A', description: 'Base Widget', operation: navigationContext?.selectedOperation || 'Op 20', estimatedHours: 4.5 },
                { partNum: 'P001-B', description: 'Widget Cover', operation: navigationContext?.selectedOperation || 'Op 20', estimatedHours: 2.0 },
                { partNum: 'P001-C', description: 'Widget Hardware', operation: navigationContext?.selectedOperation || 'Op 20', estimatedHours: 1.5 }
            ]
        },
        {
            jobNum: 'J002',
            description: 'Bracket Manufacturing',
            customer: 'XYZ Industries',
            isActive: true,
            parts: [
                { partNum: 'P002-A', description: 'Left Bracket', operation: navigationContext?.selectedOperation || 'Op 20', estimatedHours: 3.0 },
                { partNum: 'P002-B', description: 'Right Bracket', operation: navigationContext?.selectedOperation || 'Op 20', estimatedHours: 3.0 },
                { partNum: 'P002-C', description: 'Center Support', operation: navigationContext?.selectedOperation || 'Op 20', estimatedHours: 5.0 }
            ]
        },
        {
            jobNum: 'J003',
            description: 'Quality Inspection Services',
            customer: 'Quality Corp',
            isActive: true,
            parts: [
                { partNum: 'P003-A', description: 'Incoming Inspection', operation: navigationContext?.selectedOperation || 'Op 40', estimatedHours: 2.0 },
                { partNum: 'P003-B', description: 'Final Inspection', operation: navigationContext?.selectedOperation || 'Op 40', estimatedHours: 3.0 }
            ]
        }
    ]);

    const getJobParts = (): JobPart[] => {
        const job = jobs.find(j => j.jobNum === selectedJob);
        return job?.parts || [];
    };

    const handleJobSelect = (jobNum: string) => {
        setSelectedJob(jobNum);
        setSelectedPart(''); // Reset part selection when job changes
    };

    const handlePartSelect = (partNum: string) => {
        setSelectedPart(partNum);
    };

    const handleClockIn = async () => {
        if (!selectedJob || !selectedPart) {
            alert('Please select both a job and part number.');
            return;
        }

        try {
            // Call the ClockInAsync function
            await ClockInAsync();

            // Navigate back to TimeClock hub
            NavigateToRootPage();
        } catch (error) {
            console.error('Clock in failed:', error);
            alert('Clock in failed. Please try again.');
        }
    };

    const handleBack = () => {
        // Go back to Operation Selection
        NavigateToPage('SelectOp', {
            ...navigationContext,
            fromPage: 'SelectJobParts'
        });
    };

    const selectedJobData = jobs.find(j => j.jobNum === selectedJob);
    const selectedPartData = getJobParts().find(p => p.partNum === selectedPart);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-text mb-2">Select Job & Cost Code</h2>
                    <p className="text-text-muted">Choose the job and part number for your work</p>
                </div>
                <Button onClick={handleBack} variant="secondary">
                    Back to Operations
                </Button>
            </div>

            {/* Context Information */}
            <Card className="bg-blue-50 border-blue-200">
                <div className="flex justify-between items-center">
                    <div>
                        <h4 className="font-semibold text-text">Employee: {currentEmployee.name}</h4>
                        <p className="text-sm text-text-muted">Operation: {navigationContext?.selectedOperation}</p>
                        <p className="text-sm text-text-muted">Flow: {navigationContext?.flowType}</p>
                    </div>
                    {selectedJob && selectedPart && (
                        <div className="text-right">
                            <p className="text-sm text-text-muted">Selected:</p>
                            <p className="font-semibold text-text">{selectedJob} - {selectedPart}</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Job Selection */}
            <Card>
                <h3 className="text-lg font-semibold text-text mb-4">Select Job</h3>
                <div className="grid gap-3">
                    {jobs.filter(job => job.isActive).map((job) => (
                        <div
                            key={job.jobNum}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedJob === job.jobNum
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                            onClick={() => handleJobSelect(job.jobNum)}
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="font-semibold text-text">{job.jobNum}</h4>
                                    <p className="text-text-muted">{job.description}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-text-muted">Customer</p>
                                    <p className="text-sm font-medium text-text">{job.customer}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Part Selection - Only show if job is selected */}
            {selectedJob && (
                <Card>
                    <h3 className="text-lg font-semibold text-text mb-4">Select Part/Cost Code</h3>
                    <div className="grid gap-3">
                        {getJobParts().map((part) => (
                            <div
                                key={part.partNum}
                                className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedPart === part.partNum
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                                onClick={() => handlePartSelect(part.partNum)}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="font-semibold text-text">{part.partNum}</h4>
                                        <p className="text-text-muted">{part.description}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-text-muted">Est. Hours</p>
                                        <p className="text-sm font-medium text-text">{part.estimatedHours}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
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
                        Back
                    </Button>
                    <Button
                        onClick={handleClockIn}
                        variant="primary"
                        disabled={!selectedJob || !selectedPart}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        Clock In Now
                    </Button>
                </div>
            </Card>

            {/* Summary */}
            {selectedJob && selectedPart && (
                <Card className="bg-green-50 border-green-200">
                    <h4 className="font-semibold text-text mb-2">Ready to Clock In</h4>
                    <div className="text-sm text-text-muted space-y-1">
                        <p><strong>Job:</strong> {selectedJobData?.jobNum} - {selectedJobData?.description}</p>
                        <p><strong>Part:</strong> {selectedPartData?.partNum} - {selectedPartData?.description}</p>
                        <p><strong>Operation:</strong> {navigationContext?.selectedOperation}</p>
                        <p><strong>Estimated Hours:</strong> {selectedPartData?.estimatedHours}</p>
                    </div>
                </Card>
            )}
        </div>
    );
}
