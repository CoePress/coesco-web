import { useEffect, useRef, useState } from "react";
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
import { useParams } from "react-router-dom";
import { useGetEntity } from "@/hooks/_base/use-get-entity";

export interface StrUtilityProps {
  data: PerformanceData;
  isEditing: boolean;
}

const StrUtility: React.FC<StrUtilityProps> = ({ data, isEditing }) => {
  const endpoint = `/performance/sheets`;
  const { loading, error } = useGetEntity(endpoint);
  const { updateEntity, loading: updateLoading, error: updateError } = useUpdateEntity(endpoint);
  const { id: performanceSheetId } = useParams();
  
  // Local state for immediate UI updates
  const [localData, setLocalData] = useState<PerformanceData>(data);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with parent data on initial load
  useEffect(() => {
    if (!localData.referenceNumber && data.referenceNumber) {
      console.log('Initial data load, syncing all data');
      setLocalData(data);
    }
  }, [data, localData.referenceNumber]);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!isEditing) return;

    const { name, value, type } = e.target;
    const actualValue = value;

    console.log(`Field changed: ${name}, Value: ${actualValue}`);

    // Update local state immediately for responsive UI
    setLocalData(prevData => {
      const updatedData = JSON.parse(JSON.stringify(prevData));

      if (name.includes(".")) {
        // Handle nested field updates
        const parts = name.split(".");
        let current = updatedData;
        
        // Navigate to the parent object
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) {
            current[parts[i]] = {};
          }
          current = current[parts[i]];
        }
        
        // Set the final value
        current[parts[parts.length - 1]] = type === "number" ? (value === "" ? "" : value) : value;
      } else {
        // Handle legacy field names that map to nested structure
        const fieldMappings: { [key: string]: any } = {
          customer: { path: "customer", value: value },
          date: { path: "dates.date", value: value },
        };

        if (fieldMappings[name]) {
          const mapping = fieldMappings[name];
          const parts = mapping.path.split(".");
          let current = updatedData;
          
          // Navigate to the parent object
          for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) {
              current[parts[i]] = {};
            }
            current = current[parts[i]];
          }
          
          // Set the final value
          current[parts[parts.length - 1]] = mapping.value;
        } else {
          // Handle top-level fields
          updatedData[name] = type === "number" ? (value === "" ? "" : value) : value;
        }
      }

      return updatedData;
    });

    // Debounce backend updates to avoid excessive API calls
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(async () => {
      try {
        if (!performanceSheetId) {
          throw new Error("Performance Sheet ID is missing.");
        }

        // Create updated data for backend
        const updatedData = JSON.parse(JSON.stringify(localData));
        
        // Apply the current change to the data being sent
        if (name.includes(".")) {
          const parts = name.split(".");
          let current = updatedData;
          
          for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) {
              current[parts[i]] = {};
            }
            current = current[parts[i]];
          }
          
          current[parts[parts.length - 1]] = type === "number" ? (value === "" ? "" : value) : value;
        } else {
          // Handle legacy field mappings
          const fieldMappings: { [key: string]: any } = {
            customer: { path: "customer", value: value },
            date: { path: "dates.date", value: value },
          };

          if (fieldMappings[name]) {
            const mapping = fieldMappings[name];
            const parts = mapping.path.split(".");
            let current = updatedData;
            
            for (let i = 0; i < parts.length - 1; i++) {
              if (!current[parts[i]]) {
                current[parts[i]] = {};
              }
              current = current[parts[i]];
            }
            
            current[parts[parts.length - 1]] = mapping.value;
          } else {
            updatedData[name] = type === "number" ? (value === "" ? "" : value) : value;
          }
        }

        console.log("Updating with complete data structure:", updatedData);

        // Send to backend (this will also trigger calculations)
        const response = await updateEntity(performanceSheetId, { data: updatedData });
        
        console.log("Backend response:", response);
        
        // Handle calculated values directly from the backend response
        if (response && response.data && response.data.straightener) {
          console.log("Updating calculated straightener values from backend response");
          
          setLocalData(prevData => ({
            ...prevData,
            straightener: {
              ...prevData.straightener,
              // Update calculated fields from response
              required: {
                ...prevData.straightener?.required,
                force: response.data.straightener.required?.force || prevData.straightener?.required?.force,
                ratedForce: response.data.straightener.required?.ratedForce || prevData.straightener?.required?.ratedForce,
                horsepower: response.data.straightener.required?.horsepower || prevData.straightener?.required?.horsepower,
              },
              rolls: {
                ...prevData.straightener?.rolls,
                pinch: {
                  ...prevData.straightener?.rolls?.pinch,
                  requiredGearTorque: response.data.straightener.rolls?.pinch?.requiredGearTorque || prevData.straightener?.rolls?.pinch?.requiredGearTorque,
                  ratedTorque: response.data.straightener.rolls?.pinch?.ratedTorque || prevData.straightener?.rolls?.pinch?.ratedTorque,
                },
                straightener: {
                  ...prevData.straightener?.rolls?.straightener,
                  requiredGearTorque: response.data.straightener.rolls?.straightener?.requiredGearTorque || prevData.straightener?.rolls?.straightener?.requiredGearTorque,
                  ratedTorque: response.data.straightener.rolls?.straightener?.ratedTorque || prevData.straightener?.rolls?.straightener?.ratedTorque,
                }
              },
              actualCoilWeight: response.data.straightener.actualCoilWeight || prevData.straightener?.actualCoilWeight,
              coilOD: response.data.straightener.coilOD || prevData.straightener?.coilOD,
              torque: {
                ...prevData.straightener?.torque,
                straightener: response.data.straightener.torque?.straightener || prevData.straightener?.torque?.straightener,
                acceleration: response.data.straightener.torque?.acceleration || prevData.straightener?.torque?.acceleration,
                brake: response.data.straightener.torque?.brake || prevData.straightener?.torque?.brake,
              }
            }
          }));
          
          console.log("Updated calculated straightener values:", {
            requiredForce: response.data.straightener.required?.force,
            ratedForce: response.data.straightener.required?.ratedForce,
            requiredHP: response.data.straightener.required?.horsepower,
            pinchTorque: response.data.straightener.rolls?.pinch?.requiredGearTorque,
            strTorque: response.data.straightener.rolls?.straightener?.requiredGearTorque,
          });
        }

      } catch (error) {
        console.error('Error updating field:', error);
        setLocalData(data);
      }
    }, 500);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Calculate status indicators
  const getJackForceStatus = () => {
    const required = Number(localData.straightener?.required?.force || 0);
    const available = Number(localData.straightener?.jackForceAvailable || 0);
    return required <= available ? "JACK FORCE OK" : "JACK FORCE INSUFFICIENT";
  };

  const getPinchGearStatus = () => {
    const requiredTorque = Number(localData.straightener?.rolls?.pinch?.requiredGearTorque || 0);
    const ratedTorque = Number(localData.straightener?.rolls?.pinch?.ratedTorque || 0);
    return requiredTorque <= ratedTorque ? "PINCH GEAR OK" : "PINCH GEAR INSUFFICIENT";
  };

  const getStrGearStatus = () => {
    const requiredTorque = Number(localData.straightener?.rolls?.straightener?.requiredGearTorque || 0);
    const ratedTorque = Number(localData.straightener?.rolls?.straightener?.ratedTorque || 0);
    return requiredTorque <= ratedTorque ? "STR GEAR OK" : "STR GEAR INSUFFICIENT";
  };

  const getHpStatus = () => {
    const required = Number(localData.straightener?.required?.horsepower || 0);
    const available = Number(localData.straightener?.horsepower || 0);
    return required <= available ? "HP SUFFICIENT" : "HP INSUFFICIENT";
  };

  const getFpmStatus = () => {
    const feedRate = Number(localData.straightener?.feedRate || 0);
    return feedRate > 0 ? "FPM SUFFICIENT" : "FPM INSUFFICIENT";
  };

  return (
    <div className="w-full flex flex-1 flex-col p-2 gap-2">
      {/* Show loading indicator when calculations are running */}
      {(loading || updateLoading) && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-blue-800">
              {updateLoading ? "Saving changes..." : "Loading..."}
            </span>
          </div>
        </div>
      )}

      {/* Show error if calculation fails */}
      {(error || updateError) && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <span className="text-red-800">
            Error: {error || updateError}
          </span>
        </div>
      )}

      {/* Header Information */}
      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Straightener Selection Utility
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Customer"
            name="customer"
            value={localData.customer || ""}
            onChange={handleChange}
          />
          <Input
            label="Date"
            name="date"
            type="date"
            value={localData.dates?.date || ""}
            onChange={handleChange}
          />
        </div>
      </Card>

      {/* Straightener Specifications */}
      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Straightener Specifications
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select
            label="Payoff"
            name="straightener.payoff"
            value={localData.straightener?.payoff || ""}
            onChange={handleChange}
            options={PAYOFF_OPTIONS}
          />
          <Select
            label="Str. Model"
            name="straightener.model"
            value={localData.straightener?.model || ""}
            onChange={handleChange}
            options={STR_MODEL_OPTIONS}
          />
          <Select
            label="Str. Width (in.)"
            name="straightener.width"
            value={String(localData.straightener?.width ?? "")}
            onChange={handleChange}
            options={STR_WIDTH_OPTIONS}
          />
          <Input
            label="No. of Str. Rolls"
            name="straightener.rolls.numberOfRolls"
            type="number"
            value={localData.straightener?.rolls?.numberOfRolls || ""}
            onChange={handleChange}
          />
        </div>
      </Card>

      {/* Coil Information */}
      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Coil Information
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            label="Coil Wt. Capacity (lbs)"
            name="straightener.actualCoilWeight"
            type="number"
            value={localData.straightener?.actualCoilWeight || ""}
            onChange={handleChange}
          />
          <Input
            label="Coil ID. (in)"
            name="coil.coilID"
            type="number"
            value={localData.coil?.coilID || ""}
            onChange={handleChange}
          />
          <Input
            label="Coil Width (in)"
            name="material.coilWidth"
            type="number"
            value={localData.material?.coilWidth || ""}
            onChange={handleChange}
          />
          <Input
            label="Thickness (in)"
            name="material.materialThickness"
            type="number"
            value={localData.material?.materialThickness || ""}
            onChange={handleChange}
          />
          <Input
            label="Yield Strength (psi)"
            name="material.maxYieldStrength"
            type="number"
            value={localData.material?.maxYieldStrength || ""}
            onChange={handleChange}
          />
          <Select
            label="Material"
            name="material.materialType"
            value={localData.material?.materialType || ""}
            onChange={handleChange}
            options={MATERIAL_TYPE_OPTIONS}
          />
        </div>
      </Card>

      {/* Operating Parameters */}
      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Operating Parameters
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select
            label="Horse Power (HP)"
            name="straightener.horsepower"
            value={String(localData.straightener?.horsepower ?? "")}
            onChange={handleChange}
            options={STR_HORSEPOWER_OPTIONS}
          />
          <Input
            label="Acceleration (ft/sec²)"
            name="straightener.acceleration"
            type="number"
            value={localData.straightener?.acceleration || ""}
            onChange={handleChange}
          />
          <Select
            label="Feed Rate (ft/min)"
            name="straightener.feedRate"
            value={String(localData.straightener?.feedRate ?? "")}
            onChange={handleChange}
            options={STR_FEED_RATE_OPTIONS}
          />
          <Select
            label="Auto. Brake Compen."
            name="straightener.autoBrakeCompensation"
            value={localData.straightener?.autoBrakeCompensation || ""}
            onChange={handleChange}
            options={YES_NO_OPTIONS}
          />
        </div>
      </Card>

      {/* Physical Parameters */}
      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Physical Parameters
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            label="Str. Roll Dia. (in)"
            name="straightener.rolls.straightener.diameter"
            type="number"
            value={localData.straightener?.rolls?.straightener?.diameter || ""}
            onChange={handleChange}
          />
          <Input
            label="Pinch Roll Dia. (in)"
            name="straightener.rolls.pinch.diameter"
            type="number"
            value={localData.straightener?.rolls?.pinch?.diameter || ""}
            onChange={handleChange}
          />
          <Input
            label="Center Dist. (in)"
            name="straightener.centerDistance"
            type="number"
            value={localData.straightener?.centerDistance || ""}
            onChange={handleChange}
          />
          <Input
            label="Jack Force Avail. (lbs)"
            name="straightener.jackForceAvailable"
            type="number"
            value={localData.straightener?.jackForceAvailable || ""}
            onChange={handleChange}
          />
          <Input
            label="Max. Roll Depth (in)"
            name="straightener.rolls.depth.withoutMaterial"
            type="number"
            value={localData.straightener?.rolls?.depth?.withoutMaterial || ""}
            onChange={handleChange}
          />
          <Input
            label="Modulus (psi)"
            name="straightener.modulus"
            type="number"
            value={localData.straightener?.modulus || ""}
            onChange={handleChange}
          />
        </div>
      </Card>

      {/* Gears Data */}
      <Card className="mb-0 p-4">
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
                value={localData.straightener?.gear?.pinchRoll?.numberOfTeeth || ""}
                onChange={handleChange}
              />
              <Input
                label="DP"
                name="straightener.gear.pinchRoll.dp"
                type="number"
                value={localData.straightener?.gear?.pinchRoll?.dp || ""}
                onChange={handleChange}
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
                value={localData.straightener?.gear?.straightenerRoll?.numberOfTeeth || ""}
                onChange={handleChange}
              />
              <Input
                label="DP"
                name="straightener.gear.straightenerRoll.dp"
                type="number"
                value={localData.straightener?.gear?.straightenerRoll?.dp || ""}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Input
            label="Face Width (in)"
            name="straightener.gear.faceWidth"
            type="number"
            value={localData.straightener?.gear?.faceWidth || ""}
            onChange={handleChange}
          />
          <Input
            label="Cont. Angle (degree)"
            name="straightener.gear.contAngle"
            type="number"
            value={localData.straightener?.gear?.contAngle || ""}
            onChange={handleChange}
          />
        </div>
      </Card>

      {/* Calculations & Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                value={localData.straightener?.required?.force || ""}
                readOnly
              />
              <Input
                label="Rated Force (lbs)"
                name="straightener.required.ratedForce"
                value={localData.straightener?.required?.ratedForce || ""}
                readOnly
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Pinch Roll Req. Torque"
                name="straightener.rolls.pinch.requiredGearTorque"
                value={localData.straightener?.rolls?.pinch?.requiredGearTorque || ""}
                readOnly
              />
              <Input
                label="Pinch Roll Rated Torque"
                name="straightener.rolls.pinch.ratedTorque"
                value={localData.straightener?.rolls?.pinch?.ratedTorque || ""}
                readOnly
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Str. Roll Req. Torque"
                name="straightener.rolls.straightener.requiredGearTorque"
                value={localData.straightener?.rolls?.straightener?.requiredGearTorque || ""}
                readOnly
              />
              <Input
                label="Str. Roll Rated Torque"
                name="straightener.rolls.straightener.ratedTorque"
                value={localData.straightener?.rolls?.straightener?.ratedTorque || ""}
                readOnly
              />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Horse Power Required (HP)"
                name="straightener.required.horsepower"
                value={localData.straightener?.required?.horsepower || ""}
                readOnly
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
                value={localData.straightener?.actualCoilWeight || ""}
                readOnly
              />
              <Input
                label="Coil OD. (in)"
                name="straightener.coilOD"
                value={localData.straightener?.coilOD || ""}
                readOnly
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Str. Torque (in lbs)"
                name="straightener.torque.straightener"
                value={localData.straightener?.torque?.straightener || ""}
                readOnly
              />
              <Input
                label="Accel. Torque (in lbs)"
                name="straightener.torque.acceleration"
                value={localData.straightener?.torque?.acceleration || ""}
                readOnly
              />
              <Input
                label="Brake Torque (in lbs)"
                name="straightener.torque.brake"
                value={localData.straightener?.torque?.brake || ""}
                readOnly
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Status Indicators */}
      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Status & Recommendations
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className={`p-3 rounded text-center font-medium ${
            getJackForceStatus().includes('OK') ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
          }`}>
            <Text className="text-sm">{getJackForceStatus()}</Text>
            <Text className="text-xs mt-1">Back Up Rolls Recommended</Text>
          </div>
          <div className={`p-3 rounded text-center font-medium ${
            getPinchGearStatus().includes('OK') ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
          }`}>
            <Text className="text-sm">{getPinchGearStatus()}</Text>
          </div>
          <div className={`p-3 rounded text-center font-medium ${
            getStrGearStatus().includes('OK') ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
          }`}>
            <Text className="text-sm">{getStrGearStatus()}</Text>
          </div>
          <div className={`p-3 rounded text-center font-medium ${
            getHpStatus().includes('SUFFICIENT') ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
          }`}>
            <Text className="text-sm">{getHpStatus()}</Text>
          </div>
          <div className={`p-3 rounded text-center font-medium ${
            getFpmStatus().includes('SUFFICIENT') ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
          }`}>
            <Text className="text-sm">{getFpmStatus()}</Text>
          </div>
          <div className="p-3 rounded text-center font-medium bg-green-100 text-green-800">
            <Text className="text-sm">All Str. Utility OK</Text>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default StrUtility;