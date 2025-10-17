/**
 * Initial Autofill Trigger Service
 * 
 * Manages the one-time autofill trigger when RFQ and Material Specs fields
 * necessary for calculations are completed for the first time. After this initial 
 * trigger, autofill behaves normally.
 * 
 * Focus: Only requires fields essential for performance calculations, not
 * administrative data like customer info, dates, etc.
 */

import { PerformanceData } from "@/contexts/performance.context";

export interface FieldCompletionState {
    rfqComplete: boolean;
    materialSpecsComplete: boolean;
    hasTriggeredInitialAutofill: boolean;
    completedAt?: Date;
    triggeredAt?: Date;
}

export class InitialAutofillTriggerService {
    private static readonly STORAGE_KEY_PREFIX = 'initial-autofill-state-';

    /**
     * Minimal fields needed for basic RFQ calculations (FPM from SPM and length)
     */
    private static readonly RFQ_MINIMAL_CALCULATION_FIELDS = [
        'common.feedRates.average.length',
        'common.feedRates.average.spm',
        'common.feedRates.max.length',
        'common.feedRates.max.spm'
    ];

    /**
     * Required fields for RFQ completion - Based on actual Python autofill requirements
     */
    private static readonly RFQ_REQUIRED_FIELDS = [
        // Core feed configuration
        'feed.feed.application',
        'common.equipment.feed.lineType',
        'common.equipment.feed.direction',
        'feed.feed.pullThru.isPullThru',

        // Coil specifications (critical for calculations)
        'common.coil.maxCoilWidth',
        'common.coil.coilID',
        'common.coil.maxCoilOD',
        'common.coil.maxCoilWeight',

        // Feed rates (essential for performance calculations)
        // Require length and SPM for all ranges - FPM will be calculated by Python script
        'common.feedRates.average.length',
        'common.feedRates.average.spm',
        'common.feedRates.min.length',
        'common.feedRates.min.spm',
        'common.feedRates.max.length',
        'common.feedRates.max.spm',

        // Press specifications
        'rfq.press.maxSPM',

        // Die configuration (affects calculations)
        'rfq.dies.transferDies',
        'rfq.dies.progressiveDies',
        'rfq.dies.blankingDies',

        // Basic requirements
        'rfq.voltageRequired'
    ];

    /**
     * Required fields for Material Specs completion - Based on actual Python autofill requirements
     */
    private static readonly MATERIAL_SPECS_REQUIRED_FIELDS = [
        'common.material.materialThickness',
        'common.material.coilWidth',
        'common.material.materialType',
        'common.material.maxYieldStrength'
    ];

    /**
     * Get the storage key for a specific performance sheet
     */
    private static getStorageKey(performanceSheetId: string): string {
        return `${this.STORAGE_KEY_PREFIX}${performanceSheetId}`;
    }

    /**
     * Get the current completion state for a performance sheet
     */
    public static getCompletionState(performanceSheetId: string): FieldCompletionState {
        try {
            const stored = localStorage.getItem(this.getStorageKey(performanceSheetId));
            if (stored) {
                const parsed = JSON.parse(stored);
                return {
                    ...parsed,
                    completedAt: parsed.completedAt ? new Date(parsed.completedAt) : undefined,
                    triggeredAt: parsed.triggeredAt ? new Date(parsed.triggeredAt) : undefined
                };
            }
        } catch (error) {
            console.warn('Error reading initial autofill state:', error);
        }

        return {
            rfqComplete: false,
            materialSpecsComplete: false,
            hasTriggeredInitialAutofill: false
        };
    }

    /**
     * Save the completion state for a performance sheet
     */
    private static saveCompletionState(performanceSheetId: string, state: FieldCompletionState): void {
        try {
            localStorage.setItem(this.getStorageKey(performanceSheetId), JSON.stringify(state));
        } catch (error) {
            console.warn('Error saving initial autofill state:', error);
        }
    }

    /**
     * Check if a specific field has a meaningful value for calculations
     */
    private static hasValue(data: PerformanceData, fieldPath: string): boolean {
        const value = this.getNestedValue(data, fieldPath);

        if (value === undefined || value === null) {
            return false;
        }

        // For boolean fields, accept any boolean value (true or false)
        if (typeof value === 'boolean') {
            return true;
        }

        // For numbers, special handling for feed rate fields (length/SPM must be > 0)
        if (typeof value === 'number') {
            const isValid = !isNaN(value) && isFinite(value);

            // Feed rate fields (length/SPM) must be greater than 0 for meaningful FPM calculations
            if (fieldPath.includes('feedRates') && (fieldPath.includes('length') || fieldPath.includes('spm'))) {
                return isValid && value > 0;
            }

            // Other numeric fields can be 0 or positive
            return isValid;
        }

        // For strings, check if it's not empty and not a default/placeholder value
        if (typeof value === 'string') {
            const trimmed = value.trim().toLowerCase();

            // Special handling for feed rate string values - must be > 0 when parsed
            if (fieldPath.includes('feedRates') && (fieldPath.includes('length') || fieldPath.includes('spm'))) {
                const numValue = parseFloat(trimmed);
                return !isNaN(numValue) && isFinite(numValue) && numValue > 0;
            }

            // Regular string validation
            return trimmed !== '' &&
                !trimmed.includes('select') &&
                !trimmed.includes('choose') &&
                !trimmed.includes('--') &&
                trimmed !== 'none' &&
                trimmed !== 'default';
        }

        return true;
    }

    /**
     * Get nested value from object using dot notation
     */
    private static getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Check if RFQ required fields are complete
     */
    public static areRfqFieldsComplete(data: PerformanceData): boolean {
        const incompleteFields: string[] = [];
        const result = this.RFQ_REQUIRED_FIELDS.every(field => {
            const hasVal = this.hasValue(data, field);
            if (!hasVal) {
                incompleteFields.push(field);
            }
            return hasVal;
        });

        if (process.env.NODE_ENV === 'development' && incompleteFields.length > 0) {
            console.log('RFQ Incomplete Fields:', incompleteFields);
        }

        return result;
    }

    /**
     * Check if Material Specs required fields are complete
     */
    public static areMaterialSpecsFieldsComplete(data: PerformanceData): boolean {
        const incompleteFields: string[] = [];
        const result = this.MATERIAL_SPECS_REQUIRED_FIELDS.every(field => {
            const hasVal = this.hasValue(data, field);
            if (!hasVal) {
                incompleteFields.push(field);
            }
            return hasVal;
        });

        if (process.env.NODE_ENV === 'development' && incompleteFields.length > 0) {
            console.log('Material Specs Incomplete Fields:', incompleteFields);
        }

        return result;
    }

    /**
     * Check if minimal RFQ fields for basic calculations are complete (SPM/Length for FPM calc)
     */
    public static areRfqMinimalFieldsComplete(data: PerformanceData): boolean {
        const incompleteFields: string[] = [];
        const result = this.RFQ_MINIMAL_CALCULATION_FIELDS.every(field => {
            const hasVal = this.hasValue(data, field);
            if (!hasVal) {
                incompleteFields.push(field);
            }
            return hasVal;
        });

        if (process.env.NODE_ENV === 'development' && incompleteFields.length > 0) {
            console.log('RFQ Minimal Calculation Fields Incomplete:', incompleteFields);
        }

        return result;
    }

    /**
     * Update completion state and determine if initial autofill should trigger
     * Now supports both full trigger and partial RFQ calculations
     */
    public static checkAndUpdateCompletionState(
        data: PerformanceData,
        performanceSheetId: string
    ): {
        shouldTriggerInitialAutofill: boolean;
        shouldTriggerPartialRfq: boolean;
        completionState: FieldCompletionState;
        isFirstTimeComplete: boolean;
        isFirstTimePartialRfq: boolean;
    } {
        const currentState = this.getCompletionState(performanceSheetId);

        // If already triggered, don't trigger again
        if (currentState.hasTriggeredInitialAutofill) {
            return {
                shouldTriggerInitialAutofill: false,
                shouldTriggerPartialRfq: false,
                completionState: currentState,
                isFirstTimeComplete: false,
                isFirstTimePartialRfq: false
            };
        }

        const rfqComplete = this.areRfqFieldsComplete(data);
        const materialSpecsComplete = this.areMaterialSpecsFieldsComplete(data);
        const rfqMinimalComplete = this.areRfqMinimalFieldsComplete(data);

        if (process.env.NODE_ENV === 'development') {
            console.log('Initial Autofill Check:', {
                rfqComplete,
                materialSpecsComplete,
                rfqMinimalComplete,
                bothComplete: rfqComplete && materialSpecsComplete,
                hasTriggered: currentState.hasTriggeredInitialAutofill
            });
        }

        // Check if this is the first time both are complete
        const wasRfqComplete = currentState.rfqComplete;
        const wasMaterialSpecsComplete = currentState.materialSpecsComplete;
        const isFirstTimeComplete = (rfqComplete && materialSpecsComplete) &&
            !(wasRfqComplete && wasMaterialSpecsComplete);

        // Check if this is the first time RFQ minimal fields are complete
        const isFirstTimePartialRfq = rfqMinimalComplete && !currentState.rfqComplete;

        const newState: FieldCompletionState = {
            rfqComplete,
            materialSpecsComplete,
            hasTriggeredInitialAutofill: currentState.hasTriggeredInitialAutofill,
            completedAt: (rfqComplete && materialSpecsComplete && !currentState.completedAt)
                ? new Date()
                : currentState.completedAt,
            triggeredAt: currentState.triggeredAt
        };

        // Save the updated state
        this.saveCompletionState(performanceSheetId, newState);

        return {
            shouldTriggerInitialAutofill: isFirstTimeComplete,
            shouldTriggerPartialRfq: isFirstTimePartialRfq,
            completionState: newState,
            isFirstTimeComplete,
            isFirstTimePartialRfq
        };
    }

    /**
     * Mark that initial autofill has been triggered
     */
    public static markInitialAutofillTriggered(performanceSheetId: string): void {
        const currentState = this.getCompletionState(performanceSheetId);
        const newState: FieldCompletionState = {
            ...currentState,
            hasTriggeredInitialAutofill: true,
            triggeredAt: new Date()
        };
        this.saveCompletionState(performanceSheetId, newState);
    }

    /**
     * Reset completion state (useful for testing or if user wants to re-trigger)
     */
    public static resetCompletionState(performanceSheetId: string): void {
        try {
            localStorage.removeItem(this.getStorageKey(performanceSheetId));
        } catch (error) {
            console.warn('Error resetting initial autofill state:', error);
        }
    }

    /**
     * Get completion progress for UI display
     */
    public static getCompletionProgress(data: PerformanceData): {
        rfqProgress: { completed: number; total: number; percentage: number };
        materialSpecsProgress: { completed: number; total: number; percentage: number };
        overallProgress: { completed: number; total: number; percentage: number };
    } {
        const rfqCompleted = this.RFQ_REQUIRED_FIELDS.filter(field => this.hasValue(data, field)).length;
        const materialSpecsCompleted = this.MATERIAL_SPECS_REQUIRED_FIELDS.filter(field => this.hasValue(data, field)).length;

        const rfqTotal = this.RFQ_REQUIRED_FIELDS.length;
        const materialSpecsTotal = this.MATERIAL_SPECS_REQUIRED_FIELDS.length;
        const overallTotal = rfqTotal + materialSpecsTotal;
        const overallCompleted = rfqCompleted + materialSpecsCompleted;

        const result = {
            rfqProgress: {
                completed: rfqCompleted,
                total: rfqTotal,
                percentage: Math.round((rfqCompleted / rfqTotal) * 100)
            },
            materialSpecsProgress: {
                completed: materialSpecsCompleted,
                total: materialSpecsTotal,
                percentage: Math.round((materialSpecsCompleted / materialSpecsTotal) * 100)
            },
            overallProgress: {
                completed: overallCompleted,
                total: overallTotal,
                percentage: Math.round((overallCompleted / overallTotal) * 100)
            }
        };

        // Debug log for troubleshooting
        if (process.env.NODE_ENV === 'development') {
            // Log missing fields for debugging
            const rfqMissing = this.RFQ_REQUIRED_FIELDS.filter(field => !this.hasValue(data, field));
            const materialMissing = this.MATERIAL_SPECS_REQUIRED_FIELDS.filter(field => !this.hasValue(data, field));

            console.log('🔍 Autofill Completion Progress:', {
                rfq: `${rfqCompleted}/${rfqTotal} (${result.rfqProgress.percentage}%)`,
                materialSpecs: `${materialSpecsCompleted}/${materialSpecsTotal} (${result.materialSpecsProgress.percentage}%)`,
                overall: `${overallCompleted}/${overallTotal} (${result.overallProgress.percentage}%)`,
                rfqMissing: rfqMissing,
                materialMissing: materialMissing,
                totalRequiredFields: rfqTotal + materialSpecsTotal
            });
        }

        return result;
    }
}