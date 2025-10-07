/**
 * Integration Guide for Initial Autofill Trigger System
 * 
 * This file shows how to integrate the new initial autofill trigger system
 * into your performance sheet pages.
 */

import React from 'react';
import { AutoFillProvider } from '@/contexts/performance/autofill.context';
import { useAutoFillWatcher } from '@/contexts/performance/use-autofill-watcher.hook';
import { InitialAutofillProgress } from '@/components/performance/InitialAutofillProgress';
import { InitialAutofillDevTools } from '@/components/performance/InitialAutofillDevTools';
import { usePerformanceSheet } from '@/contexts/performance.context';

/**
 * Example integration in a performance sheet page component
 */
export const PerformanceSheetWithInitialAutofill: React.FC = () => {
    const { performanceData } = usePerformanceSheet();

    // Hook that handles both initial and normal autofill watching
    const autoFillWatcher = useAutoFillWatcher(performanceData, {
        enabled: true,
        debounceMs: 2000,
        requireMinimumFields: 4
    });

    return (
        <div className="performance-sheet">
            {/* Your existing performance sheet content */}

            {/* Add the progress indicator where appropriate (e.g., in a sidebar or at the top) */}
            <InitialAutofillProgress
                performanceData={performanceData}
                className="mb-4"
            />

            {/* Your existing tabs and form content */}

            {/* Development tools (only visible in development) */}
            <InitialAutofillDevTools />
        </div>
    );
};

/**
 * Make sure your app is wrapped with the AutoFillProvider
 */
export const AppWithAutofill: React.FC = () => {
    return (
        <AutoFillProvider>
            {/* Your existing app content */}
            <PerformanceSheetWithInitialAutofill />
        </AutoFillProvider>
    );
};

// Export integration examples
export default PerformanceSheetWithInitialAutofill;