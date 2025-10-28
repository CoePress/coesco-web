/**
 * Autofill Engine
 *
 * Main orchestrator for server-side autofill operations
 * Combines all autofill services to provide comprehensive autofill functionality
 */

import { PerformanceData } from './types/performance-data.types';
import { getVisibleTabs } from './utils/tab-visibility';
import { AutofillTriggerService } from './services/autofill-trigger.service';
import { ValidationAwareAutofillService } from './services/validation-aware-autofill.service';
import { transformDataForAutofill } from './services/autofill-data-transformer';
import { InitialAutofillTriggerService } from './services/initial-autofill-trigger.service';

export interface AutofillResult {
    success: boolean;
    suggestions: Record<string, any>;
    triggeredTabs: string[];
    visibleTabs: string[];
    metadata: {
        hasSufficientData: boolean;
        shouldTriggerInitialAutofill: boolean;
        completionProgress: {
            rfqProgress: { completed: number; total: number; percentage: number };
            materialSpecsProgress: { completed: number; total: number; percentage: number };
            overallProgress: { completed: number; total: number; percentage: number };
        };
    };
}

export interface AutofillOptions {
    performanceSheetId?: string;
    fieldChanged?: string;
    transformData?: boolean;
}

export class AutofillEngine {
    /**
     * Main autofill function - determines what should be autofilled based on current data
     */
    public static generateAutofillSuggestions(
        data: PerformanceData,
        options: AutofillOptions = {}
    ): AutofillResult {
        const {
            performanceSheetId = 'default',
            fieldChanged,
            transformData = true
        } = options;

        // Transform data if needed (strings to numbers)
        const processedData = transformData ? transformDataForAutofill(data) : data;

        // Get visible tabs based on current configuration
        const visibleTabs = getVisibleTabs(processedData);
        const visibleTabNames = visibleTabs.map(tab => tab.value);

        // Determine triggered tabs if a field changed
        let triggeredTabs: string[] = [];
        if (fieldChanged) {
            triggeredTabs = AutofillTriggerService.getTriggeredTabs(fieldChanged, processedData);
        }

        // Check if we have sufficient data for autofill
        const hasSufficientData = AutofillTriggerService.hasSufficientDataForAutofill(processedData);

        // Check completion state for initial autofill
        const completionCheck = InitialAutofillTriggerService.checkAndUpdateCompletionState(
            processedData,
            performanceSheetId
        );

        // Get completion progress
        const completionProgress = InitialAutofillTriggerService.getCompletionProgress(processedData);

        // Generate suggestions based on visible tabs
        const suggestions = ValidationAwareAutofillService.getComprehensiveAutofill(
            processedData,
            visibleTabs
        );

        return {
            success: true,
            suggestions,
            triggeredTabs,
            visibleTabs: visibleTabNames,
            metadata: {
                hasSufficientData,
                shouldTriggerInitialAutofill: completionCheck.shouldTriggerInitialAutofill,
                completionProgress
            }
        };
    }

    /**
     * Get autofill suggestions for a specific tab
     */
    public static getTabAutofillSuggestions(
        data: PerformanceData,
        tabName: string,
        transformData = true
    ): Record<string, any> {
        const processedData = transformData ? transformDataForAutofill(data) : data;
        return ValidationAwareAutofillService.getPassingCalculationValues(processedData, tabName);
    }

    /**
     * Check if a tab has sufficient data for autofill
     */
    public static canAutofillTab(
        data: PerformanceData,
        tabName: string
    ): boolean {
        return ValidationAwareAutofillService.hasMinimumRequiredData(data, tabName);
    }

    /**
     * Get autofill strategy for a field change
     */
    public static getFieldAutofillStrategy(
        fieldName: string,
        data: PerformanceData
    ) {
        return AutofillTriggerService.getAutofillStrategy(fieldName, data);
    }

    /**
     * Check if initial autofill should be triggered
     */
    public static checkInitialAutofillTrigger(
        data: PerformanceData,
        performanceSheetId: string
    ) {
        return InitialAutofillTriggerService.checkAndUpdateCompletionState(data, performanceSheetId);
    }

    /**
     * Mark initial autofill as triggered
     */
    public static markInitialAutofillTriggered(performanceSheetId: string): void {
        InitialAutofillTriggerService.markInitialAutofillTriggered(performanceSheetId);
    }

    /**
     * Get high-priority fields that should trigger autofill
     */
    public static getHighPriorityFields(): string[] {
        return AutofillTriggerService.getHighPriorityFields();
    }

    /**
     * Check if a value is meaningful (not empty/default)
     */
    public static hasMeaningfulValue(value: any): boolean {
        return AutofillTriggerService.hasMeaningfulValue(value);
    }

    /**
     * Get nested value from data object
     */
    public static getNestedValue(data: PerformanceData, path: string): any {
        return AutofillTriggerService.getNestedValue(data, path);
    }
}
