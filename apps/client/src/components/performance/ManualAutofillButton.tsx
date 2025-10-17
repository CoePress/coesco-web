/**
 * Manual Autofill Button Component
 * 
 * Shows completion percentage and allows manual autofill trigger.
 * Uses field validation colors to determine completion status.
 */

import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Calculator, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { useAutoFill } from '@/contexts/performance/autofill.context';
import { usePerformanceSheet } from '@/contexts/performance.context';
import { InitialAutofillTriggerService } from '@/services/initial-autofill-trigger.service';

interface ManualAutofillButtonProps {
    className?: string;
}

export const ManualAutofillButton: React.FC<ManualAutofillButtonProps> = ({
    className = ''
}) => {
    const [isTriggering, setIsTriggering] = useState(false);
    const { performanceData } = usePerformanceSheet();
    const { triggerManualAutoFill, state: autoFillState } = useAutoFill();
    const { id: sheetId } = useParams();

    if (!performanceData) return null;

    // Use the same completion calculation as the trigger service
    const completionProgress = InitialAutofillTriggerService.getCompletionProgress(performanceData);

    const overallCompleted = completionProgress.overallProgress.completed;
    const overallTotal = completionProgress.overallProgress.total;
    const overallPercentage = completionProgress.overallProgress.percentage;

    const canTriggerAutofill = overallPercentage >= 100;  // Changed to 100% requirement
    const isComplete = overallPercentage === 100;

    const handleManualTrigger = async () => {
        if (!performanceData || !sheetId || isTriggering || autoFillState.isAutoFilling) return;

        setIsTriggering(true);
        try {
            // Use the new manual autofill trigger that requires 100% completion
            await triggerManualAutoFill(performanceData, sheetId);
        } catch (error) {
            console.error('Manual autofill trigger failed:', error);
        } finally {
            setIsTriggering(false);
        }
    };

    // Get appropriate icon and styling based on progress
    const getProgressIndicator = () => {
        if (isComplete) {
            return {
                icon: CheckCircle,
                color: 'text-green-600',
                bgColor: 'bg-green-50',
                borderColor: 'border-green-200',
                buttonColor: 'bg-green-600 hover:bg-green-700'
            };
        } else if (canTriggerAutofill) {
            return {
                icon: Zap,
                color: 'text-blue-600',
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-200',
                buttonColor: 'bg-blue-600 hover:bg-blue-700'
            };
        } else {
            return {
                icon: AlertCircle,
                color: 'text-orange-600',
                bgColor: 'bg-orange-50',
                borderColor: 'border-orange-200',
                buttonColor: 'bg-gray-300'
            };
        }
    };

    const { icon: Icon, color, bgColor, borderColor, buttonColor } = getProgressIndicator();

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {/* Ultra Compact Progress Indicator */}
            <div className={`px-2 py-1 rounded border ${bgColor} ${borderColor} flex items-center gap-1`}>
                <Icon className={`h-3 w-3 ${color}`} />
                <span className={`text-xs font-medium ${color}`}>
                    {overallPercentage}%
                </span>
            </div>

            {/* Compact Manual Trigger Button */}
            <button
                onClick={handleManualTrigger}
                disabled={!canTriggerAutofill || isTriggering || autoFillState.isAutoFilling}
                className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-colors ${canTriggerAutofill && !isTriggering && !autoFillState.isAutoFilling
                    ? `${buttonColor} text-white`
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                title={`${overallCompleted}/${overallTotal} fields complete. Manual autofill requires 100% completion.`}
            >
                <Calculator className="h-3 w-3" />
                {isTriggering || autoFillState.isAutoFilling ? (
                    'Calculating...'
                ) : canTriggerAutofill ? (
                    'Auto-Fill'
                ) : (
                    `Complete ${100 - overallPercentage}%`
                )}
            </button>
        </div>
    );
};

export default ManualAutofillButton;