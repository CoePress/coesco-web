import { useEffect, useRef, useState } from "react";
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
import { useParams } from "react-router-dom";
import { useGetEntity } from "@/hooks/_base/use-get-entity";

export interface TDDBHDProps {
  data: PerformanceData;
  isEditing: boolean;
}

const TDDBHD: React.FC<TDDBHDProps> = ({ data, isEditing }) => {
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
        // Handle top-level fields
        updatedData[name] = type === "number" ? (value === "" ? "" : value) : value;
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
          updatedData[name] = type === "number" ? (value === "" ? "" : value) : value;
        }

        console.log("Updating with complete data structure:", updatedData);

        // Send to backend (this will also trigger calculations)
        const response = await updateEntity(performanceSheetId, { data: updatedData });
        
        console.log("Backend response:", response);
        
        // Handle calculated values directly from the backend response
        if (response && response.data && response.data.reel) {
          console.log("Updating calculated reel values from backend response");
          
          setLocalData(prevData => ({
            ...prevData,
            reel: {
              ...prevData.reel,
              // Update calculated fields from response
              torque: {
                ...prevData.reel?.torque,
                atMandrel: response.data.reel.torque?.atMandrel || prevData.reel?.torque?.atMandrel,
                rewindRequired: response.data.reel.torque?.rewindRequired || prevData.reel?.torque?.rewindRequired,
                required: response.data.reel.torque?.required || prevData.reel?.torque?.required,
              },
              holddown: {
                ...prevData.reel?.holddown,
                force: {
                  ...prevData.reel?.holddown?.force,
                  required: response.data.reel.holddown?.force?.required || prevData.reel?.holddown?.force?.required,
                  available: response.data.reel.holddown?.force?.available || prevData.reel?.holddown?.force?.available,
                }
              },
              dragBrake: {
                ...prevData.reel?.dragBrake,
                psiAirRequired: response.data.reel.dragBrake?.psiAirRequired || prevData.reel?.dragBrake?.psiAirRequired,
                holdingForce: response.data.reel.dragBrake?.holdingForce || prevData.reel?.dragBrake?.holdingForce,
              },
              webTension: {
                ...prevData.reel?.webTension,
                psi: response.data.reel.webTension?.psi || prevData.reel?.webTension?.psi,
                lbs: response.data.reel.webTension?.lbs || prevData.reel?.webTension?.lbs,
              }
            }
          }));
          
          console.log("Updated calculated reel values:", {
            torqueAtMandrel: response.data.reel.torque?.atMandrel,
            torqueRewindRequired: response.data.reel.torque?.rewindRequired,
            torqueRequired: response.data.reel.torque?.required,
            holddownForceRequired: response.data.reel.holddown?.force?.required,
            holddownForceAvailable: response.data.reel.holddown?.force?.available,
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

      {/* Customer and Date Info */}
      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Customer & Date
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Customer"
            name="customer"
            value={localData.customer || ""}
            onChange={handleChange}
          />
          <Input
            label="Date"
            name="dates.date"
            type="date"
            value={localData.dates?.date || ""}
            onChange={handleChange}
          />
        </div>
      </Card>
      
      {/* Reel & Material Specs */}
      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Reel & Material Specs
        </Text>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <Select
            label="Reel Model"
            name="reel.model"
            value={localData.reel?.model !== undefined 
                && localData.reel?.model !== null ? String(localData.reel.model) : ""}
            onChange={handleChange}
            options={REEL_MODEL_OPTIONS.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
          />
          <Select
            label="Reel Width"
            name="reel.width"
            value={localData.reel?.width !== undefined 
                && localData.reel?.width !== null ? String(localData.reel.width) : ""}
            onChange={handleChange}
            options={REEL_WIDTTH_OPTIONS.map((opt) => ({
              value: opt.value,
              label: opt.Label,
            }))}
          />
          <Select
            label="Backplate Diameter"
            name="reel.backplate.diameter"
            value={localData.reel?.backplate?.diameter !== undefined 
                && localData.reel?.backplate?.diameter !== null ? String(localData.reel.backplate.diameter) : ""}
            onChange={handleChange}
            options={BACKPLATE_DIAMETER_OPTIONS.map((opt) => ({
              value: opt.value,
              label: opt.Label,
            }))}
          />
          <Select
            label="Material Type"
            name="material.materialType"
            value={localData.material?.materialType || ""}
            onChange={handleChange}
            options={MATERIAL_TYPE_OPTIONS}
          />
          <Input
            label="Material Width (in)"
            name="material.coilWidth"
            value={localData.material?.coilWidth || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Material Thickness (in)"
            name="material.materialThickness"
            value={localData.material?.materialThickness || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Material Yield Strength (psi)"
            name="material.maxYieldStrength"
            value={localData.material?.maxYieldStrength || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Air Pressure Available (psi)"
            name="reel.airPressureAvailable"
            value={localData.reel?.airPressureAvailable || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Required Decel. Rate (ft/sec²)"
            name="reel.requiredDecelRate"
            value={localData.reel?.requiredDecelRate || ""}
            onChange={handleChange}
            type="number"
          />
        </div>
        
        {/* Coil, Brake & Other Specs */}
        <Card className="mb-4 p-4">
          <Text as="h3" className="mb-4 text-lg font-medium">
            Coil, Brake & Other Specs
          </Text>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Input
              label="Coil Weight (lbs)"
              name="coil.maxCoilWeight"
              value={localData.coil?.maxCoilWeight || ""}
              onChange={handleChange}
              type="number"
            />
            <Input
              label="Coil O.D. (in)"
              name="coil.maxCoilOD"
              value={localData.coil?.maxCoilOD || ""}
              onChange={handleChange}
              type="number"
            />
            <Input
              label="Disp. (Reel) Mtr."
              name="reel.dispReelMtr"
              value={localData.reel?.dispReelMtr || ""}
              onChange={handleChange}
            />
            <Input
              label="Web Tension (psi)"
              name="reel.webTension.psi"
              value={localData.reel?.webTension?.psi || ""}
              onChange={handleChange}
              type="number"
              readOnly
              className="bg-gray-50"
            />
            <Input
              label="Web Tension (lbs)"
              name="reel.webTension.lbs"
              value={localData.reel?.webTension?.lbs || ""}
              onChange={handleChange}
              type="number"
              readOnly
              className="bg-gray-50"
            />
            <Input
              label="Brake Pad Diameter (in)"
              name="reel.brakePadDiameter"
              value={localData.reel?.brakePadDiameter || ""}
              onChange={handleChange}
              type="number"
            />
            <Input
              label="Cylinder Bore (in)"
              name="reel.cylinderBore"
              value={localData.reel?.cylinderBore || ""}
              onChange={handleChange}
              type="number"
            />
            <Input
              label="Coefficient of Friction"
              name="reel.coefficientOfFriction"
              value={localData.reel?.coefficientOfFriction || ""}
              onChange={handleChange}
              type="number"
            />
          </div>
        </Card>
        
        {/* Threading Drive and Hold Down */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Card className="p-4">
            <Text as="h3" className="mb-4 text-lg font-medium">
              Threading Drive
            </Text>
            <div className="space-y-4">
              <Input
                label="Air Clutch"
                name="reel.threadingDrive.airClutch"
                value={localData.reel?.threadingDrive?.airClutch || ""}
                onChange={handleChange}
              />
              <Select
                label="Hyd. Threading Drive"
                name="reel.threadingDrive.hydThreadingDrive"
                value={localData.reel?.threadingDrive?.hydThreadingDrive || ""}
                onChange={handleChange}
                options={HYDRAULIC_THREADING_DRIVE_OPTIONS}
              />
              <Input
                label="Torque At Mandrel (in. lbs.)"
                name="reel.torque.atMandrel"
                value={localData.reel?.torque?.atMandrel || ""}
                onChange={handleChange}
                type="number"
                readOnly
                className="bg-gray-50"
              />
              <Input
                label="Rewind Torque Req. (in. lbs.)"
                name="reel.torque.rewindRequired"
                value={localData.reel?.torque?.rewindRequired || ""}
                onChange={handleChange}
                type="number"
                readOnly
                className="bg-gray-50"
              />
            </div>
          </Card>
          
          <Card className="p-4">
            <Text as="h3" className="mb-4 text-lg font-medium">
              Hold Down
            </Text>
            <div className="space-y-4">
              <Select
                label="Hold Down Assy"
                name="reel.holddown.assy"
                value={localData.reel?.holddown?.assy || ""}
                onChange={handleChange}
                options={HOLD_DOWN_ASSY_OPTIONS}
              />
              <Input
                label="Holddown Pressure (psi)"
                name="reel.holddown.cylinderPressure"
                value={localData.reel?.holddown?.cylinderPressure || ""}
                onChange={handleChange}
                type="number"
              />
              <Input
                label="Hold Down Force Required (lbs)"
                name="reel.holddown.force.required"
                value={localData.reel?.holddown?.force?.required || ""}
                onChange={handleChange}
                type="number"
                readOnly
                className="bg-gray-50"
              />
              <Input
                label="Hold Down Force Available (lbs)"
                name="reel.holddown.force.available"
                value={localData.reel?.holddown?.force?.available || ""}
                onChange={handleChange}
                type="number"
                readOnly
                className="bg-gray-50"
              />
              <Input
                label="Min. Material Width (in)"
                name="reel.minMaterialWidth"
                value={localData.reel?.minMaterialWidth || ""}
                onChange={handleChange}
                type="number"
              />
            </div>
          </Card>
        </div>
        
        {/* Cylinder and Drag Brake */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Card className="p-4">
            <Text as="h3" className="mb-4 text-lg font-medium">
              Cylinder
            </Text>
            <div className="space-y-4">
              <Select
                label="Type"
                name="reel.holddown.cylinder"
                value={localData.reel?.holddown?.cylinder || ""}
                onChange={handleChange}
                options={HOLD_DOWN_CYLINDER_OPTIONS}
              />
              <Input
                label="Pressure (psi)"
                name="reel.holddown.cylinderPressure"
                value={localData.reel?.holddown?.cylinderPressure || ""}
                onChange={handleChange}
                type="number"
              />
            </div>
          </Card>
          
          <Card className="p-4">
            <Text as="h3" className="mb-4 text-lg font-medium">
              Drag Brake
            </Text>
            <div className="space-y-4">
              <Select
                label="Brake Model"
                name="reel.dragBrake.model"
                value={localData.reel?.dragBrake?.model || ""}
                onChange={handleChange}
                options={BRAKE_MODEL_OPTIONS}
              />
              <Select
                label="Brake Quantity"
                name="reel.dragBrake.quantity"
                value={localData.reel?.dragBrake?.quantity !== undefined 
                    && localData.reel?.dragBrake?.quantity !== null ? String(localData.reel.dragBrake.quantity) : ""}
                onChange={handleChange}
                options={BRAKE_QUANTITY_OPTIONS}
              />
              <Input
                label="Torque Required (in. lbs.)"
                name="reel.torque.required"
                value={localData.reel?.torque?.required || ""}
                onChange={handleChange}
                type="number"
                readOnly
                className="bg-gray-50"
              />
              <Input
                label="Failsafe - Single Stage (psi air req.)"
                name="reel.dragBrake.psiAirRequired"
                value={localData.reel?.dragBrake?.psiAirRequired || ""}
                onChange={handleChange}
                type="number"
                readOnly
                className="bg-gray-50"
              />
              <Input
                label="Failsafe Holding Force (in. lbs.)"
                name="reel.dragBrake.holdingForce"
                value={localData.reel?.dragBrake?.holdingForce || ""}
                onChange={handleChange}
                type="number"
                readOnly
                className="bg-gray-50"
              />
            </div>
          </Card>
        </div>
      </Card>
    </div>
  );
};

export default TDDBHD;