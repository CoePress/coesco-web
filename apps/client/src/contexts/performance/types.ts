/**
 * Shared type definitions for performance contexts
 * Split from the main context file for better organization
 */

import { PerformanceData } from '../performance.context';

// State interfaces for split contexts
export interface PerformanceDataState {
    data: PerformanceData;
    loading: boolean;
    error: string | null;
    isDirty: boolean;
    lastSaved: Date | null;
}

export interface PerformanceValidationState {
    fieldErrors: Record<string, string>;
    isValid: boolean;
    validationInProgress: boolean;
}

export interface PerformanceUIState {
    activeTab: string;
    selectedSections: string[];
    viewMode: 'edit' | 'view' | 'calculate';
    sidebarCollapsed: boolean;
}

// Action types for better type safety
export type PerformanceDataAction =
    | { type: 'SET_DATA'; payload: PerformanceData }
    | { type: 'UPDATE_FIELD'; payload: { path: string; value: any } }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_DIRTY'; payload: boolean }
    | { type: 'SET_LAST_SAVED'; payload: Date | null };

export type PerformanceValidationAction =
    | { type: 'SET_FIELD_ERROR'; payload: { field: string; error: string } }
    | { type: 'CLEAR_FIELD_ERROR'; payload: string }
    | { type: 'SET_ALL_ERRORS'; payload: Record<string, string> }
    | { type: 'CLEAR_ALL_ERRORS' }
    | { type: 'SET_VALIDATION_IN_PROGRESS'; payload: boolean };

export type PerformanceUIAction =
    | { type: 'SET_ACTIVE_TAB'; payload: string }
    | { type: 'TOGGLE_SECTION'; payload: string }
    | { type: 'SET_VIEW_MODE'; payload: 'edit' | 'view' | 'calculate' }
    | { type: 'TOGGLE_SIDEBAR' };
