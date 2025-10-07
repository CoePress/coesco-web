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
import { getRequiredFieldBackgroundColor } from '@/utils/performance-helpers';

interface ManualAutofillButtonProps {
    onSave?: () => Promise<void>;
    className?: string;
}

// Function to check if a field is complete based on validation colors
const isFieldCompleteByValidation = (
    fieldPath: string,
    getFieldValue: (path: string) => any
): boolean => {
    // Get the validation color for this field
    const bgColor = getRequiredFieldBackgroundColor(fieldPath, [fieldPath], getFieldValue);

    // Green/success means complete, red/error means incomplete
    return bgColor === 'success';
};

// Get field value from nested path
const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
};

export const ManualAutofillButton: React.FC<ManualAutofillButtonProps> = ({
    onSave,
    className = ''
}) => {
    const [isTriggering, setIsTriggering] = useState(false);
    const { performanceData } = usePerformanceSheet();
    const { triggerAutoFill, state: autoFillState } = useAutoFill();
    const { id: sheetId } = useParams();

    if (!performanceData) return null;

    // Required fields for calculation - using actual field paths from RFQ and Material Specs pages
    const RFQ_FIELDS = [
        'referenceNumber',
        'rfq.dates.date',
        'common.customer',
        'common.customerInfo.state',
        'common.customerInfo.streetAddress',
        'common.customerInfo.zip',
        'common.customerInfo.city',
        'common.customerInfo.country',
        'common.customerInfo.contactName',
        'common.customerInfo.phoneNumber',
        'common.customerInfo.email',
        'rfq.dates.idealDeliveryDate',
        'rfq.dates.decisionDate',
        'feed.feed.application',
        'common.equipment.feed.lineType',
        'common.coil.maxCoilWidth',
        'common.coil.minCoilWidth',
        'common.coil.maxCoilOD',
        'common.coil.coilID',
        'common.coil.maxCoilWeight',
        'common.material.materialThickness',
        'common.material.coilWidth',
        'common.material.materialType',
        'common.material.maxYieldStrength',
        'rfq.press.maxSPM'
    ];

    const MATERIAL_SPECS_FIELDS = [
        'common.material.materialThickness',
        'common.material.coilWidth',
        'common.material.materialType',
        'common.material.maxYieldStrength',
        'common.equipment.feed.direction',
        'common.equipment.feed.controlsLevel',
        'common.equipment.feed.typeOfLine',
        'common.equipment.feed.controls',
        'common.equipment.feed.passline',
        'materialSpecs.reel.backplate.type',
        'materialSpecs.reel.style'
    ];

    // Create getFieldValue function for validation
    const getFieldValue = (fieldPath: string) => getNestedValue(performanceData, fieldPath);

    // Calculate completion based on validation colors
    const rfqCompleted = RFQ_FIELDS.filter(field =>
        isFieldCompleteByValidation(field, getFieldValue)
    ).length;

    const materialSpecsCompleted = MATERIAL_SPECS_FIELDS.filter(field =>
        isFieldCompleteByValidation(field, getFieldValue)
    ).length;

    const overallCompleted = rfqCompleted + materialSpecsCompleted;
    const overallTotal = RFQ_FIELDS.length + MATERIAL_SPECS_FIELDS.length;
    const overallPercentage = Math.round((overallCompleted / overallTotal) * 100);
    const rfqPercentage = Math.round((rfqCompleted / RFQ_FIELDS.length) * 100);
    const materialSpecsPercentage = Math.round((materialSpecsCompleted / MATERIAL_SPECS_FIELDS.length) * 100);

    const canTriggerAutofill = overallPercentage >= 80;
    const isComplete = overallPercentage === 100;

    const handleManualTrigger = async () => {
        if (!performanceData || !sheetId || isTriggering || autoFillState.isAutoFilling) return;

        setIsTriggering(true);
        try {
            await triggerAutoFill(performanceData, sheetId, true);
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
        <div className={`${className}`}>
            {/* Compact Button with Progress */}
            <div className="flex items-center gap-3">
                {/* Progress Summary - Compact */}
                <div className={`px-3 py-2 rounded-lg border ${bgColor} ${borderColor} flex items-center gap-2`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                    <div className="text-sm">
                        <span className={`font-medium ${color}`}>
                            {overallPercentage}% Ready
                        </span>
                        <div className="text-xs text-gray-500">
                            {overallCompleted}/{overallTotal} fields
                        </div>
                    </div>
                </div>

                {/* Manual Trigger Button */}
                <button
                    onClick={handleManualTrigger}
                    disabled={!canTriggerAutofill || isTriggering || autoFillState.isAutoFilling}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${canTriggerAutofill && !isTriggering && !autoFillState.isAutoFilling
                            ? `${buttonColor} text-white`
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    <Calculator className="h-4 w-4" />
                    {isTriggering || autoFillState.isAutoFilling ? (
                        'Calculating...'
                    ) : canTriggerAutofill ? (
                        'Auto-Calculate'
                    ) : (
                        `Need ${80 - overallPercentage}% more`
                    )}
                </button>
            </div>

            {/* Detailed Progress (Expandable) - Show when not complete */}
            {!isComplete && (
                <div className="mt-2 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600">RFQ Fields:</span>
                        <span className={rfqPercentage === 100 ? 'text-green-600 font-medium' : 'text-gray-600'}>
                            {rfqCompleted}/{RFQ_FIELDS.length}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                        <div
                            className={`h-1 rounded-full transition-all duration-300 ${rfqPercentage === 100 ? 'bg-green-600' : 'bg-blue-600'
                                }`}
                            style={{ width: `${rfqPercentage}%` }}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-gray-600">Material Specs:</span>
                        <span className={materialSpecsPercentage === 100 ? 'text-green-600 font-medium' : 'text-gray-600'}>
                            {materialSpecsCompleted}/{MATERIAL_SPECS_FIELDS.length}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                        <div
                            className={`h-1 rounded-full transition-all duration-300 ${materialSpecsPercentage === 100 ? 'bg-green-600' : 'bg-blue-600'
                                }`}
                            style={{ width: `${materialSpecsPercentage}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Save Integration Info */}
            {onSave && (
                <div className="text-xs text-gray-500 text-center mt-2">
                    💡 Auto-fill also triggers once when saving RFQ
                </div>
            )}
        </div>
    );
};

export default ManualAutofillButton;