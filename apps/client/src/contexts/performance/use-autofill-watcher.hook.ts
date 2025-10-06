/**
 * Auto-Fill Field Watcher Hook
 * 
 * This hook watches for changes in key performance sheet fields and triggers
 * auto-fill when sufficient data becomes available. It implements debouncing
 * to avoid excessive API calls and manages field priority.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { PerformanceData } from '../performance.context';
import { useAutoFill } from './autofill.context';

// Define critical fields that can trigger auto-fill
const TRIGGER_FIELDS = [
    // Material specifications (highest priority)
    'common.material.materialType',
    'common.material.materialThickness',
    'common.material.maxYieldStrength',
    'common.material.coilWidth',

    // Feed rates
    'common.feedRates.average.length',
    'common.feedRates.average.spm',

    // Equipment models (high priority)
    'common.equipment.straightener.model',
    'common.equipment.feed.model',

    // Coil specifications
    'common.coil.outsideDiameter',
    'common.coil.insideDiameter',
    'common.coil.weight',
];

// Define field weights for priority calculation
const FIELD_WEIGHTS: Record<string, number> = {
    'common.material.materialType': 100,
    'common.material.materialThickness': 95,
    'common.material.maxYieldStrength': 90,
    'common.material.coilWidth': 85,
    'common.feedRates.average.length': 80,
    'common.feedRates.average.spm': 75,
    'common.equipment.straightener.model': 70,
    'common.equipment.feed.model': 65,
    'common.coil.outsideDiameter': 60,
    'common.coil.insideDiameter': 55,
    'common.coil.weight': 50,
};

interface UseAutoFillWatcherOptions {
    enabled?: boolean;
    debounceMs?: number;
    requireMinimumFields?: number;
}

/**
 * Hook to watch for field changes and trigger auto-fill
 */
export function useAutoFillWatcher(
    performanceData: PerformanceData | null,
    options: UseAutoFillWatcherOptions = {}
) {
    const {
        enabled = true,
        debounceMs = 2000,
        requireMinimumFields = 4
    } = options;

    const { id: sheetId } = useParams();
    const { triggerAutoFill, checkSufficientData, checkTabAutoFillAvailability, state: autoFillState } = useAutoFill();

    // Track previous values to detect changes
    const previousValuesRef = useRef<Record<string, any>>({});
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastTriggerTimeRef = useRef<number>(0);

    // Get nested value from object using dot notation
    const getNestedValue = useCallback((obj: any, path: string): any => {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }, []);

    // Check if field has meaningful value (not empty/default)
    const hasMeaningfulValue = useCallback((value: any): boolean => {
        if (value === null || value === undefined || value === '') {
            return false;
        }

        if (typeof value === 'number' && value === 0) {
            return false;
        }

        if (typeof value === 'string') {
            const lowerValue = value.toLowerCase();
            if (lowerValue.includes('select') ||
                lowerValue.includes('choose') ||
                lowerValue.includes('default') ||
                lowerValue === 'none') {
                return false;
            }
        }

        return true;
    }, []);

    // Calculate data completeness score
    const calculateDataScore = useCallback((data: PerformanceData): number => {
        if (!data) return 0;

        let score = 0;
        let maxScore = 0;

        for (const field of TRIGGER_FIELDS) {
            const value = getNestedValue(data, field);
            const weight = FIELD_WEIGHTS[field] || 10;

            maxScore += weight;

            if (hasMeaningfulValue(value)) {
                score += weight;
            }
        }

        return maxScore > 0 ? (score / maxScore) * 100 : 0;
    }, [getNestedValue, hasMeaningfulValue]);

    // Detect field changes
    const detectFieldChanges = useCallback((data: PerformanceData): string[] => {
        if (!data) return [];

        const changedFields: string[] = [];
        const currentValues: Record<string, any> = {};

        for (const field of TRIGGER_FIELDS) {
            const currentValue = getNestedValue(data, field);
            const previousValue = previousValuesRef.current[field];

            currentValues[field] = currentValue;

            // Check if value changed and is now meaningful
            if (currentValue !== previousValue && hasMeaningfulValue(currentValue)) {
                changedFields.push(field);
            }
        }

        // Update previous values
        previousValuesRef.current = currentValues;

        return changedFields;
    }, [getNestedValue, hasMeaningfulValue]);

    // Determine if auto-fill should be triggered
    const shouldTriggerAutoFill = useCallback((data: PerformanceData, changedFields: string[]): boolean => {
        if (!enabled || !autoFillState.settings.enabled || !sheetId) {
            console.log('shouldTriggerAutoFill: false - not enabled or missing sheetId', {
                enabled,
                settingsEnabled: autoFillState.settings.enabled,
                sheetId: !!sheetId
            });
            return false;
        }

        // Don't trigger if already auto-filling
        if (autoFillState.isAutoFilling) {
            console.log('shouldTriggerAutoFill: false - already auto-filling');
            return false;
        }

        // Check if sufficient data exists
        const hasSufficientData = checkSufficientData(data);
        if (!hasSufficientData) {
            console.log('shouldTriggerAutoFill: false - insufficient data');
            return false;
        }

        // Check if minimum fields are filled
        const filledFields = TRIGGER_FIELDS.filter(field =>
            hasMeaningfulValue(getNestedValue(data, field))
        );

        if (filledFields.length < requireMinimumFields) {
            console.log('shouldTriggerAutoFill: false - not enough fields filled', {
                filledCount: filledFields.length,
                required: requireMinimumFields,
                filledFields
            });
            return false;
        }

        // Check if enough time has passed since last trigger
        const now = Date.now();
        const timeSinceLastTrigger = now - lastTriggerTimeRef.current;
        if (timeSinceLastTrigger < 1500) { // Reduced to 1.5 seconds for better responsiveness
            console.log('shouldTriggerAutoFill: false - too soon since last trigger', {
                timeSinceLastTrigger,
                minimumWait: 1500,
                lastTrigger: new Date(lastTriggerTimeRef.current).toISOString()
            });
            return false;
        }

        // Check if any high-priority fields changed
        const highPriorityChanged = changedFields.some(field =>
            (FIELD_WEIGHTS[field] || 0) >= 70
        );

        const shouldTrigger = highPriorityChanged || filledFields.length >= requireMinimumFields;
        console.log('shouldTriggerAutoFill:', shouldTrigger, {
            highPriorityChanged,
            filledFieldsCount: filledFields.length,
            requireMinimumFields,
            changedFields,
            filledFields
        });

        // Trigger if high-priority field changed or enough fields filled
        return shouldTrigger;
    }, [
        enabled,
        autoFillState.settings.enabled,
        autoFillState.isAutoFilling,
        sheetId,
        checkSufficientData,
        requireMinimumFields,
        hasMeaningfulValue,
        getNestedValue
    ]);

    // Debounced auto-fill trigger
    const debouncedTriggerAutoFill = useCallback((data: PerformanceData) => {
        if (!sheetId) {
            console.log('debouncedTriggerAutoFill: no sheetId');
            return;
        }

        console.log('debouncedTriggerAutoFill: setting up timer', { debounceMs });

        // Clear existing timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set new timer
        debounceTimerRef.current = setTimeout(async () => {
            try {
                console.log('debouncedTriggerAutoFill: executing autofill');
                await triggerAutoFill(data, sheetId);
                lastTriggerTimeRef.current = Date.now();
                console.log('debouncedTriggerAutoFill: autofill completed successfully');
            } catch (error) {
                console.warn('Auto-fill trigger failed:', error);
            }
        }, debounceMs);
    }, [sheetId, triggerAutoFill, debounceMs]);

    // Debounced tab check - separate effect to avoid setState-in-render
    const tabCheckDebounceRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!performanceData) return;

        // Debounce tab availability check
        if (tabCheckDebounceRef.current) {
            clearTimeout(tabCheckDebounceRef.current);
        }
        tabCheckDebounceRef.current = setTimeout(() => {
            checkTabAutoFillAvailability(performanceData);
        }, 3500); // 3.5 seconds debounce for tab check

    }, [performanceData, checkTabAutoFillAvailability]);

    // Main autofill watcher effect
    useEffect(() => {
        if (!performanceData) return;

        // Detect field changes
        const changedFields = detectFieldChanges(performanceData);

        // Only proceed with auto-fill trigger if there are changes
        if (changedFields.length === 0) return;

        // Calculate data completeness
        const dataScore = calculateDataScore(performanceData);

        // Log changes for debugging
        if (process.env.NODE_ENV === 'development') {
            console.log('Auto-fill watcher:', {
                changedFields,
                dataScore: `${dataScore.toFixed(1)}%`,
                sufficientData: checkSufficientData(performanceData)
            });
        }

        // Check if auto-fill should be triggered
        if (shouldTriggerAutoFill(performanceData, changedFields)) {
            debouncedTriggerAutoFill(performanceData);
        }

    }, [
        performanceData,
        detectFieldChanges,
        calculateDataScore,
        checkSufficientData,
        shouldTriggerAutoFill,
        debouncedTriggerAutoFill
    ]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    // Return watcher state and controls
    return {
        isWatching: enabled && autoFillState.settings.enabled,
        dataScore: performanceData ? calculateDataScore(performanceData) : 0,
        hasSufficientData: autoFillState.hasSufficientData,
        isAutoFilling: autoFillState.isAutoFilling,
        lastAutoFill: autoFillState.lastAutoFillTimestamp,
        tabAutoFillStatus: autoFillState.tabAutoFillStatus,
        fillableTabs: autoFillState.fillableTabs,

        // Manual trigger function
        manualTrigger: useCallback(() => {
            if (performanceData && sheetId) {
                debouncedTriggerAutoFill(performanceData);
            }
        }, [performanceData, sheetId, debouncedTriggerAutoFill])
    };
}
