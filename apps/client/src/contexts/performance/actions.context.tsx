/**
 * Performance Actions Context - Handles mutations and side effects
 * Separated from data to prevent unnecessary re-renders
 */

import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '@/hooks/use-api';
import { PerformanceData } from '../performance.context';
import { usePerformanceData } from './data.context';

// Actions interface
interface PerformanceActionsContextType {
    updateField: (path: string, value: any) => void;
    updateData: (updates: Partial<PerformanceData>) => Promise<PerformanceData>;
    saveData: () => Promise<void>;
    loadData: (id: string) => Promise<void>;
    resetData: () => void;
}

const PerformanceActionsContext = createContext<PerformanceActionsContextType | undefined>(undefined);

// Helper function for deep merge
function deepMerge<T>(target: T, source: Partial<T>): T {
    const result = { ...target };

    for (const key in source) {
        if (source[key] !== undefined) {
            if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                if (typeof target[key] === 'object' && target[key] !== null) {
                    (result as any)[key] = deepMerge(target[key] as any, source[key] as any);
                } else {
                    (result as any)[key] = source[key];
                }
            } else {
                (result as any)[key] = source[key];
            }
        }
    }

    return result;
}

// Provider component
export const PerformanceActionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { state, dispatch } = usePerformanceData();
    const { id: performanceSheetId } = useParams();
    const api = useApi();

    const updateField = useCallback((path: string, value: any) => {
        dispatch({ type: 'UPDATE_FIELD', payload: { path, value } });
    }, [dispatch]);

    const updateData = useCallback(async (updates: Partial<PerformanceData>): Promise<PerformanceData> => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
            // Optimistically update local state
            const updatedData = deepMerge(state.data, updates);
            dispatch({ type: 'SET_DATA', payload: updatedData });

            if (performanceSheetId) {
                // Send to backend for calculations
                const response = await api.patch(`/performance/${performanceSheetId}`, { data: updatedData });

                if (response) {
                    // Merge backend response with current data
                    const finalData = deepMerge(updatedData, response);
                    dispatch({ type: 'SET_DATA', payload: finalData });
                    dispatch({ type: 'SET_LAST_SAVED', payload: new Date() });
                    return finalData;
                }
            }

            return updatedData;
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Update failed' });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [state.data, performanceSheetId, api, dispatch]);

    const saveData = useCallback(async () => {
        if (!performanceSheetId || !state.isDirty) return;

        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
            await api.patch(`/performance/${performanceSheetId}`, { data: state.data });
            dispatch({ type: 'SET_LAST_SAVED', payload: new Date() });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Save failed' });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [performanceSheetId, state.data, state.isDirty, api, dispatch]);

    const loadData = useCallback(async (id: string) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
            const response = await api.get(`/performance/sheets/${id}`);
            if (response && response.data) {
                dispatch({ type: 'SET_DATA', payload: response.data.data || response.data });
            }
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Load failed' });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [api, dispatch]);

    const resetData = useCallback(() => {
        dispatch({ type: 'SET_DATA', payload: state.data }); // Reset to initial or last saved state
        dispatch({ type: 'SET_ERROR', payload: null });
    }, [state.data, dispatch]);

    const value: PerformanceActionsContextType = {
        updateField,
        updateData,
        saveData,
        loadData,
        resetData,
    };

    return (
        <PerformanceActionsContext.Provider value={value}>
            {children}
        </PerformanceActionsContext.Provider>
    );
};

// Hook to use the context
export const usePerformanceActions = () => {
    const context = useContext(PerformanceActionsContext);
    if (!context) {
        throw new Error('usePerformanceActions must be used within a PerformanceActionsProvider');
    }
    return context;
};
