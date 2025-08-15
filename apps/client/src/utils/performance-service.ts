import { useState, useRef, useCallback } from "react";
import { debounce } from "lodash";
import { PerformanceData } from "@/contexts/performance.context";
import { useUpdateEntity } from "@/hooks/_base/use-update-entity";
import React from "react";

// Validation schema
const validateField = (name: string, value: any): string | null => {
  if (name === "referenceNumber" && !value?.trim()) {
    return "Reference number is required";
  }
  if (name === "common.customer" && !value?.trim()) {
    return "Customer name is required";
  }
  if (name.includes("email") && value && !/\S+@\S+\.\S+/.test(value)) {
    return "Invalid email format";
  }
  if (name.includes("phone") && value && !/^\+?[\d\s\-\(\)]+$/.test(value)) {
    return "Invalid phone format";
  }
  if (name.includes("zip") && value && !/^\d{5}(-\d{4})?$/.test(value)) {
    return "Invalid ZIP code format";
  }
  return null;
};

// Helper to safely update nested object properties without replacing existing data
const setNestedValue = (obj: any, path: string, value: any) => {
  const keys = path.split(".");
  const result = { ...obj }; // Shallow copy of root
  let current = result;
  
  // Navigate to the parent, creating shallow copies along the way
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    
    // If the property doesn't exist or isn't an object, create new object
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    } else {
      // Create shallow copy to maintain immutability
      current[key] = { ...current[key] };
    }
    
    current = current[key];
  }
  
  // Set the final value
  current[keys[keys.length - 1]] = value;
  
  return result;
};

function deepMerge<T>(target: T, source: Partial<T>): T {
  const result = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      const targetValue = result[key];
      
      if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue) &&
          targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue)) {
        result[key] = deepMerge(targetValue, sourceValue);
      } else if (sourceValue !== undefined) {
        result[key] = sourceValue as T[typeof key];
      }
    }
  }
  
  return result;
}

export interface PerformanceDataServiceState {
  localData: PerformanceData;
  fieldErrors: Record<string, string>;
  isDirty: boolean;
  lastSaved: Date | null;
  isLoading: boolean;
  error: string | null;
}

export const usePerformanceDataService = (
  initialData: PerformanceData,
  performanceSheetId: string | undefined,
  isEditing: boolean
) => {
  const endpoint = `/performance/sheets`;
  const { updateEntity, loading: updateLoading, error: updateError } = useUpdateEntity(endpoint);

  // Local state management
  const [localData, setLocalData] = useState<PerformanceData>(initialData);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Refs for cleanup and debouncing
  const localDataRef = useRef(localData);
  const pendingChangesRef = useRef<Record<string, any>>({});

  // Update localDataRef whenever localData changes
  React.useEffect(() => {
    localDataRef.current = localData;
  }, [localData]);

  // Sync with prop data on initial load only
  React.useEffect(() => {
    if (initialData && initialData.referenceNumber && !localData.referenceNumber) {
      setLocalData(initialData);
    }
  }, [initialData, localData.referenceNumber]);

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async () => {
      if (!performanceSheetId || !isEditing) return;

      try {
        console.log("=== PERFORMANCE DATA SERVICE SAVE ===");
        const updatedData = JSON.parse(JSON.stringify(localDataRef.current));
        console.log("1. Sending data to backend:", JSON.stringify(updatedData, null, 2));
        
        const response = await updateEntity(performanceSheetId, { data: updatedData });
        console.log("2. Backend response:", response);
        
        // Handle calculated values from backend - merge the entire response
        if (response) {
          setLocalData(prevData => {
            const merged = deepMerge(prevData, response);
            console.log("3. Merged local data:", merged);
            return merged;
          });
        }

        setLastSaved(new Date());
        setIsDirty(false);
        pendingChangesRef.current = {};
        
        // Clear any general errors on successful save
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors._general;
          return newErrors;
        });
        
      } catch (error) {
        console.error('Error saving performance data:', error);
        setFieldErrors(prev => ({ 
          ...prev, 
          _general: 'Failed to save changes. Please try again.' 
        }));
      }
    }, 1000),
    [performanceSheetId, updateEntity, isEditing]
  );

  // Change handler for form fields
  const handleFieldChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    if (!isEditing) return;

    console.log("Field change detected:", e.target.name, e.target.value);
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    const actualValue = type === "checkbox" ? checked : value;

    // Clear field error
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Validate field
    const error = validateField(name, actualValue);
    if (error) {
      setFieldErrors(prev => ({ ...prev, [name]: error }));
      return;
    }

    // Update local state immediately
    setLocalData(prevData => {
      const processedValue = type === "checkbox" ? (actualValue ? "true" : "false") : actualValue;
      console.log("Setting nested value for:", name, "to", processedValue);

      return setNestedValue(prevData, name, processedValue);
    });

    // Track pending changes
    pendingChangesRef.current[name] = type === "checkbox" ? (actualValue ? "true" : "false") : actualValue;
    setIsDirty(true);

    debouncedSave();
  }, [isEditing, fieldErrors, debouncedSave]);

  // Manual save function (for immediate saves)
  const saveImmediately = useCallback(async () => {
    if (!performanceSheetId || !isEditing) return;

    try {
      const updatedData = JSON.parse(JSON.stringify(localDataRef.current));
      const response = await updateEntity(performanceSheetId, { data: updatedData });
      
      if (response) {
        setLocalData(prevData => deepMerge(prevData, response));
      }

      setLastSaved(new Date());
      setIsDirty(false);
      pendingChangesRef.current = {};
      
      return response;
    } catch (error) {
      console.error('Error saving performance data immediately:', error);
      setFieldErrors(prev => ({ 
        ...prev, 
        _general: 'Failed to save changes. Please try again.' 
      }));
      throw error;
    }
  }, [performanceSheetId, updateEntity, isEditing]);

  // Update specific field programmatically
  const updateField = useCallback((fieldPath: string, value: any) => {
    if (!isEditing) return;

    setLocalData(prevData => setNestedValue(prevData, fieldPath, value));
    pendingChangesRef.current[fieldPath] = value;
    setIsDirty(true);
    debouncedSave();
  }, [isEditing, debouncedSave]);

  // Get field value by path
  const getFieldValue = useCallback((fieldPath: string) => {
    const keys = fieldPath.split('.');
    let current = localData;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = (current as any)[key];
      } else {
        return undefined;
      }
    }
    
    return current;
  }, [localData]);

  // Reset to initial data
  const resetData = useCallback(() => {
    setLocalData(initialData);
    setFieldErrors({});
    setIsDirty(false);
    pendingChangesRef.current = {};
  }, [initialData]);

  // Check if field has error
  const hasFieldError = useCallback((fieldName: string) => {
    return !!fieldErrors[fieldName];
  }, [fieldErrors]);

  // Get field error message
  const getFieldError = useCallback((fieldName: string) => {
    return fieldErrors[fieldName];
  }, [fieldErrors]);

  // Service state object
  const state: PerformanceDataServiceState = {
    localData,
    fieldErrors,
    isDirty,
    lastSaved,
    isLoading: updateLoading,
    error: updateError
  };

  return {
    // State
    state,
    
    // Actions
    handleFieldChange,
    saveImmediately,
    updateField,
    resetData,
    
    // Getters
    getFieldValue,
    hasFieldError,
    getFieldError,
    
    // Computed values
    hasPendingChanges: isDirty,
    isLoading: updateLoading,
  };
};

// Export types for external use
export type PerformanceDataService = ReturnType<typeof usePerformanceDataService>;