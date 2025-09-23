/**
 * Performance Validation Context - Handles validation state
 * Separated for better performance and organization
 */

import React, { createContext, useContext, useReducer, useCallback, ReactNode, useEffect } from 'react';
import { PerformanceValidationState, PerformanceValidationAction } from './types';
import { usePerformanceData } from './data.context';
import { getNestedValue, isEmpty } from '../../utils/performance-helpers';

// Initial validation state
const initialValidationState: PerformanceValidationState = {
    fieldErrors: {},
    isValid: true,
    validationInProgress: false,
};

// Validation reducer
function performanceValidationReducer(
    state: PerformanceValidationState,
    action: PerformanceValidationAction
): PerformanceValidationState {
    switch (action.type) {
        case 'SET_FIELD_ERROR':
            return {
                ...state,
                fieldErrors: {
                    ...state.fieldErrors,
                    [action.payload.field]: action.payload.error,
                },
                isValid: false,
            };
        case 'CLEAR_FIELD_ERROR':
            const { [action.payload]: removed, ...remainingErrors } = state.fieldErrors;
            return {
                ...state,
                fieldErrors: remainingErrors,
                isValid: Object.keys(remainingErrors).length === 0,
            };
        case 'SET_ALL_ERRORS':
            return {
                ...state,
                fieldErrors: action.payload,
                isValid: Object.keys(action.payload).length === 0,
            };
        case 'CLEAR_ALL_ERRORS':
            return {
                ...state,
                fieldErrors: {},
                isValid: true,
            };
        case 'SET_VALIDATION_IN_PROGRESS':
            return {
                ...state,
                validationInProgress: action.payload,
            };
        default:
            return state;
    }
}

// Required fields list
const REQUIRED_FIELDS = [
    'referenceNumber',
    'rfq.dates.date',
    'common.customer',
    'common.customerInfo.state',
    'common.customerInfo.streetAddress',
    'common.customerInfo.zip',
    'common.customerInfo.city',
    'common.customerInfo.country',
    'common.customerInfo.contactName',
    'common.customerInfo.position',
    'common.customerInfo.phoneNumber',
    'common.customerInfo.email',
    'common.customerInfo.dealerName',
    'common.customerInfo.dealerSalesman',
    'rfq.dates.idealDeliveryDate',
    'rfq.dates.decisionDate',
    'feed.feed.application',
    'common.equipment.feed.typeOfLine',
    'feed.feed.pullThru.isPullThru',
    'rfq.runningCosmeticMaterial',
    'common.coil.maxCoilWidth',
    'common.coil.minCoilWidth',
    'common.coil.maxCoilOD',
    'common.coil.coilID',
    'common.coil.maxCoilWeight',
    'rfq.coil.slitEdge',
    'rfq.coil.millEdge',
    'rfq.coil.requireCoilCar',
    'rfq.coil.runningOffBackplate',
    'rfq.coil.requireRewinding',
    'rfq.coil.changeTimeConcern',
    'rfq.coil.loading',
    'common.material.materialThickness',
    'common.material.coilWidth',
    'common.material.materialType',
    'common.material.maxYieldStrength',
    'rfq.press.maxSPM',
    'rfq.dies.transferDies',
    'rfq.dies.progressiveDies',
    'rfq.dies.blankingDies',
    'common.feedRates.average.length',
    'common.feedRates.average.spm',
    'common.feedRates.average.fpm',
    'common.feedRates.max.length',
    'common.feedRates.max.spm',
    'common.feedRates.max.fpm',
    'common.feedRates.min.length',
    'common.feedRates.min.spm',
    'common.feedRates.min.fpm',
    'rfq.voltageRequired',
    'rfq.equipmentSpaceLength',
    'rfq.equipmentSpaceWidth',
    'rfq.obstructions',
    'common.equipment.feed.direction',
    'rfq.requireGuarding',
];

// Context interface
interface PerformanceValidationContextType {
    state: PerformanceValidationState;
    dispatch: React.Dispatch<PerformanceValidationAction>;
    validateField: (fieldName: string, value: any) => string | null;
    validateAllFields: () => void;
    getFieldError: (fieldName: string) => string | undefined;
    hasFieldError: (fieldName: string) => boolean;
}

const PerformanceValidationContext = createContext<PerformanceValidationContextType | undefined>(undefined);

// Provider component
export const PerformanceValidationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(performanceValidationReducer, initialValidationState);
    const { state: dataState } = usePerformanceData();

    // Validate a single field
    const validateField = useCallback((fieldName: string, value: any): string | null => {
        if (REQUIRED_FIELDS.includes(fieldName) && isEmpty(value)) {
            return `${fieldName} is required`;
        }

        // Add custom validation rules here
        if (fieldName === 'common.customerInfo.email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                return 'Please enter a valid email address';
            }
        }

        if (fieldName === 'common.customerInfo.zip' && value) {
            if (isNaN(Number(value)) || value <= 0) {
                return 'Please enter a valid zip code';
            }
        }

        return null;
    }, []);

    // Validate all fields
    const validateAllFields = useCallback(() => {
        dispatch({ type: 'SET_VALIDATION_IN_PROGRESS', payload: true });

        const errors: Record<string, string> = {};

        REQUIRED_FIELDS.forEach(fieldName => {
            const value = getNestedValue(dataState.data, fieldName);
            const error = validateField(fieldName, value);
            if (error) {
                errors[fieldName] = error;
            }
        });

        dispatch({ type: 'SET_ALL_ERRORS', payload: errors });
        dispatch({ type: 'SET_VALIDATION_IN_PROGRESS', payload: false });
    }, [dataState.data, validateField, dispatch]);

    // Auto-validate on data changes
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            validateAllFields();
        }, 500); // Debounce validation

        return () => clearTimeout(timeoutId);
    }, [dataState.data, validateAllFields]);

    const getFieldError = useCallback((fieldName: string): string | undefined => {
        return state.fieldErrors[fieldName];
    }, [state.fieldErrors]);

    const hasFieldError = useCallback((fieldName: string): boolean => {
        return Boolean(state.fieldErrors[fieldName]);
    }, [state.fieldErrors]);

    const value: PerformanceValidationContextType = {
        state,
        dispatch,
        validateField,
        validateAllFields,
        getFieldError,
        hasFieldError,
    };

    return (
        <PerformanceValidationContext.Provider value={value}>
            {children}
        </PerformanceValidationContext.Provider>
    );
};

// Hook to use the context
export const usePerformanceValidation = () => {
    const context = useContext(PerformanceValidationContext);
    if (!context) {
        throw new Error('usePerformanceValidation must be used within a PerformanceValidationProvider');
    }
    return context;
};
