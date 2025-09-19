/**
 * Performance Data Context - Handles only data state
 * Separated from actions to prevent unnecessary re-renders
 */

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { PerformanceData, initialPerformanceData } from '../performance.context';
import { PerformanceDataState, PerformanceDataAction } from './types';

// Initial state
const initialDataState: PerformanceDataState = {
    data: initialPerformanceData,
    loading: false,
    error: null,
    isDirty: false,
    lastSaved: null,
};

// Reducer for data state management
function performanceDataReducer(
    state: PerformanceDataState,
    action: PerformanceDataAction
): PerformanceDataState {
    switch (action.type) {
        case 'SET_DATA':
            return {
                ...state,
                data: action.payload,
                isDirty: false,
            };
        case 'UPDATE_FIELD':
            return {
                ...state,
                data: updateNestedField(state.data, action.payload.path, action.payload.value),
                isDirty: true,
            };
        case 'SET_LOADING':
            return {
                ...state,
                loading: action.payload,
            };
        case 'SET_ERROR':
            return {
                ...state,
                error: action.payload,
                loading: false,
            };
        case 'SET_DIRTY':
            return {
                ...state,
                isDirty: action.payload,
            };
        case 'SET_LAST_SAVED':
            return {
                ...state,
                lastSaved: action.payload,
                isDirty: false,
            };
        default:
            return state;
    }
}

// Helper function to update nested fields
function updateNestedField(obj: any, path: string, value: any): any {
    const keys = path.split('.');
    const result = JSON.parse(JSON.stringify(obj)); // Deep clone

    let current = result;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
            current[keys[i]] = {};
        }
        current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    return result;
}

// Context definition
interface PerformanceDataContextType {
    state: PerformanceDataState;
    dispatch: React.Dispatch<PerformanceDataAction>;
}

const PerformanceDataContext = createContext<PerformanceDataContextType | undefined>(undefined);

// Provider component
export const PerformanceDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(performanceDataReducer, initialDataState);

    return (
        <PerformanceDataContext.Provider value={{ state, dispatch }}>
            {children}
        </PerformanceDataContext.Provider>
    );
};

// Hook to use the context
export const usePerformanceData = () => {
    const context = useContext(PerformanceDataContext);
    if (!context) {
        throw new Error('usePerformanceData must be used within a PerformanceDataProvider');
    }
    return context;
};

// Selector hooks for specific data slices to minimize re-renders
export function usePerformanceDataSelector<T>(selector: (data: PerformanceData) => T): T {
    const { state } = usePerformanceData();
    return selector(state.data);
}

// Commonly used selectors
export const useRFQData = () => usePerformanceDataSelector(data => data.rfq);
export const useCommonData = () => usePerformanceDataSelector(data => data.common);
export const useMaterialSpecs = () => usePerformanceDataSelector(data => data.materialSpecs);
export const useTDDBHDData = () => usePerformanceDataSelector(data => data.tddbhd);
export const useReelDriveData = () => usePerformanceDataSelector(data => data.reelDrive);
export const useStrUtilityData = () => usePerformanceDataSelector(data => data.strUtility);
export const useFeedData = () => usePerformanceDataSelector(data => data.feed);
export const useShearData = () => usePerformanceDataSelector(data => data.shear);
