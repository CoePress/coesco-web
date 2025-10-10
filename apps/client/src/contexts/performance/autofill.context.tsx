/**
 * Performance Auto-Fill Context
 * 
 * Manages auto-fill functionality for performance sheets including:
 * - Triggering auto-fill when sufficient data is available
 * - Managing auto-filled vs manual values
 * - User control over accepting/rejecting auto-fills
 * - Priority-based field filling
 */

import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';
import { useApi } from '@/hooks/use-api';
import { PerformanceData, usePerformanceSheet } from '../performance.context';
import { transformDataForAutofill } from '@/utils/autofill-data-transformer';
import { InitialAutofillTriggerService } from '@/services/initial-autofill-trigger.service';

// Types
interface AutoFillState {
    isAutoFilling: boolean;
    lastAutoFillTimestamp: number | null;
    autoFilledFields: Set<string>;
    pendingAutoFill: boolean;
    autoFillResults: any | null;
    hasSufficientData: boolean;
    tabAutoFillStatus: Record<string, boolean>;
    fillableTabs: string[];
    error: string | null;
    settings: {
        enabled: boolean;
        preserveUserInput: boolean;
        prioritizeModels: boolean;
        showNotifications: boolean;
        requireConfirmation: boolean;
        manualModeOnly: boolean; // NEW: Only allow manual triggers
    };
    // Save trigger state
    hasTriggeredOnSave: boolean;
}

type AutoFillAction =
    | { type: 'SET_AUTO_FILLING'; payload: boolean }
    | { type: 'SET_PENDING_AUTO_FILL'; payload: boolean }
    | { type: 'SET_AUTO_FILL_RESULTS'; payload: any }
    | { type: 'SET_SUFFICIENT_DATA'; payload: boolean }
    | { type: 'SET_TAB_AUTO_FILL_STATUS'; payload: Record<string, boolean> }
    | { type: 'SET_FILLABLE_TABS'; payload: string[] }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'ADD_AUTO_FILLED_FIELDS'; payload: string[] }
    | { type: 'REMOVE_AUTO_FILLED_FIELD'; payload: string }
    | { type: 'CLEAR_AUTO_FILLED_FIELDS' }
    | { type: 'UPDATE_SETTINGS'; payload: Partial<AutoFillState['settings']> }
    | { type: 'SET_LAST_AUTO_FILL_TIMESTAMP'; payload: number }
    | { type: 'SET_HAS_TRIGGERED_ON_SAVE'; payload: boolean };

// Initial state
const initialAutoFillState: AutoFillState = {
    isAutoFilling: false,
    lastAutoFillTimestamp: null,
    autoFilledFields: new Set(),
    pendingAutoFill: false,
    autoFillResults: null,
    hasSufficientData: false,
    tabAutoFillStatus: {},
    fillableTabs: [],
    error: null,
    settings: {
        enabled: true,
        preserveUserInput: true,
        prioritizeModels: true,
        showNotifications: true,
        requireConfirmation: false,
        manualModeOnly: true
    },
    hasTriggeredOnSave: false
};

// Reducer
function autoFillReducer(state: AutoFillState, action: AutoFillAction): AutoFillState {
    switch (action.type) {
        case 'SET_AUTO_FILLING':
            return { ...state, isAutoFilling: action.payload };
        case 'SET_PENDING_AUTO_FILL':
            return { ...state, pendingAutoFill: action.payload };
        case 'SET_AUTO_FILL_RESULTS':
            return { ...state, autoFillResults: action.payload, error: null };
        case 'SET_SUFFICIENT_DATA':
            return { ...state, hasSufficientData: action.payload };
        case 'SET_TAB_AUTO_FILL_STATUS':
            return { ...state, tabAutoFillStatus: action.payload };
        case 'SET_FILLABLE_TABS':
            return { ...state, fillableTabs: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload, isAutoFilling: false };
        case 'ADD_AUTO_FILLED_FIELDS':
            return {
                ...state,
                autoFilledFields: new Set([...state.autoFilledFields, ...action.payload])
            };
        case 'REMOVE_AUTO_FILLED_FIELD':
            const newFields = new Set(state.autoFilledFields);
            newFields.delete(action.payload);
            return { ...state, autoFilledFields: newFields };
        case 'CLEAR_AUTO_FILLED_FIELDS':
            return { ...state, autoFilledFields: new Set() };
        case 'UPDATE_SETTINGS':
            return {
                ...state,
                settings: { ...state.settings, ...action.payload }
            };
        case 'SET_LAST_AUTO_FILL_TIMESTAMP':
            return { ...state, lastAutoFillTimestamp: action.payload };
        case 'SET_HAS_TRIGGERED_ON_SAVE':
            return { ...state, hasTriggeredOnSave: action.payload };
        default:
            return state;
    }
}

// Context interface
interface AutoFillContextType {
    state: AutoFillState;
    dispatch: React.Dispatch<AutoFillAction>;

    // Core auto-fill functions
    triggerAutoFill: (performanceData: PerformanceData, sheetId: string, isManual?: boolean) => Promise<void>;
    triggerAutoFillOnSave: (performanceData: PerformanceData, sheetId: string) => Promise<void>;
    acceptAutoFill: (autoFillData: any) => Promise<void>;
    rejectAutoFill: () => void;

    // Field management
    markFieldAsAutoFilled: (fieldPath: string) => void;
    markFieldAsManual: (fieldPath: string) => void;
    isFieldAutoFilled: (fieldPath: string) => boolean;

    // Data checking
    checkSufficientData: (performanceData: PerformanceData) => boolean;
    checkTabAutoFillAvailability: (performanceData: PerformanceData) => Promise<void>;
    canAutoFillTab: (tabName: string) => boolean;

    // Settings management
    updateSettings: (newSettings: Partial<AutoFillState['settings']>) => void;

    // Progress and completion
    getCompletionProgress: (performanceData: PerformanceData) => any;
}

// Context
const AutoFillContext = createContext<AutoFillContextType | undefined>(undefined);

// Provider component
export const AutoFillProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(autoFillReducer, initialAutoFillState);
    const api = useApi();
    const { updatePerformanceData } = usePerformanceSheet();

    // Check if data is sufficient for auto-fill
    const checkSufficientData = useCallback((performanceData: PerformanceData): boolean => {
        if (!performanceData) return false;

        // Check for basic material specifications
        const hasMaterialSpecs = performanceData.common?.material?.materialType &&
            performanceData.common?.material?.materialThickness &&
            performanceData.common?.material?.maxYieldStrength;

        // Check for basic dimensions
        const hasDimensions = performanceData.common?.material?.coilWidth;

        // Check for basic feed rates
        const hasFeedRates = performanceData.common?.feedRates?.average?.length &&
            performanceData.common?.feedRates?.average?.spm;

        const sufficient = !!(hasMaterialSpecs && hasDimensions && hasFeedRates);

        // Update state if changed
        if (sufficient !== state.hasSufficientData) {
            dispatch({ type: 'SET_SUFFICIENT_DATA', payload: sufficient });
        }

        return sufficient;
    }, [state.hasSufficientData]);

    // Trigger auto-fill (manual or save-triggered)
    const triggerAutoFill = useCallback(async (performanceData: PerformanceData, sheetId: string, isManual: boolean = false) => {

        if (!state.settings.enabled || state.isAutoFilling) {
            return;
        }

        // In manual mode, only allow manual triggers or save triggers
        if (state.settings.manualModeOnly && !isManual) {
            return;
        }

        // Check if we have sufficient data using existing logic
        if (!checkSufficientData(performanceData)) {
            // Insufficient data for autofill
            return;
        }

        try {

            dispatch({ type: 'SET_AUTO_FILLING', payload: true });
            dispatch({ type: 'SET_ERROR', payload: null });

            // Call the auto-fill API
            const transformedData = transformDataForAutofill(performanceData);


            const response = await api.post(`/performance/sheets/${sheetId}/autofill`, transformedData, {
                params: {
                    merge: 'true',
                    preserveUserInput: state.settings.preserveUserInput,
                    prioritizeModels: state.settings.prioritizeModels
                }
            });




            if (response.data.success) {
                // Use the autoFillValues which contains the actual calculated values
                const autoFillData = response.data.autoFillValues || {};

                dispatch({ type: 'SET_AUTO_FILL_RESULTS', payload: response.data });
                dispatch({ type: 'SET_LAST_AUTO_FILL_TIMESTAMP', payload: Date.now() });

                if (state.settings.requireConfirmation) {
                    dispatch({ type: 'SET_PENDING_AUTO_FILL', payload: true });
                } else {
                    // Auto-accept if confirmation not required

                    await acceptAutoFill(autoFillData);
                }
            } else {
                throw new Error(response.data.error || 'Auto-fill failed');
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to generate auto-fill values';
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            // Auto-fill error occurred
        } finally {
            dispatch({ type: 'SET_AUTO_FILLING', payload: false });
        }
    }, [state.settings, state.isAutoFilling, api, checkSufficientData]);

    // Trigger autofill on save (one-time only)
    const triggerAutoFillOnSave = useCallback(async (performanceData: PerformanceData, sheetId: string) => {
        // Only trigger once on save
        if (state.hasTriggeredOnSave) {
            // Autofill already triggered on save, skipping
            return;
        }

        // Check if we have enough data for autofill
        const progress = InitialAutofillTriggerService.getCompletionProgress(performanceData);
        if (progress.overallProgress.percentage < 80) {
            // Not enough data for save autofill
            return;
        }

        // Triggering autofill on RFQ save (one-time only)

        // Mark as triggered on save
        dispatch({ type: 'SET_HAS_TRIGGERED_ON_SAVE', payload: true });

        // Trigger the autofill
        await triggerAutoFill(performanceData, sheetId, true);
    }, [state.hasTriggeredOnSave, triggerAutoFill]);

    // Accept auto-fill values
    const acceptAutoFill = useCallback(async (autoFillData: any) => {
        if (!autoFillData) {

            return;
        }

        try {



            // Transform dropdown number values back to proper strings
            const transformedData = { ...autoFillData };

            // Fix typeOfRoll if it's a number
            if (transformedData.materialSpecs?.straightener?.rolls?.typeOfRoll &&
                typeof transformedData.materialSpecs.straightener.rolls.typeOfRoll === 'number') {
                const rollNumber = transformedData.materialSpecs.straightener.rolls.typeOfRoll;
                transformedData.materialSpecs.straightener.rolls.typeOfRoll = `${rollNumber} Roll Str Backbend`;

            }

            // Apply the autofill data to the performance sheet and save it
            await updatePerformanceData(transformedData, true); // Save to database

            // Get all the field paths that were auto-filled
            const autoFilledPaths = getAllFieldPaths(transformedData);

            // Mark fields as auto-filled
            dispatch({ type: 'ADD_AUTO_FILLED_FIELDS', payload: autoFilledPaths });

            // Clear pending state
            dispatch({ type: 'SET_PENDING_AUTO_FILL', payload: false });



        } catch (error) {
            // Error accepting auto-fill
            dispatch({ type: 'SET_ERROR', payload: 'Failed to accept auto-fill values' });
        }
    }, [updatePerformanceData]);

    // Reject auto-fill
    const rejectAutoFill = useCallback(() => {
        dispatch({ type: 'SET_PENDING_AUTO_FILL', payload: false });
        dispatch({ type: 'SET_AUTO_FILL_RESULTS', payload: null });
    }, []);

    // Mark field as auto-filled
    const markFieldAsAutoFilled = useCallback((fieldPath: string) => {
        dispatch({ type: 'ADD_AUTO_FILLED_FIELDS', payload: [fieldPath] });
    }, []);

    // Mark field as manual (remove from auto-filled set)
    const markFieldAsManual = useCallback((fieldPath: string) => {
        dispatch({ type: 'REMOVE_AUTO_FILLED_FIELD', payload: fieldPath });
    }, []);

    // Check if field is auto-filled
    const isFieldAutoFilled = useCallback((fieldPath: string): boolean => {
        return state.autoFilledFields.has(fieldPath);
    }, [state.autoFilledFields]);

    // Update settings
    const updateSettings = useCallback((newSettings: Partial<AutoFillState['settings']>) => {
        dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings });
    }, []);

    // Check tab-specific auto-fill availability
    const checkTabAutoFillAvailability = useCallback(async (performanceData: PerformanceData) => {
        try {
            // Transform data for backend calculation engine
            const transformedData = transformDataForAutofill(performanceData);
            const response = await api.post('/performance/autofill/check', transformedData);

            if (response && response.success && response.data) {
                dispatch({ type: 'SET_TAB_AUTO_FILL_STATUS', payload: response.data.tabStatus || {} });
                dispatch({ type: 'SET_FILLABLE_TABS', payload: response.data.fillableTabs || [] });
                // Ensure globalSufficient is boolean
                const globalSufficient = typeof response.data.globalSufficient === 'boolean'
                    ? response.data.globalSufficient
                    : Boolean(response.data.globalSufficient);
                dispatch({ type: 'SET_SUFFICIENT_DATA', payload: globalSufficient });
            } else {

            }
        } catch (error) {
            // Error checking tab auto-fill availability
        }
    }, [api]);

    // Check if specific tab can be auto-filled
    const canAutoFillTab = useCallback((tabName: string): boolean => {
        return state.tabAutoFillStatus[tabName] || false;
    }, [state.tabAutoFillStatus]);

    // Get completion progress for UI display
    const getCompletionProgress = useCallback((performanceData: PerformanceData) => {
        return InitialAutofillTriggerService.getCompletionProgress(performanceData);
    }, []);

    const contextValue: AutoFillContextType = {
        state,
        dispatch,
        triggerAutoFill,
        triggerAutoFillOnSave,
        acceptAutoFill,
        rejectAutoFill,
        markFieldAsAutoFilled,
        markFieldAsManual,
        isFieldAutoFilled,
        checkSufficientData,
        checkTabAutoFillAvailability,
        canAutoFillTab,
        updateSettings,
        getCompletionProgress
    };

    return (
        <AutoFillContext.Provider value={contextValue}>
            {children}
        </AutoFillContext.Provider>
    );
};

// Hook to use auto-fill context
export const useAutoFill = (): AutoFillContextType => {
    const context = useContext(AutoFillContext);
    if (!context) {
        throw new Error('useAutoFill must be used within an AutoFillProvider');
    }
    return context;
};

// Helper function to get all field paths from nested object
function getAllFieldPaths(obj: any, prefix: string = ''): string[] {
    const paths: string[] = [];

    if (!obj || typeof obj !== 'object') {
        return paths;
    }

    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const path = prefix ? `${prefix}.${key}` : key;
            const value = obj[key];

            if (value && typeof value === 'object' && !Array.isArray(value)) {
                paths.push(...getAllFieldPaths(value, path));
            } else {
                paths.push(path);
            }
        }
    }

    return paths;
}

// Export types for use in other components
export type { AutoFillState, AutoFillAction };
