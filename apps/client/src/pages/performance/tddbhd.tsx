import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { debounce } from "lodash";
import Card from "@/components/common/card";
import Input from "@/components/common/input";
import Text from "@/components/common/text";
import Select from "@/components/common/select";
import {
  MATERIAL_TYPE_OPTIONS,
  REEL_WIDTTH_OPTIONS,
  REEL_MODEL_OPTIONS,
  BACKPLATE_DIAMETER_OPTIONS,
  HYDRAULIC_THREADING_DRIVE_OPTIONS,
  HOLD_DOWN_ASSY_OPTIONS,
  HOLD_DOWN_CYLINDER_OPTIONS,
  BRAKE_MODEL_OPTIONS,
  BRAKE_QUANTITY_OPTIONS,
} from "@/utils/select-options";
import { PerformanceData } from "@/contexts/performance.context";
import { useUpdateEntity } from "@/hooks/_base/use-update-entity";
import { useGetEntity } from "@/hooks/_base/use-get-entity";

export interface TDDBHDProps {
  data: PerformanceData;
  isEditing: boolean;
}

// Validation schema
const validateField = (name: string, value: any): string | null => {
  if (name.includes("Weight") && value) {
    const numValue = Number(value);
    if (isNaN(numValue) || numValue <= 0) {
      return "Weight must be a positive number";
    }
  }
  if (name.includes("Pressure") && value) {
    const numValue = Number(value);
    if (isNaN(numValue) || numValue < 0) {
      return "Pressure must be a non-negative number";
    }
  }
  if (name.includes("Thickness") || name.includes("Width") || name.includes("Diameter")) {
    if (value && (isNaN(Number(value)) || Number(value) <= 0)) {
      return "Value must be a positive number";
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

const TDDBHD: React.FC<TDDBHDProps> = ({ data, isEditing }) => {
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

        console.log("Saving TDDBHD changes:", changes);
        
        const response = await updateEntity(performanceSheetId, { data: updatedData });
        
        // Handle calculated values from backend
        if (response?.data?.tddbhd) {
          console.log("Updating calculated TDDBHD values from backend response");
          
          setLocalData(prevData => ({
            ...prevData,
            reel: {
              ...prevData.tddbhd?.reel,
              // Update calculated fields from response
              coefficientOfFriction: response.data.tddbhd.friction || prevData.tddbhd?.reel?.coefficientOfFriction,
              calculatedCoilWeight: response.data.tddbhd.calculated_coil_weight || prevData.tddbhd?.coil?.coilWeight,
              coilOD: response.data.tddbhd.coil_od || prevData.tddbhd?.coil?.coilOD,
              dispReelMtr: response.data.tddbhd.disp_reel_mtr || prevData.tddbhd?.reel?.dispReelMtr,
              cylinderBore: response.data.tddbhd.cylinder_bore || prevData.tddbhd?.reel?.cylinderBore,
              minMaterialWidth: response.data.tddbhd.min_material_width || prevData.tddbhd?.reel?.minMaterialWidth,
              torque: {
                ...prevData.tddbhd?.reel?.torque,
                atMandrel: response.data.tddbhd.torque_at_mandrel || prevData.tddbhd?.reel?.torque?.atMandrel,
                rewindRequired: response.data.tddbhd.rewind_torque || prevData.tddbhd?.reel?.torque?.rewindRequired,
                required: response.data.tddbhd.torque_required || prevData.tddbhd?.reel?.torque?.required,
              },
              holddown: {
                ...prevData.tddbhd?.reel?.holddown,
                cylinderPressure: response.data.tddbhd.holddown_pressure || prevData.tddbhd?.reel?.holddown?.cylinderPressure,
                force: {
                  ...prevData.tddbhd?.reel?.holddown?.force,
                  required: response.data.tddbhd.hold_down_force_required || prevData.tddbhd?.reel?.holddown?.force?.required,
                  available: response.data.tddbhd.hold_down_force_available || prevData.tddbhd?.reel?.holddown?.force?.available,
                }
              },
              dragBrake: {
                ...prevData.tddbhd?.reel?.dragBrake,
                psiAirRequired: response.data.tddbhd.failsafe_required || prevData.tddbhd?.reel?.dragBrake?.psiAirRequired,
                holdingForce: response.data.tddbhd.failsafe_holding_force || prevData.tddbhd?.reel?.dragBrake?.holdingForce,
              },
              webTension: {
                ...prevData.tddbhd?.reel?.webTension,
                psi: response.data.tddbhd.web_tension_psi || prevData.tddbhd?.reel?.webTension?.psi,
                lbs: response.data.tddbhd.web_tension_lbs || prevData.tddbhd?.reel?.webTension?.lbs,
              }
            }
          }));
        }

        setLastSaved(new Date());
        setIsDirty(false);
        pendingChangesRef.current = {};
        
      } catch (error) {
        console.error('Error saving TDDBHD:', error);
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

    // Clear field error
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Validate field
    const error = validateField(name, value);
    if (error) {
      setFieldErrors(prev => ({ ...prev, [name]: error }));
      return;
    }

    // Update local state immediately
    setLocalData(prevData => {
      const newData = { ...prevData };
      const processedValue = type === "number" ? (value === "" ? "" : value) : value;
      
      setNestedValue(newData, name, processedValue);
      
      return newData;
    });

    // Track pending changes
    pendingChangesRef.current[name] = type === "number" ? (value === "" ? "" : value) : value;
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Customer"
          name="rfq.customer"
          value={localData.rfq?.customer || ""}
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
  ), [localData.rfq?.customer, localData.rfq?.dates?.date, handleChange, isEditing]);

  // Reel & Material Specs Section
  const reelMaterialSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Reel & Material Specs
      </Text>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <Select
          label="Reel Model"
          name="reel.model"
          value={localData.tddbhd?.reel?.model?.toString() || ""}
          onChange={handleChange}
          options={REEL_MODEL_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
          disabled={!isEditing}
        />
        <Select
          label="Reel Width"
          name="reel.width"
          value={localData.tddbhd?.reel?.width?.toString() || ""}
          onChange={handleChange}
          options={REEL_WIDTTH_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.Label,
          }))}
          disabled={!isEditing}
        />
        <Select
          label="Backplate Diameter"
          name="reel.backplate.diameter"
          value={localData.tddbhd?.reel?.backplate?.diameter?.toString() || ""}
          onChange={handleChange}
          options={BACKPLATE_DIAMETER_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.Label,
          }))}
          disabled={!isEditing}
        />
        <Select
          label="Material Type"
          name="material.materialType"
          value={localData.tddbhd?.material?.materialType || ""}
          onChange={handleChange}
          options={MATERIAL_TYPE_OPTIONS}
          disabled={!isEditing}
        />
        <Input
          label="Material Width (in)"
          name="material.coilWidth"
          value={localData.tddbhd?.material?.coilWidth?.toString() || ""}
          onChange={handleChange}
          type="number"
          error={fieldErrors["material.coilWidth"]}
          disabled={!isEditing}
        />
        <Input
          label="Material Thickness (in)"
          name="material.materialThickness"
          value={localData.tddbhd?.material?.materialThickness?.toString() || ""}
          onChange={handleChange}
          type="number"
          error={fieldErrors["material.materialThickness"]}
          disabled={!isEditing}
        />
        <Input
          label="Material Yield Strength (psi)"
          name="material.maxYieldStrength"
          value={localData.tddbhd?.material?.maxYieldStrength?.toString() || ""}
          onChange={handleChange}
          type="number"
          error={fieldErrors["material.maxYieldStrength"]}
          disabled={!isEditing}
        />
        <Input
          label="Air Pressure Available (psi)"
          name="reel.airPressureAvailable"
          value={localData.tddbhd?.reel?.airPressureAvailable?.toString() || ""}
          onChange={handleChange}
          type="number"
          error={fieldErrors["reel.airPressureAvailable"]}
          disabled={!isEditing}
        />
        <Input
          label="Required Decel. Rate (ft/sec²)"
          name="reel.requiredDecelRate"
          value={localData.tddbhd?.reel?.requiredDecelRate?.toString() || ""}
          onChange={handleChange}
          type="number"
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData.tddbhd?.reel, localData.tddbhd?.material, fieldErrors, handleChange, isEditing]);

  // Coil, Brake & Other Specs Section
  const coilBrakeSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Coil, Brake & Other Specs
      </Text>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Input
          label="Coil Weight (lbs)"
          name="coil.maxCoilWeight"
          value={localData.tddbhd?.coil?.maxCoilWeight?.toString() || ""}
          onChange={handleChange}
          type="number"
          error={fieldErrors["coil.maxCoilWeight"]}
          disabled={!isEditing}
        />
        <Input
          label="Coil O.D. (in)"
          name="coil.maxCoilOD"
          value={localData.tddbhd?.coil?.maxCoilOD?.toString() || ""}
          onChange={handleChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="Disp. (Reel) Mtr."
          name="reel.dispReelMtr"
          value={localData.tddbhd?.reel?.dispReelMtr?.toString() || ""}
          type="text"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="Web Tension (psi)"
          name="reel.webTension.psi"
          value={localData.tddbhd?.reel?.webTension?.psi?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="Web Tension (lbs)"
          name="reel.webTension.lbs"
          value={localData.tddbhd?.reel?.webTension?.lbs?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="Brake Pad Diameter (in)"
          name="reel.brakePadDiameter"
          value={localData.tddbhd?.reel?.brakePadDiameter?.toString() || ""}
          onChange={handleChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="Cylinder Bore (in)"
          name="reel.cylinderBore"
          value={localData.tddbhd?.reel?.cylinderBore?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="Coefficient of Friction"
          name="reel.coefficientOfFriction"
          value={localData.tddbhd?.reel?.coefficientOfFriction?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
      </div>
    </Card>
  ), [localData.tddbhd?.coil, localData.tddbhd?.reel, fieldErrors, handleChange, isEditing]);

  // Threading Drive Section
  const threadingDriveSection = useMemo(() => (
    <Card className="p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Threading Drive
      </Text>
      <div className="space-y-4">
        <Input
          label="Air Clutch"
          name="reel.threadingDrive.airClutch"
          value={localData.tddbhd?.reel?.threadingDrive?.airClutch || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Select
          label="Hyd. Threading Drive"
          name="reel.threadingDrive.hydThreadingDrive"
          value={localData.tddbhd?.reel?.threadingDrive?.hydThreadingDrive || ""}
          onChange={handleChange}
          options={HYDRAULIC_THREADING_DRIVE_OPTIONS}
          disabled={!isEditing}
        />
        <Input
          label="Torque At Mandrel (in. lbs.)"
          name="reel.torque.atMandrel"
          value={localData.tddbhd?.reel?.torque?.atMandrel?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="Rewind Torque Req. (in. lbs.)"
          name="reel.torque.rewindRequired"
          value={localData.tddbhd?.reel?.torque?.rewindRequired?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
      </div>
    </Card>
  ), [localData.tddbhd?.reel?.threadingDrive, localData.tddbhd?.reel?.torque, handleChange, isEditing]);

  // Hold Down Section
  const holdDownSection = useMemo(() => (
    <Card className="p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Hold Down
      </Text>
      <div className="space-y-4">
        <Select
          label="Hold Down Assy"
          name="reel.holddown.assy"
          value={localData.tddbhd?.reel?.holddown?.assy || ""}
          onChange={handleChange}
          options={HOLD_DOWN_ASSY_OPTIONS}
          disabled={!isEditing}
        />
        <Input
          label="Holddown Pressure (psi)"
          name="reel.holddown.cylinderPressure"
          value={localData.tddbhd?.reel?.holddown?.cylinderPressure?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="Hold Down Force Required (lbs)"
          name="reel.holddown.force.required"
          value={localData.tddbhd?.reel?.holddown?.force?.required?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="Hold Down Force Available (lbs)"
          name="reel.holddown.force.available"
          value={localData.tddbhd?.reel?.holddown?.force?.available?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="Min. Material Width (in)"
          name="reel.minMaterialWidth"
          value={localData.tddbhd?.reel?.minMaterialWidth?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
      </div>
    </Card>
  ), [localData.tddbhd?.reel?.holddown, localData.tddbhd?.reel?.minMaterialWidth, handleChange, isEditing]);

  // Cylinder Section
  const cylinderSection = useMemo(() => (
    <Card className="p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Cylinder
      </Text>
      <div className="space-y-4">
        <Select
          label="Type"
          name="reel.holddown.cylinder"
          value={localData.tddbhd?.reel?.holddown?.cylinder || ""}
          onChange={handleChange}
          options={HOLD_DOWN_CYLINDER_OPTIONS}
          disabled={!isEditing}
        />
        <Input
          label="Pressure (psi)"
          name="reel.holddown.cylinderPressure"
          value={localData.tddbhd?.reel?.holddown?.cylinderPressure?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
      </div>
    </Card>
  ), [localData.tddbhd?.reel?.holddown, handleChange, isEditing]);

  // Drag Brake Section
  const dragBrakeSection = useMemo(() => (
    <Card className="p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Drag Brake
      </Text>
      <div className="space-y-4">
        <Select
          label="Brake Model"
          name="reel.dragBrake.model"
          value={localData.tddbhd?.reel?.dragBrake?.model || ""}
          onChange={handleChange}
          options={BRAKE_MODEL_OPTIONS}
          disabled={!isEditing}
        />
        <Select
          label="Brake Quantity"
          name="reel.dragBrake.quantity"
          value={localData.tddbhd?.reel?.dragBrake?.quantity?.toString() || ""}
          onChange={handleChange}
          options={BRAKE_QUANTITY_OPTIONS}
          disabled={!isEditing}
        />
        <Input
          label="Torque Required (in. lbs.)"
          name="reel.torque.required"
          value={localData.tddbhd?.reel?.torque?.required?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="Failsafe - Single Stage (psi air req.)"
          name="reel.dragBrake.psiAirRequired"
          value={localData.tddbhd?.reel?.dragBrake?.psiAirRequired?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="Failsafe Holding Force (in. lbs.)"
          name="reel.dragBrake.holdingForce"
          value={localData.tddbhd?.reel?.dragBrake?.holdingForce?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
      </div>
    </Card>
  ), [localData.tddbhd?.reel?.dragBrake, localData.tddbhd?.reel?.torque, handleChange, isEditing]);

  // Status indicator component
  const StatusIndicator = () => {
    if (updateLoading) {
      return (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent"></div>
          Calculating...
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
      {reelMaterialSection}
      {coilBrakeSection}
      
      {/* Threading Drive and Hold Down */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {threadingDriveSection}
        {holdDownSection}
      </div>
      
      {/* Cylinder and Drag Brake */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {cylinderSection}
        {dragBrakeSection}
      </div>
    </div>
  );
};

export default TDDBHD;