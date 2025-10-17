/**
 * RFQ Save Hook
 * 
 * Handles RFQ save functionality. Autofill is now manual-only via the ManualAutofillButton.
 */

import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { usePerformanceSheet } from '@/contexts/performance.context';

export function useRfqSaveWithAutofill() {
    const { id: sheetId } = useParams();
    const { performanceData, updatePerformanceData } = usePerformanceSheet();

    const saveRfq = useCallback(async () => {
        if (!performanceData || !sheetId) {
            throw new Error('Missing performance data or sheet ID');
        }

        try {
            // Save the current data
            await updatePerformanceData(performanceData, true);
            console.log('✅ RFQ data saved successfully');

            // Note: Autofill is now manual-only via the ManualAutofillButton component

            return true;
        } catch (error) {
            console.error('Error saving RFQ:', error);
            throw error;
        }
    }, [performanceData, sheetId, updatePerformanceData]);

    return {
        saveRfqWithAutofill: saveRfq,  // Keep the same interface for backward compatibility
        canSave: !!(performanceData && sheetId)
    };
}

export default useRfqSaveWithAutofill;