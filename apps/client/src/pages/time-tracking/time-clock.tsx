import { useState } from 'react';
import Card from '../../components/ui/card';
import Button from '../../components/ui/button';
import { TimeClockPage, Employee, NavigationContext } from './time-clock/types';

// Import individual workflow components
import SelectOpPage from './time-clock/select-op-page';
import SelectJobPartsPage from './time-clock/select-job-parts-page';
import UnitsProdPage from './time-clock/units-prod-page';

export default function TimeClockMainPage() {
    const [currentPage, setCurrentPage] = useState<TimeClockPage>('TimeClock');
    const [navigationContext, setNavigationContext] = useState<NavigationContext>({});

    const [currentEmployee] = useState<Employee>({
        empNum: 101,
        name: 'John Doe',
        isClockedIn: false,
        currentJob: 'J001',
        currentOperation: 'Op 20',
        askUnits: true,
        askSplit: false
    });

    // Navigation Functions
    const NavigateToPage = (page: TimeClockPage, context?: NavigationContext) => {
        setCurrentPage(page);
        setNavigationContext(context || {});
    };

    const NavigateToRootPage = () => {
        setCurrentPage('TimeClock');
        setNavigationContext({});
    };

    // Clock Functions
    const ClockInFun = () => {
        NavigateToPage('SelectOp', {
            fromPage: 'TimeClock',
            flowType: 'clockin'
        });
    };

    const ClockOutFun = () => {
        if (currentEmployee.askUnits || currentEmployee.askSplit) {
            NavigateToPage('UnitsProd', {
                fromPage: 'TimeClock',
                flowType: 'clockout'
            });
        } else {
            ClockOutAsync();
        }
    };

    const ChangeOpFun = () => {
        if (currentEmployee.askUnits || currentEmployee.askSplit) {
            NavigateToPage('UnitsProd', {
                fromPage: 'TimeClock',
                flowType: 'changeoperation'
            });
        } else {
            ClockOutAsync();
            NavigateToPage('SelectOp', {
                fromPage: 'TimeClock',
                flowType: 'changeoperation'
            });
        }
    };

    // Async Operations
    const ClockInAsync = async () => {
        console.log('Clocking in employee:', currentEmployee.empNum);
        NavigateToRootPage();
    };

    const ClockOutAsync = async () => {
        console.log('Clocking out employee:', currentEmployee.empNum);
        NavigateToRootPage();
    };

    // TimeClock Hub Page Content
    const renderTimeClockHub = () => {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-text mb-2">Time Clock</h1>
                    <p className="text-text-muted">Employee time tracking and job management</p>
                </div>

                {/* Employee Status */}
                <Card>
                    <h3 className="text-lg font-semibold text-text mb-4">Employee Status</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-text">Employee:</span>
                            <span className="font-medium text-text">{currentEmployee.name} (#{currentEmployee.empNum})</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-text">Status:</span>
                            <span className={`font-medium ${currentEmployee.isClockedIn ? 'text-green-600' : 'text-gray-600'}`}>
                                {currentEmployee.isClockedIn ? 'Clocked In' : 'Clocked Out'}
                            </span>
                        </div>
                        {currentEmployee.currentJob && (
                            <>
                                <div className="flex justify-between items-center">
                                    <span className="text-text">Current Job:</span>
                                    <span className="font-medium text-text">{currentEmployee.currentJob}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-text">Current Operation:</span>
                                    <span className="font-medium text-text">{currentEmployee.currentOperation || 'None'}</span>
                                </div>
                            </>
                        )}
                    </div>
                </Card>

                {/* Time Clock Action Buttons */}
                <Card>
                    <h3 className="text-lg font-semibold text-text mb-4">Time Clock Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                            onClick={ClockInFun}
                            variant="primary"
                            disabled={currentEmployee.isClockedIn}
                            className="flex items-center justify-center h-16 text-lg"
                        >
                            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Clock In
                        </Button>

                        <Button
                            onClick={ClockOutFun}
                            variant="secondary"
                            disabled={!currentEmployee.isClockedIn}
                            className="flex items-center justify-center h-16 text-lg"
                        >
                            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Clock Out
                        </Button>

                        <Button
                            onClick={ChangeOpFun}
                            variant="secondary"
                            disabled={!currentEmployee.isClockedIn}
                            className="flex items-center justify-center h-16 text-lg"
                        >
                            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            Change Operation
                        </Button>

                        <Button
                            variant="secondary"
                            className="flex items-center justify-center h-16 text-lg"
                        >
                            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Quick Break
                        </Button>
                    </div>
                </Card>

                {/* Flow Information */}
                <Card className="bg-blue-50 border-blue-200">
                    <h4 className="font-semibold text-text mb-2">Navigation Flows</h4>
                    <div className="text-sm text-text-muted space-y-1">
                        <p><strong>Clock In:</strong> Select Operation → Select Job/Parts → Clock In Complete</p>
                        <p><strong>Clock Out:</strong> Units Production (if required) → Clock Out Complete</p>
                        <p><strong>Change Operation:</strong> Units Production (if required) → Select Operation → Select Job/Parts</p>
                        <p><strong>Quick Break:</strong> Start/End break without changing jobs</p>
                    </div>
                </Card>
            </div>
        );
    };

    // Page Renderer
    const renderCurrentPage = () => {
        const commonProps = {
            currentEmployee,
            navigationContext,
            NavigateToPage,
            NavigateToRootPage,
            ClockInAsync,
            ClockOutAsync
        };

        switch (currentPage) {
            case 'TimeClock':
                return renderTimeClockHub();
            case 'SelectOp':
                return <SelectOpPage {...commonProps} />;
            case 'SelectJobParts':
                return <SelectJobPartsPage {...commonProps} />;
            case 'UnitsProd':
                return <UnitsProdPage {...commonProps} />;
            default:
                return renderTimeClockHub();
        }
    };

    return (
        <div className="w-full flex flex-1 flex-col">
            <div className="flex-1 container mx-auto px-6 py-6">
                {renderCurrentPage()}
            </div>
        </div>
    );
}
