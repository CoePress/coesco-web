import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { debounce } from "lodash";
import Card from "@/components/common/card";
import Input from "@/components/common/input";
import Select from "@/components/common/select";
import Text from "@/components/common/text";
import { PerformanceData } from "@/contexts/performance.context";
import { 
  STR_MODEL_OPTIONS,
  STR_WIDTH_OPTIONS,
  PAYOFF_OPTIONS,
  MATERIAL_TYPE_OPTIONS,
  YES_NO_OPTIONS,
  STR_HORSEPOWER_OPTIONS,
  STR_FEED_RATE_OPTIONS,
} from "@/utils/select-options";
import { useUpdateEntity } from "@/hooks/_base/use-update-entity";
import { useGetEntity } from "@/hooks/_base/use-get-entity";

export interface StrUtilityProps {
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
  if (name.includes("Diameter") || name.includes("Width") || name.includes("Thickness")) {
    if (value && (isNaN(Number(value)) || Number(value) <= 0)) {
      return "Value must be a positive number";
    }
  }
  if (name.includes("Strength") && value) {
    const numValue = Number(value);
    if (isNaN(numValue) || numValue < 0) {
      return "Strength must be a non-negative number";
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

const StrUtility: React.FC<StrUtilityProps> = ({ data, isEditing }) => {
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

        console.log("Saving Straightener Utility changes:", changes);
        
        const response = await updateEntity(performanceSheetId, { data: updatedData });
        
        // Handle calculated values from backend
        if (response?.data?.str_utility) {
          console.log("Updating calculated straightener values from backend response");
          
          setLocalData(prevData => ({
            ...prevData,
            straightener: {
              ...prevData.strUtility?.straightener,
              // Update calculated fields from response
              required: {
                ...prevData.strUtility?.straightener?.required,
                force: response.data.str_utility.required?.force || prevData.strUtility?.straightener?.required?.force,
                ratedForce: response.data.str_utility.required?.ratedForce || prevData.strUtility?.straightener?.required?.ratedForce,
                horsepower: response.data.str_utility.required?.horsepower || prevData.strUtility?.straightener?.required?.horsepower,
              },
              rolls: {
                ...prevData.strUtility?.straightener?.rolls,
                pinch: {
                  ...prevData.strUtility?.straightener?.rolls?.pinch,
                  requiredGearTorque: response.data.str_utility.rolls?.pinch?.requiredGearTorque || prevData.strUtility?.straightener?.rolls?.pinch?.requiredGearTorque,
                  ratedTorque: response.data.str_utility.rolls?.pinch?.ratedTorque || prevData.strUtility?.straightener?.rolls?.pinch?.ratedTorque,
                },
                straightener: {
                  ...prevData.strUtility?.straightener?.rolls?.straightener,
                  requiredGearTorque: response.data.str_utility.rolls?.straightener?.requiredGearTorque || prevData.strUtility?.straightener?.rolls?.straightener?.requiredGearTorque,
                  ratedTorque: response.data.str_utility.rolls?.straightener?.ratedTorque || prevData.strUtility?.straightener?.rolls?.straightener?.ratedTorque,
                }
              },
              actualCoilWeight: response.data.str_utility.actualCoilWeight || prevData.strUtility?.straightener?.actualCoilWeight,
              coilOD: response.data.str_utility.coilOD || prevData.strUtility?.straightener?.coilOD,
              torque: {
                ...prevData.strUtility?.straightener?.torque,
                straightener: response.data.str_utility.torque?.straightener || prevData.strUtility?.straightener?.torque?.straightener,
                acceleration: response.data.str_utility.torque?.acceleration || prevData.strUtility?.straightener?.torque?.acceleration,
                brake: response.data.str_utility.torque?.brake || prevData.strUtility?.straightener?.torque?.brake,
              }
            }
          }));
        }

        setLastSaved(new Date());
        setIsDirty(false);
        pendingChangesRef.current = {};
        
      } catch (error) {
        console.error('Error saving Straightener Utility:', error);
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
      
      // Handle legacy field mappings for customer and date
      if (name === "customer") {
        setNestedValue(newData, "rfq.customer", processedValue);
      } else if (name === "date") {
        setNestedValue(newData, "rfq.dates.date", processedValue);
      } else {
        setNestedValue(newData, name, processedValue);
      }
      
      return newData;
    });

    // Track pending changes
    const mappedName = name === "customer" ? "rfq.customer" : 
                      name === "date" ? "rfq.dates.date" : 
                      name;
    pendingChangesRef.current[mappedName] = type === "number" ? (value === "" ? "" : value) : value;
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

  // Status calculation functions
  const statusCalculations = useMemo(() => {
    const getJackForceStatus = () => {
      const required = Number(localData.strUtility?.straightener?.required?.force || 0);
      const available = Number(localData.strUtility?.straightener?.jackForceAvailable || 0);
      return {
        status: required <= available ? "JACK FORCE OK" : "JACK FORCE INSUFFICIENT",
        isOk: required <= available
      };
    };

    const getPinchGearStatus = () => {
      const requiredTorque = Number(localData.strUtility?.straightener?.rolls?.pinch?.requiredGearTorque || 0);
      const ratedTorque = Number(localData.strUtility?.straightener?.rolls?.pinch?.ratedTorque || 0);
      return {
        status: requiredTorque <= ratedTorque ? "PINCH GEAR OK" : "PINCH GEAR INSUFFICIENT",
        isOk: requiredTorque <= ratedTorque
      };
    };

    const getStrGearStatus = () => {
      const requiredTorque = Number(localData.strUtility?.straightener?.rolls?.straightener?.requiredGearTorque || 0);
      const ratedTorque = Number(localData.strUtility?.straightener?.rolls?.straightener?.ratedTorque || 0);
      return {
        status: requiredTorque <= ratedTorque ? "STR GEAR OK" : "STR GEAR INSUFFICIENT",
        isOk: requiredTorque <= ratedTorque
      };
    };

    const getHpStatus = () => {
      const required = Number(localData.strUtility?.straightener?.required?.horsepower || 0);
      const available = Number(localData.strUtility?.straightener?.horsepower || 0);
      return {
        status: required <= available ? "HP SUFFICIENT" : "HP INSUFFICIENT",
        isOk: required <= available
      };
    };

    const getFpmStatus = () => {
      const feedRate = Number(localData.strUtility?.straightener?.feedRate || 0);
      return {
        status: feedRate > 0 ? "FPM SUFFICIENT" : "FPM INSUFFICIENT",
        isOk: feedRate > 0
      };
    };

    return {
      jackForce: getJackForceStatus(),
      pinchGear: getPinchGearStatus(),
      strGear: getStrGearStatus(),
      hp: getHpStatus(),
      fpm: getFpmStatus()
    };
  }, [localData.strUtility?.straightener]);

  // Header Information Section
  const headerSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Straightener Selection Utility
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Customer"
          name="customer"
          value={localData.rfq?.customer || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Date"
          name="date"
          type="date"
          value={localData.rfq?.dates?.date || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData.rfq?.customer, localData.rfq?.dates?.date, handleChange, isEditing]);

  // Straightener Specifications Section
  const straightenerSpecsSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Straightener Specifications
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Select
          label="Payoff"
          name="straightener.payoff"
          value={localData.strUtility?.straightener?.payoff || ""}
          onChange={handleChange}
          options={PAYOFF_OPTIONS}
          disabled={!isEditing}
        />
        <Select
          label="Str. Model"
          name="straightener.model"
          value={localData.strUtility?.straightener?.model || ""}
          onChange={handleChange}
          options={STR_MODEL_OPTIONS}
          disabled={!isEditing}
        />
        <Select
          label="Str. Width (in.)"
          name="straightener.width"
          value={String(localData.strUtility?.straightener?.width ?? "")}
          onChange={handleChange}
          options={STR_WIDTH_OPTIONS}
          disabled={!isEditing}
        />
        <Input
          label="No. of Str. Rolls"
          name="straightener.rolls.numberOfRolls"
          type="number"
          value={localData.strUtility?.straightener?.rolls?.numberOfRolls?.toString() || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData.strUtility?.straightener, handleChange, isEditing]);

  // Coil Information Section
  const coilInfoSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Coil Information
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Input
          label="Coil Wt. Capacity (lbs)"
          name="coil.maxCoilWeight"
          type="number"
          value={localData.strUtility?.coil?.weight?.toString() || ""}
          onChange={handleChange}
          error={fieldErrors["coil.maxCoilWeight"]}
          disabled={!isEditing}
        />
        <Input
          label="Coil ID. (in)"
          name="coil.coilID"
          type="number"
          value={localData.strUtility?.coil?.coilID?.toString() || ""}
          onChange={handleChange}
          error={fieldErrors["coil.coilID"]}
          disabled={!isEditing}
        />
        <Input
          label="Coil Width (in)"
          name="material.coilWidth"
          type="number"
          value={localData.strUtility?.material?.coilWidth?.toString() || ""}
          onChange={handleChange}
          error={fieldErrors["material.coilWidth"]}
          disabled={!isEditing}
        />
        <Input
          label="Thickness (in)"
          name="material.materialThickness"
          type="number"
          value={localData.strUtility?.material?.materialThickness?.toString() || ""}
          onChange={handleChange}
          error={fieldErrors["material.materialThickness"]}
          disabled={!isEditing}
        />
        <Input
          label="Yield Strength (psi)"
          name="material.maxYieldStrength"
          type="number"
          value={localData.strUtility?.material?.maxYieldStrength?.toString() || ""}
          onChange={handleChange}
          error={fieldErrors["material.maxYieldStrength"]}
          disabled={!isEditing}
        />
        <Select
          label="Material"
          name="material.materialType"
          value={localData.strUtility?.material?.materialType || ""}
          onChange={handleChange}
          options={MATERIAL_TYPE_OPTIONS}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData.strUtility?.coil, localData.strUtility?.material, fieldErrors, handleChange, isEditing]);

  // Operating Parameters Section
  const operatingParamsSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Operating Parameters
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Select
          label="Horse Power (HP)"
          name="straightener.horsepower"
          value={String(localData.strUtility?.straightener?.horsepower ?? "")}
          onChange={handleChange}
          options={STR_HORSEPOWER_OPTIONS}
          disabled={!isEditing}
        />
        <Input
          label="Acceleration (ft/sec²)"
          name="straightener.acceleration"
          type="number"
          value={localData.strUtility?.straightener?.acceleration?.toString() || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Select
          label="Feed Rate (ft/min)"
          name="straightener.feedRate"
          value={String(localData.strUtility?.straightener?.feedRate ?? "")}
          onChange={handleChange}
          options={STR_FEED_RATE_OPTIONS}
          disabled={!isEditing}
        />
        <Select
          label="Auto. Brake Compen."
          name="straightener.autoBrakeCompensation"
          value={localData.strUtility?.straightener?.autoBrakeCompensation || ""}
          onChange={handleChange}
          options={YES_NO_OPTIONS}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData.strUtility?.straightener, handleChange, isEditing]);

  // Physical Parameters Section
  const physicalParamsSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Physical Parameters
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Input
          label="Str. Roll Dia. (in)"
          name="straightener.rolls.straightener.diameter"
          type="number"
          value={localData.strUtility?.straightener?.rolls?.straightener?.diameter?.toString() || ""}
          onChange={handleChange}
          error={fieldErrors["straightener.rolls.straightener.diameter"]}
          disabled={!isEditing}
        />
        <Input
          label="Pinch Roll Dia. (in)"
          name="straightener.rolls.pinch.diameter"
          type="number"
          value={localData.strUtility?.straightener?.rolls?.pinch?.diameter?.toString() || ""}
          onChange={handleChange}
          error={fieldErrors["straightener.rolls.pinch.diameter"]}
          disabled={!isEditing}
        />
        <Input
          label="Center Dist. (in)"
          name="straightener.centerDistance"
          type="number"
          value={localData.strUtility?.straightener?.centerDistance?.toString() || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Jack Force Avail. (lbs)"
          name="straightener.jackForceAvailable"
          type="number"
          value={localData.strUtility?.straightener?.jackForceAvailable?.toString() || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Max. Roll Depth (in)"
          name="straightener.rolls.depth.withoutMaterial"
          type="number"
          value={localData.strUtility?.straightener?.rolls?.depth?.withoutMaterial?.toString() || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Modulus (psi)"
          name="straightener.modulus"
          type="number"
          value={localData.strUtility?.straightener?.modulus?.toString() || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData.strUtility?.straightener, fieldErrors, handleChange, isEditing]);

  // Gears Data Section
  const gearsDataSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Gears Data
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Text as="h4" className="mb-3 text-md font-medium">
            Pinch Roll Gear
          </Text>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="# teeth"
              name="straightener.gear.pinchRoll.numberOfTeeth"
              type="number"
              value={localData.strUtility?.straightener?.gear?.pinchRoll?.numberOfTeeth?.toString() || ""}
              onChange={handleChange}
              disabled={!isEditing}
            />
            <Input
              label="DP"
              name="straightener.gear.pinchRoll.dp"
              type="number"
              value={localData.strUtility?.straightener?.gear?.pinchRoll?.dp?.toString() || ""}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>
        </div>
        <div>
          <Text as="h4" className="mb-3 text-md font-medium">
            Str. Roll Gear
          </Text>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="# teeth"
              name="straightener.gear.straightenerRoll.numberOfTeeth"
              type="number"
              value={localData.strUtility?.straightener?.gear?.straightenerRoll?.numberOfTeeth?.toString() || ""}
              onChange={handleChange}
              disabled={!isEditing}
            />
            <Input
              label="DP"
              name="straightener.gear.straightenerRoll.dp"
              type="number"
              value={localData.strUtility?.straightener?.gear?.straightenerRoll?.dp?.toString() || ""}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Input
          label="Face Width (in)"
          name="straightener.gear.faceWidth"
          type="number"
          value={localData.strUtility?.straightener?.gear?.faceWidth?.toString() || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Cont. Angle (degree)"
          name="straightener.gear.contAngle"
          type="number"
          value={localData.strUtility?.straightener?.gear?.contAngle?.toString() || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData.strUtility?.straightener?.gear, handleChange, isEditing]);

  // Calculations Results Section
  const calculationsSection = useMemo(() => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      {/* Force Calculations */}
      <Card className="p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Force Calculations
        </Text>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Required Force (lbs)"
              name="straightener.required.force"
              value={localData.strUtility?.straightener?.required?.force?.toString() || ""}
              disabled={true}
              className="bg-gray-50"
            />
            <Input
              label="Rated Force (lbs)"
              name="straightener.required.ratedForce"
              value={localData.strUtility?.straightener?.required?.ratedForce?.toString() || ""}
              disabled={true}
              className="bg-gray-50"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Pinch Roll Req. Torque"
              name="straightener.rolls.pinch.requiredGearTorque"
              value={localData.strUtility?.straightener?.rolls?.pinch?.requiredGearTorque?.toString() || ""}
              disabled={true}
              className="bg-gray-50"
            />
            <Input
              label="Pinch Roll Rated Torque"
              name="straightener.rolls.pinch.ratedTorque"
              value={localData.strUtility?.straightener?.rolls?.pinch?.ratedTorque?.toString() || ""}
              disabled={true}
              className="bg-gray-50"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Str. Roll Req. Torque"
              name="straightener.rolls.straightener.requiredGearTorque"
              value={localData.strUtility?.straightener?.rolls?.straightener?.requiredGearTorque?.toString() || ""}
              disabled={true}
              className="bg-gray-50"
            />
            <Input
              label="Str. Roll Rated Torque"
              name="straightener.rolls.straightener.ratedTorque"
              value={localData.strUtility?.straightener?.rolls?.straightener?.ratedTorque?.toString() || ""}
              disabled={true}
              className="bg-gray-50"
            />
          </div>
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Horse Power Required (HP)"
              name="straightener.required.horsepower"
              value={localData.strUtility?.straightener?.required?.horsepower?.toString() || ""}
              disabled={true}
              className="bg-gray-50"
            />
          </div>
        </div>
      </Card>

      {/* Additional Calculations */}
      <Card className="p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Additional Calculations
        </Text>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Actual Coil Wt. (lbs)"
              name="straightener.actualCoilWeight"
              value={localData.strUtility?.straightener?.actualCoilWeight?.toString() || ""}
              disabled={true}
              className="bg-gray-50"
            />
            <Input
              label="Coil OD. (in)"
              name="straightener.coilOD"
              value={localData.strUtility?.straightener?.coilOD?.toString() || ""}
              disabled={true}
              className="bg-gray-50"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Str. Torque (in lbs)"
              name="straightener.torque.straightener"
              value={localData.strUtility?.straightener?.torque?.straightener?.toString() || ""}
              disabled={true}
              className="bg-gray-50"
            />
            <Input
              label="Accel. Torque (in lbs)"
              name="straightener.torque.acceleration"
              value={localData.strUtility?.straightener?.torque?.acceleration?.toString() || ""}
              disabled={true}
              className="bg-gray-50"
            />
            <Input
              label="Brake Torque (in lbs)"
              name="straightener.torque.brake"
              value={localData.strUtility?.straightener?.torque?.brake?.toString() || ""}
              disabled={true}
              className="bg-gray-50"
            />
          </div>
        </div>
      </Card>
    </div>
  ), [localData.strUtility?.straightener]);

  // Status Indicators Section
  const statusSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Status & Recommendations
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className={`p-3 rounded text-center font-medium ${
          statusCalculations.jackForce.isOk ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
        }`}>
          <Text className="text-sm">{statusCalculations.jackForce.status}</Text>
          <Text className="text-xs mt-1">Back Up Rolls Recommended</Text>
        </div>
        <div className={`p-3 rounded text-center font-medium ${
          statusCalculations.pinchGear.isOk ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
        }`}>
          <Text className="text-sm">{statusCalculations.pinchGear.status}</Text>
        </div>
        <div className={`p-3 rounded text-center font-medium ${
          statusCalculations.strGear.isOk ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
        }`}>
          <Text className="text-sm">{statusCalculations.strGear.status}</Text>
        </div>
        <div className={`p-3 rounded text-center font-medium ${
          statusCalculations.hp.isOk ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
        }`}>
          <Text className="text-sm">{statusCalculations.hp.status}</Text>
        </div>
        <div className={`p-3 rounded text-center font-medium ${
          statusCalculations.fpm.isOk ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
        }`}>
          <Text className="text-sm">{statusCalculations.fpm.status}</Text>
        </div>
        <div className={`p-3 rounded text-center font-medium ${
          Object.values(statusCalculations).every(calc => calc.isOk) ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          <Text className="text-sm">
            {Object.values(statusCalculations).every(calc => calc.isOk) ? "All Str. Utility OK" : "Review Required"}
          </Text>
        </div>
      </div>
    </Card>
  ), [statusCalculations]);

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
      {headerSection}
      {straightenerSpecsSection}
      {coilInfoSection}
      {operatingParamsSection}
      {physicalParamsSection}
      {gearsDataSection}
      {calculationsSection}
      {statusSection}
    </div>
  );
};

export default StrUtility;