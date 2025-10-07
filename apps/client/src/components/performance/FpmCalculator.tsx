/**
 * FPM Calculator Component
 * 
 * Automatically calculates Feet Per Minute (FPM) from Strokes Per Minute (SPM) 
 * and stroke length when both values are available.
 * 
 * Formula: FPM = (SPM × Length in inches) ÷ 12
 */

import React, { useEffect } from 'react';
import { Calculator } from 'lucide-react';
import { usePerformanceSheet } from '@/contexts/performance.context';

interface FpmCalculatorProps {
    spmPath: string;
    lengthPath: string;
    fpmPath: string;
    label?: string;
    className?: string;
}

export const FpmCalculator: React.FC<FpmCalculatorProps> = ({
    spmPath,
    lengthPath,
    fpmPath,
    label = "Auto-calculate FPM",
    className = ""
}) => {
    const { performanceData, updatePerformanceData } = usePerformanceSheet();

    // Get nested value from object using dot notation
    const getNestedValue = (obj: any, path: string): any => {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    };

    // Set nested value in object using dot notation
    const setNestedValue = (obj: any, path: string, value: any): any => {
        const keys = path.split('.');
        const lastKey = keys.pop()!;
        const target = keys.reduce((current, key) => {
            if (!current[key]) current[key] = {};
            return current[key];
        }, obj);
        target[lastKey] = value;
        return obj;
    };

    useEffect(() => {
        if (!performanceData) return;

        const spm = getNestedValue(performanceData, spmPath);
        const length = getNestedValue(performanceData, lengthPath);
        const currentFpm = getNestedValue(performanceData, fpmPath);

        // Only calculate if we have both SPM and length, and FPM is not already set by user
        if (spm && length && typeof spm === 'number' && typeof length === 'number') {
            const calculatedFpm = Math.round(((spm * length) / 12) * 100) / 100;

            // Only update if the calculated value is different from current
            if (currentFpm !== calculatedFpm) {
                const updatedData = { ...performanceData };
                setNestedValue(updatedData, fpmPath, calculatedFpm);

                // Update the performance data
                updatePerformanceData(updatedData, true);

                if (process.env.NODE_ENV === 'development') {
                    console.log(`FPM Auto-calculated: ${spm} SPM × ${length}" ÷ 12 = ${calculatedFpm} FPM`);
                }
            }
        }
    }, [performanceData, spmPath, lengthPath, fpmPath, updatePerformanceData]);

    // Check if calculation is possible
    const spm = getNestedValue(performanceData, spmPath);
    const length = getNestedValue(performanceData, lengthPath);
    const canCalculate = spm && length && typeof spm === 'number' && typeof length === 'number';
    const fpm = getNestedValue(performanceData, fpmPath);

    if (!canCalculate) {
        return null; // Don't show anything if we can't calculate
    }

    return (
        <div className={`flex items-center gap-2 text-sm text-green-600 ${className}`}>
            <Calculator className="h-4 w-4" />
            <span>
                {label}: {fpm ? `${fpm} FPM` : 'Calculating...'}
            </span>
        </div>
    );
};

export default FpmCalculator;