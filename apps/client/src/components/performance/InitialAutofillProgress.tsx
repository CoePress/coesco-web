/**
 * Initial Autofill Progress Component
 * 
 * Shows progress toward initial autofill trigger conditions and provides
 * feedback to users about when autofill will be enabled.
 */

import React from 'react';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAutoFill } from '@/contexts/performance/autofill.context';
import { PerformanceData } from '@/contexts/performance.context';

interface InitialAutofillProgressProps {
    performanceData: PerformanceData | null;
    className?: string;
}

export const InitialAutofillProgress: React.FC<InitialAutofillProgressProps> = ({
    performanceData,
    className = ''
}) => {
    const { state, getCompletionProgress } = useAutoFill();

    if (!performanceData || !state.isInitialTriggerMode) {
        return null;
    }

    const progress = getCompletionProgress(performanceData);
    const { rfqProgress, materialSpecsProgress, overallProgress } = progress;

    const isRfqComplete = rfqProgress.percentage === 100;
    const isMaterialSpecsComplete = materialSpecsProgress.percentage === 100;
    const isBothComplete = isRfqComplete && isMaterialSpecsComplete;

    return (
        <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
            <div className="flex items-center gap-2 mb-3">
                {isBothComplete ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                    <Clock className="h-5 w-5 text-blue-600" />
                )}
                <h3 className="font-medium text-blue-900">
                    {isBothComplete ? 'Ready for Initial Autofill' : 'Autofill Progress'}
                </h3>
            </div>

            <div className="space-y-3">
                {/* RFQ Progress */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            {isRfqComplete ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                                <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                            )}
                            <span className="text-sm font-medium text-gray-700">
                                RFQ Calculation Fields
                            </span>
                        </div>
                        <span className="text-sm text-gray-600">
                            {rfqProgress.completed}/{rfqProgress.total}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all duration-300 ${isRfqComplete ? 'bg-green-600' : 'bg-blue-600'
                                }`}
                            style={{ width: `${rfqProgress.percentage}%` }}
                        />
                    </div>
                </div>

                {/* Material Specs Progress */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            {isMaterialSpecsComplete ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                                <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                            )}
                            <span className="text-sm font-medium text-gray-700">
                                Material Specs Calculation Fields
                            </span>
                        </div>
                        <span className="text-sm text-gray-600">
                            {materialSpecsProgress.completed}/{materialSpecsProgress.total}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all duration-300 ${isMaterialSpecsComplete ? 'bg-green-600' : 'bg-blue-600'
                                }`}
                            style={{ width: `${materialSpecsProgress.percentage}%` }}
                        />
                    </div>
                </div>

                {/* Overall Progress */}
                <div className="pt-2 border-t border-blue-200">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-blue-900">
                            Overall Progress
                        </span>
                        <span className="text-sm font-medium text-blue-900">
                            {overallProgress.percentage}%
                        </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-3">
                        <div
                            className={`h-3 rounded-full transition-all duration-300 ${isBothComplete ? 'bg-green-600' : 'bg-blue-600'
                                }`}
                            style={{ width: `${overallProgress.percentage}%` }}
                        />
                    </div>
                </div>

                {/* Status Message */}
                <div className="mt-3 p-3 bg-blue-100 rounded">
                    {isBothComplete ? (
                        <div className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-green-800">
                                    Autofill Ready!
                                </p>
                                <p className="text-xs text-green-700 mt-1">
                                    All required fields are complete. Autofill will trigger automatically
                                    and then switch to normal mode for ongoing calculations.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-blue-800">
                                    Complete required fields to enable autofill
                                </p>
                                <p className="text-xs text-blue-700 mt-1">
                                    Fill in all RFQ and Material Specs fields necessary for calculations
                                    to trigger initial autofill. This will happen automatically once complete.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InitialAutofillProgress;