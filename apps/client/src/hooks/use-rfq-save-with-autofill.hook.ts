/**
 * RFQ Save Hook with Autofill Integration
 * 
 * Integrates with RFQ save functionality to trigger autofill once when saved.
 */

import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAutoFill } from '@/contexts/performance/autofill.context';
import { usePerformanceSheet } from '@/contexts/performance.context';

export function useRfqSaveWithAutofill() {
    const { id: sheetId } = useParams();
    const { performanceData, updatePerformanceData } = usePerformanceSheet();
    const { triggerAutoFillOnSave } = useAutoFill();

    const saveRfqWithAutofill = useCallback(async () => {
        if (!performanceData || !sheetId) {
            throw new Error('Missing performance data or sheet ID');
        }

        try {
            // First, save the current data
            await updatePerformanceData(performanceData, true);
            console.log('✅ RFQ data saved successfully');

            // Then trigger autofill if conditions are met (one-time only)
            await triggerAutoFillOnSave(performanceData, sheetId);

            return true;
        } catch (error) {
            console.error('Error saving RFQ with autofill:', error);
            throw error;
        }
    }, [performanceData, sheetId, updatePerformanceData, triggerAutoFillOnSave]);

    return {
        saveRfqWithAutofill,
        canSave: !!(performanceData && sheetId)
    };
}

export default useRfqSaveWithAutofill;