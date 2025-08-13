import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { debounce } from "lodash";
import Input from "@/components/common/input";
import Select from "@/components/common/select";
import Checkbox from "@/components/common/checkbox";
import Text from "@/components/common/text";
import Card from "@/components/common/card";
import {
  FEED_DIRECTION_OPTIONS,
  CONTROLS_LEVEL_OPTIONS,
  TYPE_OF_LINE_OPTIONS,
  PASSLINE_OPTIONS,
  ROLL_TYPE_OPTIONS,
  REEL_BACKPLATE_OPTIONS,
  REEL_STYLE_OPTIONS,
  MATERIAL_TYPE_OPTIONS,
} from "@/utils/select-options";
import { PerformanceData } from "@/contexts/performance.context";
import { useUpdateEntity } from "@/hooks/_base/use-update-entity";
import { useGetEntity } from "@/hooks/_base/use-get-entity";

export interface MaterialSpecsProps {
  data: PerformanceData;
  isEditing: boolean;
}

// Validation schema
const validateField = (name: string, value: any): string | null => {
  if (name === "material.coilWidth" && value) {
    const numValue = Number(value);
    if (isNaN(numValue) || numValue <= 0) {
      return "Coil width must be a positive number";
    }
  }
  if (name === "material.materialThickness" && value) {
    const numValue = Number(value);
    if (isNaN(numValue) || numValue <= 0) {
      return "Material thickness must be a positive number";
    }
  }
  if ((name.includes("Strength") || name.includes("Weight")) && value) {
    const numValue = Number(value);
    if (isNaN(numValue) || numValue < 0) {
      return "Value must be a non-negative number";
    }
  }
  return null;
};

// Helper to safely update nested object properties
const setNestedValue = (obj: any, path: string, value: any) => {
  const keys = path.split(".");
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  
  current[keys[keys.length - 1]] = value;
};

const MaterialSpecs: React.FC<MaterialSpecsProps> = ({ data, isEditing }) => {
  const endpoint = `/performance/sheets`;
  const { loading, error } = useGetEntity(endpoint);
  const { updateEntity, loading: updateLoading, error: updateError } = useUpdateEntity(endpoint);
  const { id: performanceSheetId } = useParams();
  
  // Local state management
  const [localData, setLocalData] = useState<PerformanceData>(data);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Refs for cleanup and debouncing
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingChangesRef = useRef<Record<string, any>>({});

  // Sync with prop data on initial load only
  useEffect(() => {
    if (data && data.referenceNumber && !localData.referenceNumber) {
      setLocalData(data);
    }
  }, [data, localData.referenceNumber]);

  // Get coil width boundaries from the nested structure
  const coilWidthBounds = useMemo(() => {
    const min = Number(localData.common?.coil?.minCoilWidth) || undefined;
    const max = Number(localData.common?.coil?.maxCoilWidth) || undefined;
    return { min, max };
  }, [localData.common?.coil?.minCoilWidth, localData.common?.coil?.maxCoilWidth]);

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async (changes: Record<string, any>) => {
      if (!performanceSheetId || !isEditing) return;

      try {
        // Create a deep copy and apply all pending changes
        const updatedData = JSON.parse(JSON.stringify(localData));
        
        Object.entries(changes).forEach(([path, value]) => {
          setNestedValue(updatedData, path, value);
        });

        console.log("Saving Material Specs changes:", changes);
        
        const response = await updateEntity(performanceSheetId, { data: updatedData });
        
        // Handle calculated values from backend
        if (response?.data) {
          console.log("Updating calculated values from backend response");
          setLocalData(prevData => ({
            ...prevData,
            // Update calculated fields from backend response
            common: {
              material: {
                ...prevData.common?.material,
                minBendRadius: response.data.material?.minBendRadius || prevData.materialSpecs?.material?.minBendRadius,
                minLoopLength: response.data.material?.minLoopLength || prevData.materialSpecs?.material?.minLoopLength,
                calculatedCoilOD: response.data.material?.calculatedCoilOD || prevData.materialSpecs?.material?.calculatedCoilOD,
                feed: {
                  ...prevData.common?.equipment?.feed,
                  controls: response.data.feed?.controls || prevData.materialSpecs?.feed?.controls,
                },
              },
          }}));
        }

        setLastSaved(new Date());
        setIsDirty(false);
        pendingChangesRef.current = {};
        
      } catch (error) {
        console.error('Error saving Material Specs:', error);
        setFieldErrors(prev => ({ 
          ...prev, 
          _general: 'Failed to save changes. Please try again.' 
        }));
      }
    }, 1000),
    [performanceSheetId, updateEntity, isEditing, localData]
  );

  // Optimized change handler
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!isEditing) return;

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
      const newData = { ...prevData };
      const processedValue = type === "checkbox" ? (actualValue ? "true" : "false") : actualValue;
      
      // Handle nested paths directly
      setNestedValue(newData, name, processedValue);
      
      return newData;
    });

    // Track pending changes
    pendingChangesRef.current[name] = type === "checkbox" ? (actualValue ? "true" : "false") : actualValue;
    setIsDirty(true);

    // Debounce save
    debouncedSave(pendingChangesRef.current);
  }, [isEditing, fieldErrors, debouncedSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  // Customer and Date Section
  const customerDateSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Customer & Date
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Customer"
          name="common.customer"
          value={localData.common?.customer || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Date"
          name="rfq.dates.date"
          type="date"
          value={localData.rfq?.dates?.date || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData, handleChange, isEditing]);

  // Material Specifications Section
  const materialSpecsSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Material Specifications
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Input
          label="Coil Width (in)"
          name="common.material.coilWidth"
          value={localData.common?.material?.coilWidth?.toString() || ""}
          onChange={handleChange}
          type="number"
          min={coilWidthBounds.min}
          max={coilWidthBounds.max}
          error={fieldErrors["material.coilWidth"]}
          disabled={!isEditing}
        />
        <Input
          label="Coil Weight (Max)"
          name="common.coil.maxCoilWeight"
          value={localData.common?.coil?.maxCoilWeight?.toString() || ""}
          onChange={handleChange}
          type="number"
          error={fieldErrors["coil.maxCoilWeight"]}
          disabled={!isEditing}
        />
        <Input
          label="Material Thickness (in)"
          name="common.material.materialThickness"
          value={localData.common?.material?.materialThickness?.toString() || ""}
          onChange={handleChange}
          type="number"
          error={fieldErrors["material.materialThickness"]}
          disabled={!isEditing}
        />
        <Select
          label="Material Type"
          name="common.material.materialType"
          value={localData.common?.material?.materialType || ""}
          onChange={handleChange}
          options={MATERIAL_TYPE_OPTIONS}
          disabled={!isEditing}
        />
        <Input
          label="Yield Strength (psi)"
          name="common.material.maxYieldStrength"
          value={localData.common?.material?.maxYieldStrength?.toString() || ""}
          onChange={handleChange}
          type="number"
          error={fieldErrors["common.material.maxYieldStrength"]}
          disabled={!isEditing}
        />
        <Input
          label="Material Tensile (psi)"
          name="common.material.maxTensileStrength"
          value={localData.common?.material?.maxTensileStrength?.toString() || ""}
          onChange={handleChange}
          type="number"
          error={fieldErrors["common.material.maxTensileStrength"]}
          disabled={!isEditing}
        />
        <Input
          label="Required Max FPM"
          name="common.material.reqMaxFPM"
          value={localData.common?.material?.reqMaxFPM?.toString() || ""}
          onChange={handleChange}
          type="number"
          error={fieldErrors["common.material.reqMaxFPM"]}
          disabled={!isEditing}
        />
        <Input
          label="Coil I.D."
          name="common.coil.coilID"
          value={localData.common?.coil?.coilID?.toString() || ""}
          onChange={handleChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="Coil O.D."
          name="common.coil.maxCoilOD"
          value={localData.common?.coil?.maxCoilOD?.toString() || ""}
          onChange={handleChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="Min Bend Radius (in)"
          name="materialSpecs.material.minBendRadius"
          value={localData.materialSpecs?.material?.minBendRadius?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="Min Loop Length (ft)"
          name="materialSpecs.material.minLoopLength"
          value={localData.materialSpecs?.material?.minLoopLength?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="Coil O.D. Calculated"
          name="materialSpecs.material.calculatedCoilOD"
          value={localData.materialSpecs?.material?.calculatedCoilOD?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
      </div>
    </Card>
  ), [
    localData,
    coilWidthBounds,
    fieldErrors,
    handleChange,
    isEditing
  ]);

  // Other Specifications Section
  const otherSpecsSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Other Specifications
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4">
        <Select
          label="Select Feed Direction"
          name="common.equipment.feed.direction"
          value={localData.common?.equipment?.feed?.direction || ""}
          onChange={handleChange}
          options={FEED_DIRECTION_OPTIONS}
          disabled={!isEditing}
        />
        <Select
          label="Select Controls Level"
          name="common.equipment.feed.controlsLevel"
          value={localData.common?.equipment?.feed?.controlsLevel || ""}
          onChange={handleChange}
          options={CONTROLS_LEVEL_OPTIONS}
          disabled={!isEditing}
        />
        <Select
          label="Type of Line"
          name="common.equipment.feed.typeOfLine"
          value={localData.common?.equipment?.feed?.typeOfLine || ""}
          onChange={handleChange}
          options={TYPE_OF_LINE_OPTIONS}
          disabled={!isEditing}
        />
        <Input
          label="Feed Controls"
          name="materialSpecs.feed.controls"
          type="text"
          value={localData.materialSpecs?.feed?.controls || ""}
          disabled={true}
          className="bg-gray-50"
        />
        <Select
          label="Passline"
          name="common.equipment.feed.passline"
          value={localData.common?.equipment?.feed?.passline || ""}
          onChange={handleChange}
          options={PASSLINE_OPTIONS}
          disabled={!isEditing}
        />
        <Select
          label="Select Roll"
          name="materialSpecs.straightener.rolls.typeOfRoll"
          value={localData.materialSpecs?.straightener?.rolls?.typeOfRoll || ""}
          onChange={handleChange}
          options={ROLL_TYPE_OPTIONS}
          disabled={!isEditing}
        />
        <Select
          label="Reel Backplate"
          name="materialSpecs.reel.backplate.type"
          value={localData.materialSpecs?.reel?.backplate?.type || ""}
          onChange={handleChange}
          options={REEL_BACKPLATE_OPTIONS}
          disabled={!isEditing}
        />
        <Select
          label="Reel Style"
          name="materialSpecs.reel.style"
          value={localData.materialSpecs?.reel?.style || ""}
          onChange={handleChange}
          options={REEL_STYLE_OPTIONS}
          disabled={!isEditing}
        />
        <Checkbox
          label="Light Gauge Non-Marking"
          name="common.equipment.feed.lightGuageNonMarking"
          checked={localData.common?.equipment?.feed?.lightGuageNonMarking === "true"}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Checkbox
          label="Non-Marking"
          name="common.equipment.feed.nonMarking"
          checked={localData.common?.equipment?.feed?.nonMarking === "true"}
          onChange={handleChange}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [
    localData,
    handleChange,
    isEditing
  ]);

  // Status indicator component
  const StatusIndicator = () => {
    if (updateLoading) {
      return (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent"></div>
          Saving...
        </div>
      );
    }
    
    if (isDirty) {
      return (
        <div className="flex items-center gap-2 text-sm text-amber-600">
          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
          Unsaved changes
        </div>
      );
    }
    
    if (lastSaved) {
      return (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          Saved {lastSaved.toLocaleTimeString()}
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="w-full flex flex-1 flex-col p-2 gap-2">
      {/* Status bar */}
      <div className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
        <StatusIndicator />
        {fieldErrors._general && (
          <div className="text-sm text-red-600">{fieldErrors._general}</div>
        )}
      </div>

      {/* Loading and error states */}
      {(loading || updateLoading) && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-blue-800">
              {updateLoading ? "Saving changes and calculating..." : "Loading..."}
            </span>
          </div>
        </div>
      )}

      {(error || updateError) && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <span className="text-red-800">
            Error: {error || updateError}
          </span>
        </div>
      )}

      {/* Form sections */}
      {customerDateSection}
      {materialSpecsSection}
      {otherSpecsSection}
    </div>
  );
};

export default MaterialSpecs;