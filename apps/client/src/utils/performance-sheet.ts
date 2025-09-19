import { debounce } from "lodash";
import React, { useCallback, useRef, useState } from "react";

import type { PerformanceData } from "@/contexts/performance.context";

import { useUpdateEntity } from "@/hooks/_base/use-update-entity";

export const DAYS_PER_WEEK_OPTIONS = [
  { value: "1", label: "1 Day" },
  { value: "2", label: "2 Days" },
  { value: "3", label: "3 Days" },
  { value: "4", label: "4 Days" },
  { value: "5", label: "5 Days" },
  { value: "6", label: "6 Days" },
  { value: "7", label: "7 Days" },
];

export const SHIFTS_PER_DAY_OPTIONS = [
  { value: "1", label: "1 Shift" },
  { value: "2", label: "2 Shifts" },
  { value: "3", label: "3 Shifts" },
];

export const LINE_APPLICATION_OPTIONS = [
  { value: "Press Feed", label: "Press Feed" },
  { value: "Cut to Length", label: "Cut to Length" },
  { value: "Standalone", label: "Standalone" },
];

export const EDGE_TYPE_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "both", label: "Both" },
];

export const LOADING_OPTIONS = [
  { value: "operatorSide", label: "Operator Side" },
  { value: "nonOperatorSide", label: "Non-Operator Side" },
];

export const PRESS_TYPE_OPTIONS = [
  { value: "mechanical", label: "Mechanical" },
  { value: "hydraulic", label: "Hydraulic" },
  { value: "servo", label: "Servo" },
];

export const DIE_TYPE_OPTIONS = [
  { value: "progressive", label: "Progressive" },
  { value: "transfer", label: "Transfer" },
  { value: "blanking", label: "Blanking" },
];

export const PRESS_APPLICATION_OPTIONS = [
  { value: "pressFeed", label: "Press Feed" },
  { value: "cutToLength", label: "Cut To Length" },
  { value: "standalone", label: "Standalone" },
];

export const VOLTAGE_OPTIONS = [
  { value: "120", label: "120V" },
  { value: "240", label: "240V" },
  { value: "480", label: "480V" },
  { value: "600", label: "600V" },
];

export const FEED_DIRECTION_OPTIONS = [
  { value: "Right to Left", label: "Right to Left" },
  { value: "Left to Right", label: "Left to Right" },
];

export const COIL_LOADING_OPTIONS = [
  { value: "Operator Side", label: "Operator Side" },
  { value: "Non-Operator Side", label: "Non-Operator Side" },
];

export const CONTROLS_LEVEL_OPTIONS = [
  { value: "Mini-Drive System", label: "Mini-Drive System" },
  { value: "Relay Machine", label: "Relay Machine" },
  { value: "SyncMaster", label: "SyncMaster" },
  { value: "IP Indexer Basic", label: "IP Indexer Basic" },
  { value: "Allen Bradley Basic", label: "Allen Bradley Basic" },
  { value: "SyncMaster Plus", label: "SyncMaster Plus" },
  { value: "IP Indexer Plus", label: "IP Indexer Plus" },
  { value: "Allen Bradley Plus", label: "Allen Bradley Plus" },
  { value: "Fully Automatic", label: "Fully Automatic" },
];

export const RFQ_TYPE_OF_LINE_OPTIONS = [
  { value: "Compact", label: "Compact" },
  { value: "Conventional", label: "Conventional" },
];

export const TYPE_OF_LINE_OPTIONS = [
  { value: "Compact", label: "Compact" },
  { value: "Compact CTL", label: "Compact CTL" },
  { value: "Conventional", label: "Conventional" },
  { value: "Conventional CTL", label: "Conventional CTL" },
  { value: "Pull Through", label: "Pull Through" },
  { value: "Pull Through Compact", label: "Pull Through Compact" },
  { value: "Pull Through CTL", label: "Pull Through CTL" },
  { value: "Feed", label: "Feed" },
  { value: "Feed-Pull Through", label: "Feed-Pull Through" },
  { value: "Feed-Pull Through-Shear", label: "Feed-Pull Through-Shear" },
  { value: "Feed-Shear", label: "Feed-Shear" },
  { value: "Straightener", label: "Straightener" },
  { value: "Straightener-Reel Combination", label: "Straightener-Reel Combination" },
  { value: "Reel-Motorized", label: "Reel-Motorized" },
  { value: "Reel-Pull Off", label: "Reel-Pull Off" },
  { value: "Threading Table", label: "Threading Table" },
  { value: "Other", label: "Other" },
];

export const PASSLINE_OPTIONS = [
  { value: "none", label: "None" },
  { value: "37", label: "37\"" },
  { value: "39", label: "39\"" },
  { value: "40", label: "40\"" },
  { value: "40.5", label: "40.5\"" },
  { value: "41", label: "41\"" },
  { value: "41.5", label: "41.5\"" },
  { value: "42", label: "42\"" },
  { value: "43", label: "43\"" },
  { value: "43.625", label: "43.625\"" },
  { value: "44", label: "44\"" },
  { value: "45", label: "45\"" },
  { value: "45.5", label: "45.5\"" },
  { value: "46", label: "46\"" },
  { value: "46.5", label: "46.5\"" },
  { value: "47", label: "47\"" },
  { value: "47.4", label: "47.4\"" },
  { value: "47.5", label: "47.5\"" },
  { value: "48", label: "48\"" },
  { value: "48.5", label: "48.5\"" },
  { value: "49", label: "49\"" },
  { value: "49.5", label: "49.5\"" },
  { value: "50", label: "50\"" },
  { value: "50.5", label: "50.5\"" },
  { value: "50.75", label: "50.75\"" },
  { value: "51", label: "51\"" },
  { value: "51.5", label: "51.5\"" },
  { value: "51.75", label: "51.75\"" },
  { value: "52", label: "52\"" },
  { value: "52.25", label: "52.25\"" },
  { value: "52.5", label: "52.5\"" },
  { value: "53", label: "53\"" },
  { value: "54", label: "54\"" },
  { value: "54.5", label: "54.5\"" },
  { value: "54.75", label: "54.75\"" },
  { value: "55", label: "55\"" },
  { value: "55.25", label: "55.25\"" },
  { value: "55.5", label: "55.5\"" },
  { value: "55.75", label: "55.75\"" },
  { value: "56", label: "56\"" },
  { value: "56.5", label: "56.5\"" },
  { value: "57", label: "57\"" },
  { value: "58", label: "58\"" },
  { value: "58.25", label: "58.25\"" },
  { value: "59", label: "59\"" },
  { value: "59.5", label: "59.5\"" },
  { value: "60", label: "60\"" },
  { value: "60.5", label: "60.5\"" },
  { value: "61", label: "61\"" },
  { value: "62", label: "62\"" },
  { value: "62.5", label: "62.5\"" },
  { value: "63", label: "63\"" },
  { value: "64", label: "64\"" },
  { value: "64.5", label: "64.5\"" },
  { value: "65", label: "65\"" },
  { value: "66", label: "66\"" },
  { value: "66.5", label: "66.5\"" },
  { value: "67", label: "67\"" },
  { value: "70", label: "70\"" },
  { value: "72", label: "72\"" },
  { value: "75", label: "75\"" },
  { value: "76", label: "76\"" },
];

export const ROLL_TYPE_OPTIONS = [
  { value: "7 Roll Str. Backbend", label: "7 Roll Str. Backbend" },
  { value: "9 Roll Str. Backbend", label: "9 Roll Str. Backbend" },
  { value: "11 Roll Str. Backbend", label: "11 Roll Str. Backbend" },
];

export const REEL_BACKPLATE_OPTIONS = [
  { value: "Standard Backplate", label: "Standard Backplate" },
  { value: "Full OD Backplate", label: "Full OD Backplate" },
];

export const REEL_STYLE_OPTIONS = [
  { value: "Single Ended", label: "Single Ended" },
  { value: "Double Ended", label: "Double Ended" },
];

export const REEL_HORSEPOWER_OPTIONS = [
  { value: 3, label: "3 HP" },
  { value: 5, label: "5 HP" },
];

export const MATERIAL_TYPE_OPTIONS = [
  { value: "Aluminum", label: "Aluminum" },
  { value: "Galvanized", label: "Galvanized" },
  { value: "HS Steel", label: "HS Steel" },
  { value: "Hot Rolled Steel", label: "Hot Rolled Steel" },
  { value: "Dual Phase", label: "Dual Phase" },
  { value: "Cold Rolled Steel", label: "Cold Rolled Steel" },
  { value: "Sainless Steel", label: "Stainless Steel" },
  { value: "Titanium", label: "Titanium" },
  { value: "Brass", label: "Brass" },
  { value: "Beryl Copper", label: "Beryl Copper" },
];

export const YES_NO_OPTIONS = [
  { value: "No", label: "No" },
  { value: "Yes", label: "Yes" },
];

export const REEL_MODEL_OPTIONS = [
  { value: "CPR-040", label: "CPR-040" },
  { value: "CPR-060", label: "CPR-060" },
  { value: "CPR-080", label: "CPR-080" },
  { value: "CPR-100", label: "CPR-100" },
  { value: "CPR-150", label: "CPR-150" },
  { value: "CPR-200", label: "CPR-200" },
  { value: "CPR-300", label: "CPR-300" },
  { value: "CPR-400", label: "CPR-400" },
  { value: "CPR-500", label: "CPR-500" },
  { value: "CPR-600", label: "CPR-600" },
];

export const REEL_WIDTH_OPTIONS = [
  { value: "24", Label: "24" },
  { value: "30", Label: "30" },
  { value: "36", Label: "36" },
  { value: "42", Label: "42" },
  { value: "48", Label: "48" },
  { value: "54", Label: "54" },
  { value: "60", Label: "60" },
];

export const BACKPLATE_DIAMETER_OPTIONS = [
  { value: "27", Label: "27" },
  { value: "72", Label: "72" },
];

export const HYDRAULIC_THREADING_DRIVE_OPTIONS = [
  { value: "22 cu in (D-12689)", label: "22 cu in (D-12689)" },
  { value: "38 cu in (D-13374)", label: "38 cu in (D-13374)" },
  { value: "60 cu in (D-13374)", label: "60 cu in (D-13374)" },
  { value: "60 cu in (D-13382)", label: "60 cu in (D-13382)" },
];

export const HOLD_DOWN_ASSY_OPTIONS = [
  { value: "SD", label: "SD" },
  { value: "SD_MOTORIZED", label: "SD_MOTORIZED" },
  { value: "MD", label: "MD" },
  { value: "HD_SINGLE", label: "HD_SINGLE" },
  { value: "HD_DUAL", label: "HD_DUAL" },
  { value: "XD", label: "XD" },
  { value: "XXD", label: "XXD" },
];

export const HOLD_DOWN_CYLINDER_OPTIONS = [
  { value: "hydraulic", label: "Hydraulic" },
];

export const BRAKE_MODEL_OPTIONS = [
  { value: "Single Stage", label: "Single Stage" },
  { value: "Double Stage", label: "Double Stage" },
  { value: "Triple Stage", label: "Triple Stage" },
  { value: "Failsafe - Single Stage", label: "Failsafe - Single Stage" },
  { value: "Failsafe - Double Stage", label: "Failsafe - Double Stage" },
];

export const BRAKE_QUANTITY_OPTIONS = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
];

export const PAYOFF_OPTIONS = [
  { value: "TOP", label: "TOP" },
  { value: "BOTTOM", label: "BOTTOM" },
];

export const STR_MODEL_OPTIONS = [
  { value: "CPPS-250", label: "CPPS-250" },
  { value: "CPPS-306", label: "CPPS-306" },
  { value: "CPPS-350", label: "CPPS-350" },
  { value: "CPPS-406", label: "CPPS-406" },
  { value: "CPPS-507", label: "CPPS-507" },
  { value: "SPGPS-810", label: "SPGPS-810" },
];

export const STR_WIDTH_OPTIONS = [
  { value: "24", label: "24\"" },
  { value: "30", label: "30\"" },
  { value: "36", label: "36\"" },
  { value: "42", label: "42\"" },
  { value: "48", label: "48\"" },
  { value: "54", label: "54\"" },
  { value: "60", label: "60\"" },
  { value: "66", label: "66\"" },
  { value: "72", label: "72\"" },
];

export const STR_HORSEPOWER_OPTIONS = [
  { value: "20", label: "20 HP" },
  { value: "25", label: "25 HP" },
  { value: "30", label: "30 HP" },
  { value: "40", label: "40 HP" },
  { value: "50", label: "50 HP" },
];

export const STR_FEED_RATE_OPTIONS = [
  { value: "80", label: "80 FPM" },
  { value: "100", label: "100 FPM" },
  { value: "120", label: "120 FPM" },
  { value: "140", label: "140 FPM" },
  { value: "160", label: "160 FPM" },
  { value: "200", label: "200 FPM" },
];

export const FEED_MODEL_OPTIONS = [
  { value: "sigma-v-feed", label: "Sigma 5 Feed" },
  { value: "sigma-v-straightener", label: "Sigma 5 Feed Pull Thru" },
  { value: "allen-bradley", label: "Allen Bradley" },
];

export const SIGMA_5_FEED_MODEL_OPTIONS = [
  { value: "CPRF-S1", label: "CPRF-S1" },
  { value: "CPRF-S1 PLUS", label: "CPRF-S1 PLUS" },
  { value: "CPRF-S2", label: "CPRF-S2" },
  { value: "CPRF-S2 PLUS", label: "CPRF-S2 PLUS" },
  { value: "CPRF-S3", label: "CPRF-S3" },
  { value: "CPRF-S3 PLUS", label: "CPRF-S3 PLUS" },
  { value: "CPRF-S4", label: "CPRF-S4" },
  { value: "CPRF-S4 PLUS", label: "CPRF-S4 PLUS" },
  { value: "CPRF-S5", label: "CPRF-S5" },
  { value: "CPRF-6", label: "CPRF-6" },
  { value: "CPRF-7", label: "CPRF-7" },
  { value: "CPRF-8", label: "CPRF-8" },
];

export const SIGMA_5_PULLTHRU_FEED_MODEL_OPTIONS = [
  { value: "CPRF-S1 ES", label: "CPRF-S1 ES" },
  { value: "CPRF-S1 ES PLUS", label: "CPRF-S1 ES PLUS" },
  { value: "CPRF-S2 ES", label: "CPRF-S2 ES" },
  { value: "CPRF-S2 ES PLUS", label: "CPRF-S2 ES PLUS" },
  { value: "CPRF-S3 ES", label: "CPRF-S3 ES" },
  { value: "CPRF-S3 RS", label: "CPRF-S3 RS" },
  { value: "CPRF-S3 RS PLUS", label: "CPRF-S3 RS PLUS" },
  { value: "CPRF-S4 HS", label: "CPRF-S4 HS" },
  { value: "CPRF-S4 HS PLUS", label: "CPRF-S4 HS PLUS" },
  { value: "CPRF-S4 RS", label: "CPRF-S4 RS" },
  { value: "CPRF-S4 RS PLUS", label: "CPRF-S4 RS PLUS" },
  { value: "CPRF-S5-350", label: "CPRF-S5-350" },
  { value: "CPRF-S6-350", label: "CPRF-S6-350" },
  { value: "CPRF-S6-500", label: "CPRF-S6-500" },
  { value: "CPRF-S7-350", label: "CPRF-S7-350" },
  { value: "CPRF-S7-500", label: "CPRF-S7-500" },
  { value: "CPRF-S8-500", label: "CPRF-S8-500" },
];

export const ALLEN_BRADLEY_FEED_MODEL_OPTIONS = [
  { value: "CPRF-S1 MPL", label: "CPRF-S1 MPL" },
  { value: "CPRF-S2 MPL", label: "CPRF-S2 MPL" },
  { value: "CPRF-S3 MPL", label: "CPRF-S3 MPL" },
  { value: "CPRF-S3 MPM", label: "CPRF-S3 MPM" },
  { value: "CPRF-S4 MPL", label: "CPRF-S4 MPL" },
  { value: "CPRF-S5 MPL", label: "CPRF-S5 MPL" },
  { value: "CPRF-S6 MPL", label: "CPRF-S6 MPL" },
  { value: "CPRF-S7 MPL", label: "CPRF-S7 MPL" },
  { value: "CPRF-S8 MPL", label: "CPRF-S8 MPL" },
];

export const MACHINE_WIDTH_OPTIONS = [
  { value: "18", label: "18" },
  { value: "24", label: "24" },
  { value: "30", label: "30" },
  { value: "36", label: "36" },
  { value: "42", label: "42" },
  { value: "48", label: "48" },
  { value: "54", label: "54" },
  { value: "60", label: "60" },
];

export const STRAIGHTENER_ROLLS_OPTIONS = [
  { value: "5", label: "5 Rolls" },
  { value: "7", label: "7 Rolls" },
];

function validateField(name: string, value: any): string | null {
  if (name === "referenceNumber" && !value?.trim()) {
    return "Reference number is required";
  }
  if (name === "common.customer" && !value?.trim()) {
    return "Customer name is required";
  }
  if (name.includes("email") && value && !/\S[^\s@]*@\S+\.\S+/.test(value)) {
    return "Invalid email format";
  }
  if (name.includes("phone") && value && !/^\+?[\d\s\-()]+$/.test(value)) {
    return "Invalid phone format";
  }
  if (name.includes("zip") && value && !/^\d{5}(-\d{4})?$/.test(value)) {
    return "Invalid ZIP code format";
  }
  return null;
}

// Helper to safely update nested object properties without replacing existing data
function setNestedValue(obj: any, path: string, value: any) {
  const keys = path.split(".");
  const result = { ...obj }; // Shallow copy of root
  let current = result;

  // Navigate to the parent, creating shallow copies along the way
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];

    // If the property doesn't exist or isn't an object, create new object
    if (!current[key] || typeof current[key] !== "object") {
      current[key] = {};
    }
    else {
      // Create shallow copy to maintain immutability
      current[key] = { ...current[key] };
    }

    current = current[key];
  }

  // Set the final value
  current[keys[keys.length - 1]] = value;

  return result;
}

function deepMerge<T>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (sourceValue && typeof sourceValue === "object" && !Array.isArray(sourceValue)
        && targetValue && typeof targetValue === "object" && !Array.isArray(targetValue)) {
        result[key] = deepMerge(targetValue, sourceValue);
      }
      else if (sourceValue !== undefined) {
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

export function usePerformanceDataService(initialData: PerformanceData, performanceSheetId: string | undefined, isEditing: boolean) {
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
      if (!performanceSheetId || !isEditing)
        return;

      try {
        console.log("=== PERFORMANCE DATA SERVICE SAVE ===");
        const updatedData = JSON.parse(JSON.stringify(localDataRef.current));
        console.log("1. Sending data to backend:", JSON.stringify(updatedData, null, 2));

        const response = await updateEntity(performanceSheetId, { data: updatedData });
        console.log("2. Backend response:", response);

        // Handle calculated values from backend - merge the entire response
        if (response) {
          setLocalData((prevData) => {
            const merged = deepMerge(prevData, response);
            console.log("3. Merged local data:", merged);
            return merged;
          });
        }

        setLastSaved(new Date());
        setIsDirty(false);
        pendingChangesRef.current = {};

        // Clear any general errors on successful save
        setFieldErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors._general;
          return newErrors;
        });
      }
      catch (error) {
        console.error("Error saving performance data:", error);
        setFieldErrors(prev => ({
          ...prev,
          _general: "Failed to save changes. Please try again.",
        }));
      }
    }, 1000),
    [performanceSheetId, updateEntity, isEditing],
  );

  // Change handler for form fields
  const handleFieldChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    if (!isEditing)
      return;

    console.log("Field change detected:", e.target.name, e.target.value);
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    const actualValue = type === "checkbox" ? checked : value;

    // Clear field error
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
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
    setLocalData((prevData) => {
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
    if (!performanceSheetId || !isEditing)
      return;

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
    }
    catch (error) {
      console.error("Error saving performance data immediately:", error);
      setFieldErrors(prev => ({
        ...prev,
        _general: "Failed to save changes. Please try again.",
      }));
      throw error;
    }
  }, [performanceSheetId, updateEntity, isEditing]);

  // Update specific field programmatically
  const updateField = useCallback((fieldPath: string, value: any) => {
    if (!isEditing)
      return;

    setLocalData(prevData => setNestedValue(prevData, fieldPath, value));
    pendingChangesRef.current[fieldPath] = value;
    setIsDirty(true);
    debouncedSave();
  }, [isEditing, debouncedSave]);

  // Get field value by path
  const getFieldValue = useCallback((fieldPath: string) => {
    const keys = fieldPath.split(".");
    let current = localData;

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = (current as any)[key];
      }
      else {
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
    error: updateError,
  };

  return {
    state,
    handleFieldChange,
    saveImmediately,
    updateField,
    resetData,
    getFieldValue,
    hasFieldError,
    getFieldError,
    hasPendingChanges: isDirty,
    isLoading: updateLoading,
  };
}

export type PerformanceDataService = ReturnType<typeof usePerformanceDataService>;

// The new summary report structure
export interface ISummaryReportData {
  AirClutch?: boolean | string;
  BackplateDiameter?: number | string;
  BrakeModel?: string;
  BrakeQuantity?: number | string;
  ControlsLevel?: string;
  Customer?: string;
  Date?: string;
  FeedAccel?: number | string;
  FeedAngle1?: string;
  FeedAngle2?: string;
  FeedAngleTable?: string;
  FeedApplication?: string;
  FeedControls?: string;
  FeedDirection?: string;
  FeedFullWidthRolls?: boolean | string;
  FeedLoopPit?: boolean | string;
  FeedMaxVelocity?: number | string;
  FeedModel?: string;
  FeedPullThruPinchRolls?: number | string;
  FeedPullThruStrRolls?: number | string;
  FeedRatio?: number | string;
  FeedWidth?: number | string;
  HoldDownAssembly?: string;
  HoldDownCylinder?: string;
  HoldDownPressure?: number | string;
  HydraulicThreadDrive?: string;
  LightGuage?: boolean | string;
  MaterialWidth?: number | string;
  MatlSpecsTable?: string;
  MotorizedReelModel?: string;
  MotorizedReelWidth?: number | string;
  NonMarking?: boolean | string;
  Passline?: string;
  PressBedLength?: number | string;
  ReelAcceleration?: number | string;
  ReelBackplate?: number | string;
  ReedDriveHP?: number | string;
  ReelModel?: string;
  ReelMotorized?: string;
  ReelRegen?: boolean | string;
  ReelSpeed?: number | string;
  ReelStyle?: string;
  Reference?: string;
  rfqAddress?: string;
  rfqBackplate?: boolean | string;
  rfqCity?: string;
  rfqCoilCar?: boolean | string;
  rfqCompany?: string;
  rfqCosmetic?: boolean | string;
  rfqCountry?: string;
  rfqDealer?: string;
  rfqDealerSalesman?: string;
  rfqEmail?: string;
  rfqPhone?: string;
  rfqPosition?: string;
  rfqRequireGuarding?: boolean | string;
  rfqState?: string;
  rfqVoltage?: number | string;
  rfqZipCode?: string;
  StrAcceleration?: number | string;
  StrBackupRolls?: string;
  StrFeedRate?: number | string;
  StrHP?: number | string;
  StrModel?: string;
  StrPayoff?: string;
  StrRollType?: string;
  StrWidth?: number | string;
  TypeOfLine?: string;
}

export function mapPerformanceToSummary(perf: PerformanceData): ISummaryReportData {
  const matlSpecsTableString = {
    coilWidth: perf?.common?.material?.coilWidth,
    coilWeight: perf?.common?.material?.coilWeight,
    materialThickness: perf?.common?.material?.materialThickness,
    materialType: perf?.common?.material?.materialType,
    yieldStrength: perf?.common?.material?.maxYieldStrength,
    materialTensile: perf?.common?.material?.maxTensileStrength,
    maxFpm: perf?.common?.material?.reqMaxFPM,
    minBendRadius: perf?.materialSpecs?.material?.minBendRadius,
    minLoopLength: perf?.materialSpecs?.material?.minLoopLength,
    coilOD: perf?.common?.coil?.maxCoilOD,
    coilID: perf?.common?.coil?.coilID,
    coilODCalculated: perf?.materialSpecs?.material?.calculatedCoilOD,
  }.toString();

  return {
    AirClutch: perf?.tddbhd?.reel?.threadingDrive?.airClutch,
    BackplateDiameter: perf?.common?.equipment?.reel?.backplate?.diameter,
    BrakeModel: perf?.tddbhd?.reel?.dragBrake?.model,
    BrakeQuantity: perf?.tddbhd?.reel?.dragBrake?.quantity,
    ControlsLevel: perf?.common?.equipment?.feed?.controlsLevel,
    Customer: perf?.common?.customer,
    Date: perf?.rfq?.dates?.date,
    FeedAccel: perf?.feed?.feed?.accelerationRate,
    FeedAngle1: perf?.feed?.feed?.feedAngle1?.toString(),
    FeedAngle2: perf?.feed?.feed?.feedAngle2?.toString(),
    FeedAngleTable: perf?.feed?.feed?.tableValues?.toString(),
    FeedApplication: perf?.feed?.feed?.application,
    FeedControls: perf?.common?.equipment?.feed?.controlsLevel,
    FeedDirection: perf?.common?.equipment?.feed?.direction,
    FeedFullWidthRolls: perf?.feed?.feed?.fullWidthRolls,
    FeedLoopPit: perf?.common?.equipment?.feed?.loopPit,
    FeedMaxVelocity: perf?.common?.equipment?.feed?.maximumVelocity,
    FeedModel: perf?.common?.equipment?.feed?.model,
    FeedPullThruPinchRolls: perf?.feed?.feed?.pullThru?.pinchRolls,
    FeedPullThruStrRolls: perf?.feed?.feed?.pullThru?.straightenerRolls,
    FeedRatio: perf?.feed?.feed?.ratio,
    FeedWidth: perf?.feed?.feed?.machineWidth,
    HoldDownAssembly: perf?.tddbhd?.reel?.holddown?.assy,
    HoldDownCylinder: perf?.tddbhd?.reel?.holddown?.cylinder,
    HoldDownPressure: perf?.tddbhd?.reel?.holddown?.cylinderPressure,
    HydraulicThreadDrive: perf?.tddbhd?.reel?.threadingDrive?.hydThreadingDrive,
    LightGuage: perf?.common?.equipment?.feed?.lightGuageNonMarking,
    MaterialWidth: perf?.common?.equipment?.straightener?.width,
    MatlSpecsTable: matlSpecsTableString,
    MotorizedReelModel: perf?.common?.equipment?.reel?.model,
    MotorizedReelWidth: perf?.common?.equipment?.reel?.width,
    NonMarking: perf?.common?.equipment?.feed?.nonMarking,
    Passline: perf?.common?.equipment?.feed?.passline,
    PressBedLength: perf?.common?.press?.bedLength,
    ReelAcceleration: perf?.reelDrive?.reel?.motorization?.accelRate,
    ReelBackplate: perf?.common?.equipment?.reel?.backplate?.diameter,
    ReedDriveHP: perf?.reelDrive?.reel?.motorization?.driveHorsepower,
    ReelModel: perf?.common?.equipment?.reel?.model,
    ReelMotorized: perf?.reelDrive?.reel?.motorization?.isMotorized,
    ReelRegen: perf?.reelDrive?.reel?.motorization?.regenRequired,
    ReelSpeed: perf?.reelDrive?.reel?.motorization?.speed,
    ReelStyle: perf?.materialSpecs?.reel?.style,
    Reference: perf?.referenceNumber,
    rfqAddress: perf?.common?.customerInfo?.streetAddress,
    rfqBackplate: perf?.materialSpecs?.reel?.backplate?.type,
    rfqCity: perf?.common?.customerInfo?.city,
    rfqCoilCar: perf?.rfq?.coil?.requireCoilCar,
    rfqCompany: perf?.common?.customer,
    rfqCosmetic: perf?.rfq?.runningCosmeticMaterial,
    rfqCountry: perf?.common?.customerInfo?.country,
    rfqDealer: perf?.common?.customerInfo?.dealerName,
    rfqDealerSalesman: perf?.common?.customerInfo?.dealerSalesman,
    rfqEmail: perf?.common?.customerInfo?.email,
    rfqPhone: perf?.common?.customerInfo?.phoneNumber,
    rfqPosition: perf?.common?.customerInfo?.position,
    rfqRequireGuarding: perf?.rfq?.requireGuarding,
    rfqState: perf?.common?.customerInfo?.state,
    rfqVoltage: perf?.rfq?.voltageRequired,
    rfqZipCode: perf?.common?.customerInfo?.zip?.toString(),
    StrAcceleration: perf?.strUtility?.straightener?.acceleration,
    StrBackupRolls: perf?.strUtility?.straightener?.required?.backupRollsCheck,
    StrFeedRate: perf?.strUtility?.straightener?.feedRate,
    StrHP: perf?.strUtility?.straightener?.horsepower,
    StrModel: perf?.common?.equipment?.straightener?.model,
    StrPayoff: perf?.strUtility?.straightener?.payoff,
    StrRollType: perf?.rollStrBackbend?.straightener?.rolls?.typeOfRoll,
    StrWidth: perf?.common?.equipment?.straightener?.width,
    TypeOfLine: perf?.common?.equipment?.feed?.typeOfLine,
  };
}
