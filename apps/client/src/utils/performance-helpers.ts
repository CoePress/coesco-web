/**
 * Utility functions for performance-related operations
 */

import { STATUS_VALUES, isRequiredCheckboxField } from "@/constants/performance";

/**
 * Determines the appropriate color based on status check result
 * @param status - The status value to check (usually "OK" or other)
 * @param successColor - Color to return for successful status
 * @param errorColor - Color to return for error status
 * @returns The appropriate color based on status
 */
export const getStatusColor = (
    status: string | undefined,
    successColor: string,
    errorColor: string
): string => {
    return status === STATUS_VALUES.OK ? successColor : errorColor;
};

/**
 * Gets status colors for multiple checks at once
 * @param checks - Object with status values
 * @param successColor - Color for successful status
 * @param errorColor - Color for error status
 * @returns Object with same keys but color values
 */
export const getStatusColors = <T extends Record<string, string | undefined>>(
    checks: T,
    successColor: string,
    errorColor: string
): Record<keyof T, string> => {
    const result = {} as Record<keyof T, string>;

    for (const [key, status] of Object.entries(checks)) {
        result[key as keyof T] = getStatusColor(status, successColor, errorColor);
    }

    return result;
};

/**
 * Checks if a value is empty according to performance sheet validation rules
 * @param value - The value to check
 * @returns True if the value is considered empty
 */
export const isEmpty = (value: unknown): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (typeof value === 'number') return false; // 0 is a valid value
    if (typeof value === 'boolean') return false; // Both true and false are valid
    return true;
};

/**
 * Gets a nested value from an object using dot notation
 * @param obj - The object to get the value from
 * @param path - The dot-separated path to the value
 * @returns The value at the path, or undefined if not found
 */
export const getNestedValue = (obj: any, path: string): any => {
    if (!obj || !path) return undefined;

    const keys = path.split('.');
    let result = obj;

    for (const key of keys) {
        if (result === null || result === undefined || typeof result !== 'object') {
            return undefined;
        }
        result = result[key];
    }

    return result;
};

/**
 * Creates a deep nested object path with a value
 * @param path - Dot-separated path string (e.g., "feed.feed.matchCheck")
 * @param value - Value to set at the path
 * @returns Object with the nested structure
 */
export const createNestedPath = (path: string, value: any): Record<string, any> => {
    const keys = path.split('.');
    const result: Record<string, any> = {};
    let current = result;

    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        current[key] = {};
        current = current[key];
    }

    current[keys[keys.length - 1]] = value;
    return result;
};

/**
 * Checks if a required field is empty according to performance validation rules
 * @param value - The field value to check
 * @param fieldName - The field name for checkbox validation
 * @returns True if the required field is considered empty
 */
export const isRequiredFieldEmpty = (value: unknown, fieldName: string): boolean => {
    // Handle different types of empty values
    if (value === null || value === undefined) {
        return true;
    }

    // For strings (including empty strings)
    if (typeof value === 'string') {
        return value.trim() === '';
    }

    // For numbers, consider 0 as empty for required fields (needs user input)
    if (typeof value === 'number') {
        return value === 0;
    }

    // For checkboxes (boolean values), we need to check if they're explicitly set
    // Since these are required checkboxes, we expect them to be true
    if (typeof value === 'boolean') {
        // For required checkboxes, we consider false as "empty" since they should be checked
        if (isRequiredCheckboxField(fieldName)) {
            return value === false;
        }
        return false; // For other boolean fields, false is acceptable
    }

    return false;
};

/**
 * Gets the background color for a required field based on its value
 * @param fieldName - The field name to check
 * @param requiredFields - Array of required field names
 * @param getFieldValue - Function to get field value
 * @returns Background color string or undefined
 */
export const getRequiredFieldBackgroundColor = (
    fieldName: string,
    requiredFields: string[],
    getFieldValue: (fieldName: string) => unknown
): "error" | "success" | "warning" | "info" | undefined => {
    if (!requiredFields.includes(fieldName)) {
        return undefined; // Not a required field
    }

    // Required checkboxes should always be green to indicate they are required
    if (isRequiredCheckboxField(fieldName)) {
        return 'success'; // Always green for required checkboxes
    }

    const value = getFieldValue(fieldName);
    if (isRequiredFieldEmpty(value, fieldName)) {
        return 'error'; // Red background for empty required fields
    }

    return 'success'; // Green background for filled required fields
};
