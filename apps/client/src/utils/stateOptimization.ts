// State Management Optimization Utilities
import React, { useCallback, useMemo, useRef } from 'react';
import { PerformanceData } from '@/contexts/performance.context';

// Optimized field update function to reduce re-renders
export const useOptimizedFieldUpdate = (
    localData: PerformanceData,
    updateField: (path: string, value: any) => void
) => {
    return useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        // Optimize by checking if value actually changed
        const currentValue = getNestedValue(localData, name);
        let newValue: any = value;

        // Handle different input types
        if (type === 'number') {
            newValue = value === '' ? null : Number(value);
        } else if (type === 'checkbox') {
            newValue = (e.target as HTMLInputElement).checked;
        }

        // Only update if value changed to prevent unnecessary re-renders
        if (currentValue !== newValue) {
            updateField(name, newValue);
        }
    }, [localData, updateField]);
};

// Optimized field validation memoization
export const useOptimizedFieldValidation = (
    localData: PerformanceData,
    requiredFields: string[]
) => {
    return useMemo(() => {
        const validationMap = new Map<string, boolean>();

        requiredFields.forEach(field => {
            const value = getNestedValue(localData, field);
            validationMap.set(field, isEmpty(value));
        });

        return validationMap;
    }, [localData, requiredFields]);
};

// Optimized background color computation
export const useOptimizedBackgroundColors = (
    validationMap: Map<string, boolean>,
    theme: 'light' | 'dark'
) => {
    return useMemo(() => {
        const colorMap = new Map<string, string>();

        validationMap.forEach((isEmpty, field) => {
            if (isEmpty) {
                colorMap.set(field, theme === 'dark'
                    ? 'bg-red-900/20 border-red-500/50'
                    : 'bg-red-50 border-red-200'
                );
            } else {
                colorMap.set(field, theme === 'dark'
                    ? 'bg-green-900/20 border-green-500/50'
                    : 'bg-green-50 border-green-200'
                );
            }
        });

        return colorMap;
    }, [validationMap, theme]);
};

// Utility to get nested object values efficiently
const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
};

// Utility to check if value is empty
const isEmpty = (value: any): boolean => {
    return value === null || value === undefined || value === '';
};

// Debounced update hook for performance
export const useDebouncedUpdate = (
    callback: (value: any) => void,
    delay: number = 300
) => {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    return useCallback((value: any) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            callback(value);
        }, delay);
    }, [callback, delay]);
};
