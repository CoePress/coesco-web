/**
 * Performance UI State Context - Handles UI state like active tabs, view modes, etc.
 * Separated for better performance and organization
 */

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { PerformanceUIState, PerformanceUIAction } from './types';

// Initial UI state
const initialUIState: PerformanceUIState = {
    activeTab: 'rfq',
    selectedSections: [],
    viewMode: 'edit',
    sidebarCollapsed: false,
};

// UI state reducer
function performanceUIReducer(
    state: PerformanceUIState,
    action: PerformanceUIAction
): PerformanceUIState {
    switch (action.type) {
        case 'SET_ACTIVE_TAB':
            return {
                ...state,
                activeTab: action.payload,
            };
        case 'TOGGLE_SECTION':
            const sectionIndex = state.selectedSections.indexOf(action.payload);
            const newSelectedSections = sectionIndex >= 0
                ? state.selectedSections.filter(section => section !== action.payload)
                : [...state.selectedSections, action.payload];

            return {
                ...state,
                selectedSections: newSelectedSections,
            };
        case 'SET_VIEW_MODE':
            return {
                ...state,
                viewMode: action.payload,
            };
        case 'TOGGLE_SIDEBAR':
            return {
                ...state,
                sidebarCollapsed: !state.sidebarCollapsed,
            };
        default:
            return state;
    }
}

// Context interface
interface PerformanceUIContextType {
    state: PerformanceUIState;
    dispatch: React.Dispatch<PerformanceUIAction>;
}

const PerformanceUIContext = createContext<PerformanceUIContextType | undefined>(undefined);

// Provider component
export const PerformanceUIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(performanceUIReducer, initialUIState);

    return (
        <PerformanceUIContext.Provider value={{ state, dispatch }}>
            {children}
        </PerformanceUIContext.Provider>
    );
};

// Hook to use the context
export const usePerformanceUI = () => {
    const context = useContext(PerformanceUIContext);
    if (!context) {
        throw new Error('usePerformanceUI must be used within a PerformanceUIProvider');
    }
    return context;
};

// Convenience hooks for common UI state
export const useActiveTab = () => {
    const { state } = usePerformanceUI();
    return state.activeTab;
};

export const useViewMode = () => {
    const { state } = usePerformanceUI();
    return state.viewMode;
};

export const useSelectedSections = () => {
    const { state } = usePerformanceUI();
    return state.selectedSections;
};

export const useSidebarState = () => {
    const { state } = usePerformanceUI();
    return state.sidebarCollapsed;
};
