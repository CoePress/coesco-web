/**
 * Initial Autofill Developer Tools
 * 
 * Development component for testing and debugging the initial autofill trigger system.
 * Only visible in development mode.
 */

import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Settings, RotateCcw, Play, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAutoFill } from '@/contexts/performance/autofill.context';
import { usePerformanceSheet } from '@/contexts/performance.context';
import { testInitialAutofillTrigger } from '@/tests/initial-autofill-trigger.test';

interface InitialAutofillDevToolsProps {
    className?: string;
}

export const InitialAutofillDevTools: React.FC<InitialAutofillDevToolsProps> = ({
    className = ''
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [testResults, setTestResults] = useState<string[]>([]);
    const { state, resetInitialTrigger, checkInitialTrigger, getCompletionProgress } = useAutoFill();
    const { performanceData } = usePerformanceSheet();
    const { id: sheetId } = useParams();

    // Only show in development mode
    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    const runTests = async () => {
        const originalLog = console.log;
        const logs: string[] = [];

        // Capture console.log output
        console.log = (...args) => {
            logs.push(args.join(' '));
            originalLog(...args);
        };

        try {
            testInitialAutofillTrigger();
            setTestResults(logs);
        } catch (error) {
            logs.push(`❌ Test failed: ${error}`);
            setTestResults(logs);
        } finally {
            console.log = originalLog;
        }
    };

    const resetTriggerState = () => {
        if (sheetId) {
            resetInitialTrigger(sheetId);
            setTestResults([`✅ Reset initial trigger state for sheet: ${sheetId}`]);
        }
    };

    const checkCurrentState = async () => {
        if (performanceData && sheetId) {
            try {
                const shouldTrigger = await checkInitialTrigger(performanceData, sheetId);
                const progress = getCompletionProgress(performanceData);

                setTestResults([
                    `Current Initial Trigger Analysis:`,
                    `📊 RFQ Progress: ${progress.rfqProgress.completed}/${progress.rfqProgress.total} (${progress.rfqProgress.percentage}%)`,
                    `📊 Material Progress: ${progress.materialSpecsProgress.completed}/${progress.materialSpecsProgress.total} (${progress.materialSpecsProgress.percentage}%)`,
                    `📊 Overall Progress: ${progress.overallProgress.percentage}%`,
                    `🎯 Should Trigger: ${shouldTrigger}`,
                    `🔄 Is Initial Mode: ${state.isInitialTriggerMode}`,
                    `✅ Has Triggered: ${state.initialTriggerState?.hasTriggeredInitialAutofill}`,
                    `📅 Completed At: ${state.initialTriggerState?.completedAt || 'Not completed'}`,
                    `🚀 Triggered At: ${state.initialTriggerState?.triggeredAt || 'Not triggered'}`
                ]);
            } catch (error) {
                setTestResults([`❌ Error checking state: ${error}`]);
            }
        } else {
            setTestResults(['❌ No performance data or sheet ID available']);
        }
    };

    if (!isExpanded) {
        return (
            <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
                <button
                    onClick={() => setIsExpanded(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-colors"
                    title="Open Initial Autofill Dev Tools"
                >
                    <Settings className="h-5 w-5" />
                </button>
            </div>
        );
    }

    return (
        <div className={`fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-xl w-96 max-h-96 overflow-hidden ${className}`}>
            {/* Header */}
            <div className="bg-purple-600 text-white p-3 flex items-center justify-between">
                <h3 className="font-medium text-sm">Initial Autofill Dev Tools</h3>
                <button
                    onClick={() => setIsExpanded(false)}
                    className="text-purple-200 hover:text-white"
                >
                    ×
                </button>
            </div>

            {/* Content */}
            <div className="p-3 space-y-3">
                {/* Status */}
                <div className="flex items-center gap-2 text-sm">
                    {state.isInitialTriggerMode ? (
                        <>
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            <span className="text-orange-700">Initial Trigger Mode</span>
                        </>
                    ) : (
                        <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-green-700">Normal Mode</span>
                        </>
                    )}
                </div>

                {/* Controls */}
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={runTests}
                        className="flex items-center gap-1 justify-center px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                        <Play className="h-3 w-3" />
                        Run Tests
                    </button>
                    <button
                        onClick={resetTriggerState}
                        className="flex items-center gap-1 justify-center px-3 py-2 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 transition-colors"
                    >
                        <RotateCcw className="h-3 w-3" />
                        Reset State
                    </button>
                </div>

                <button
                    onClick={checkCurrentState}
                    className="w-full flex items-center gap-1 justify-center px-3 py-2 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                >
                    <CheckCircle className="h-3 w-3" />
                    Check Current State
                </button>

                {/* Results */}
                {testResults.length > 0 && (
                    <div className="bg-gray-50 border rounded p-2 max-h-32 overflow-y-auto">
                        <div className="text-xs font-medium text-gray-700 mb-1">Results:</div>
                        {testResults.map((result, index) => (
                            <div key={index} className="text-xs text-gray-600 font-mono leading-tight">
                                {result}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InitialAutofillDevTools;