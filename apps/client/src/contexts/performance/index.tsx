/**
 * Combined Performance Provider - Wraps all performance contexts
 * This provides a single provider that manages all performance-related state
 */

import React, { ReactNode } from 'react';
import { PerformanceDataProvider } from './data.context';
import { PerformanceActionsProvider } from './actions.context';
import { PerformanceValidationProvider } from './validation.context';
import { PerformanceUIProvider } from './ui.context';

interface PerformanceProviderProps {
    children: ReactNode;
}

export const PerformanceProvider: React.FC<PerformanceProviderProps> = ({ children }) => {
    return React.createElement(
        PerformanceDataProvider,
        null,
        React.createElement(
            PerformanceActionsProvider,
            null,
            React.createElement(
                PerformanceValidationProvider,
                null,
                React.createElement(
                    PerformanceUIProvider,
                    null,
                    children
                )
            )
        )
    );
};

// Re-export all hooks for convenience
export {
    usePerformanceData,
    usePerformanceDataSelector,
    useRFQData,
    useCommonData,
    useMaterialSpecs,
    useTDDBHDData,
    useReelDriveData,
    useStrUtilityData,
    useFeedData,
    useShearData,
} from './data.context';

export {
    usePerformanceActions,
} from './actions.context';

export {
    usePerformanceValidation,
} from './validation.context';

export {
    usePerformanceUI,
    useActiveTab,
    useViewMode,
    useSelectedSections,
    useSidebarState,
} from './ui.context';

export * from './types';
