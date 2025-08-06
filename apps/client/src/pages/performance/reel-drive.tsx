import { useEffect, useRef, useState } from "react";
import Card from "@/components/common/card";
import Input from "@/components/common/input";
import Text from "@/components/common/text";
import Select from "@/components/common/select";
import { PerformanceData } from "@/contexts/performance.context";
import { 
  REEL_MODEL_OPTIONS,
  REEL_HORSEPOWER_OPTIONS,
 } from "@/utils/select-options";
import { useUpdateEntity } from "@/hooks/_base/use-update-entity";
import { useParams } from "react-router-dom";
import { useGetEntity } from "@/hooks/_base/use-get-entity";

export interface ReelDriveProps {
  data: PerformanceData;
  isEditing: boolean;
}

const ReelDrive: React.FC<ReelDriveProps> = ({ data, isEditing }) => {
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
          reelModel: { path: "reel.model", value: value },
          hp: { path: "reel.horsepower", value: value },
          reelSize: { path: "reel.width", value: value },
          reelMaxWidth: { path: "reel.width", value: value },
          reelBrgDist: { path: "reel.bearing.distance", value: value },
          reelFBrgDia: { path: "reel.bearing.diameter.front", value: value },
          reelRBrgDia: { path: "reel.bearing.diameter.rear", value: value },
          mandrelDiameter: { path: "reel.mandrel.diameter", value: value },
          mandrelLength: { path: "reel.mandrel.length", value: value },
          mandrelMaxRPM: { path: "reel.mandrel.maxRPM", value: value },
          mandrelRPMFull: { path: "reel.mandrel.RpmFull", value: value },
          mandrelWeight: { path: "reel.mandrel.weight", value: value },
          mandrelInertia: { path: "reel.mandrel.inertia", value: value },
          mandrelReflInert: { path: "reel.mandrel.reflInertia", value: value },
          backplateDiameter: { path: "reel.backplate.diameter", value: value },
          backplateThickness: { path: "reel.backplate.thickness", value: value },
          backplateWeight: { path: "reel.backplate.weight", value: value },
          backplateInertia: { path: "reel.backplate.inertia", value: value },
          backplateReflInert: { path: "reel.backplate.reflInertia", value: value },
          coilDensity: { path: "coil.density", value: value },
          coilOD: { path: "coil.maxCoilOD", value: value },
          coilID: { path: "coil.coilID", value: value },
          coilWidth: { path: "material.coilWidth", value: value },
          coilWeight: { path: "coil.maxCoilWeight", value: value },
          reducerRatio: { path: "reel.reducer.ratio", value: value },
          reducerEfficiency: { path: "reel.reducer.efficiency", value: value },
          reducerDriving: { path: "reel.reducer.driving", value: value },
          reducerBackdriving: { path: "reel.reducer.backdriving", value: value },
          reducerInertia: { path: "reel.reducer.inertia", value: value },
          reducerReflInert: { path: "reel.reducer.reflInertia", value: value },
          chainRatio: { path: "reel.chain.ratio", value: value },
          chainSprktOD: { path: "reel.chain.sprktOD", value: value },
          chainSprktThk: { path: "reel.chain.sprktThickness", value: value },
          chainWeight: { path: "reel.chain.weight", value: value },
          chainInertia: { path: "reel.chain.inertia", value: value },
          chainReflInert: { path: "reel.chain.reflInertia", value: value },
          totalRatio: { path: "reel.ratio", value: value },
          totalReflInertiaEmpty: { path: "reel.totalReflInertia.empty", value: value },
          totalReflInertiaFull: { path: "reel.totalReflInertia.full", value: value },
          motorHP: { path: "reel.horsepower", value: value },
          motorInertia: { path: "reel.motor.inertia", value: value },
          motorBaseRPM: { path: "reel.motor.rpm.base", value: value },
          motorRPMFull: { path: "reel.motor.rpm.full", value: value },
          frictionRBrgMand: { path: "reel.friction.bearing.mandrel.rear", value: value },
          frictionFBrgMand: { path: "reel.friction.bearing.mandrel.front", value: value },
          frictionFBrgCoil: { path: "reel.friction.bearing.coil.front", value: value },
          frictionTotalEmpty: { path: "reel.friction.bearing.total.empty", value: value },
          frictionTotalFull: { path: "reel.friction.bearing.total.full", value: value },
          frictionReflEmpty: { path: "reel.friction.bearing.refl.empty", value: value },
          frictionReflFull: { path: "reel.friction.bearing.refl.full", value: value },
          speed: { path: "reel.speed", value: value },
          accelRate: { path: "reel.motorization.accelRate", value: value },
          accelTime: { path: "reel.accelerationTime", value: value },
          torqueEmpty: { path: "reel.torque.empty.torque", value: value },
          torqueFull: { path: "reel.torque.full.torque", value: value },
          hpReqdEmpty: { path: "reel.torque.empty.horsepowerRequired", value: value },
          hpReqdFull: { path: "reel.torque.full.horsepowerRequired", value: value },
          regenEmpty: { path: "reel.torque.empty.regen", value: value },
          regenFull: { path: "reel.torque.full.regen", value: value },
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
            reelModel: { path: "reel.model", value: value },
            hp: { path: "reel.horsepower", value: value },
            reelSize: { path: "reel.width", value: value },
            reelMaxWidth: { path: "reel.width", value: value },
            reelBrgDist: { path: "reel.bearing.distance", value: value },
            reelFBrgDia: { path: "reel.bearing.diameter.front", value: value },
            reelRBrgDia: { path: "reel.bearing.diameter.rear", value: value },
            mandrelDiameter: { path: "reel.mandrel.diameter", value: value },
            mandrelLength: { path: "reel.mandrel.length", value: value },
            mandrelMaxRPM: { path: "reel.mandrel.maxRPM", value: value },
            mandrelRPMFull: { path: "reel.mandrel.RpmFull", value: value },
            mandrelWeight: { path: "reel.mandrel.weight", value: value },
            mandrelInertia: { path: "reel.mandrel.inertia", value: value },
            mandrelReflInert: { path: "reel.mandrel.reflInertia", value: value },
            backplateDiameter: { path: "reel.backplate.diameter", value: value },
            backplateThickness: { path: "reel.backplate.thickness", value: value },
            backplateWeight: { path: "reel.backplate.weight", value: value },
            backplateInertia: { path: "reel.backplate.inertia", value: value },
            backplateReflInert: { path: "reel.backplate.reflInertia", value: value },
            coilDensity: { path: "coil.density", value: value },
            coilOD: { path: "coil.maxCoilOD", value: value },
            coilID: { path: "coil.coilID", value: value },
            coilWidth: { path: "material.coilWidth", value: value },
            coilWeight: { path: "coil.maxCoilWeight", value: value },
            reducerRatio: { path: "reel.reducer.ratio", value: value },
            reducerEfficiency: { path: "reel.reducer.efficiency", value: value },
            reducerDriving: { path: "reel.reducer.driving", value: value },
            reducerBackdriving: { path: "reel.reducer.backdriving", value: value },
            reducerInertia: { path: "reel.reducer.inertia", value: value },
            reducerReflInert: { path: "reel.reducer.reflInertia", value: value },
            chainRatio: { path: "reel.chain.ratio", value: value },
            chainSprktOD: { path: "reel.chain.sprktOD", value: value },
            chainSprktThk: { path: "reel.chain.sprktThickness", value: value },
            chainWeight: { path: "reel.chain.weight", value: value },
            chainInertia: { path: "reel.chain.inertia", value: value },
            chainReflInert: { path: "reel.chain.reflInertia", value: value },
            totalRatio: { path: "reel.ratio", value: value },
            totalReflInertiaEmpty: { path: "reel.totalReflInertia.empty", value: value },
            totalReflInertiaFull: { path: "reel.totalReflInertia.full", value: value },
            motorHP: { path: "reel.horsepower", value: value },
            motorInertia: { path: "reel.motor.inertia", value: value },
            motorBaseRPM: { path: "reel.motor.rpm.base", value: value },
            motorRPMFull: { path: "reel.motor.rpm.full", value: value },
            frictionRBrgMand: { path: "reel.friction.bearing.mandrel.rear", value: value },
            frictionFBrgMand: { path: "reel.friction.bearing.mandrel.front", value: value },
            frictionFBrgCoil: { path: "reel.friction.bearing.coil.front", value: value },
            frictionTotalEmpty: { path: "reel.friction.bearing.total.empty", value: value },
            frictionTotalFull: { path: "reel.friction.bearing.total.full", value: value },
            frictionReflEmpty: { path: "reel.friction.bearing.refl.empty", value: value },
            frictionReflFull: { path: "reel.friction.bearing.refl.full", value: value },
            speed: { path: "reel.speed", value: value },
            accelRate: { path: "reel.motorization.accelRate", value: value },
            accelTime: { path: "reel.accelerationTime", value: value },
            torqueEmpty: { path: "reel.torque.empty.torque", value: value },
            torqueFull: { path: "reel.torque.full.torque", value: value },
            hpReqdEmpty: { path: "reel.torque.empty.horsepowerRequired", value: value },
            hpReqdFull: { path: "reel.torque.full.horsepowerRequired", value: value },
            regenEmpty: { path: "reel.torque.empty.regen", value: value },
            regenFull: { path: "reel.torque.full.regen", value: value },
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
        if (response && response.data && response.data.reel) {
          console.log("Updating calculated reel drive values from backend response");
          
          setLocalData(prevData => ({
            ...prevData,
            reel: {
              ...prevData.reel,
              // Update calculated fields from response
              mandrel: {
                ...prevData.reel?.mandrel,
                weight: response.data.reel.mandrel?.weight || prevData.reel?.mandrel?.weight,
                inertia: response.data.reel.mandrel?.inertia || prevData.reel?.mandrel?.inertia,
                reflInertia: response.data.reel.mandrel?.reflInertia || prevData.reel?.mandrel?.reflInertia,
                maxRPM: response.data.reel.mandrel?.maxRPM || prevData.reel?.mandrel?.maxRPM,
                RpmFull: response.data.reel.mandrel?.RpmFull || prevData.reel?.mandrel?.RpmFull,
              },
              backplate: {
                ...prevData.reel?.backplate,
                weight: response.data.reel.backplate?.weight || prevData.reel?.backplate?.weight,
                inertia: response.data.reel.backplate?.inertia || prevData.reel?.backplate?.inertia,
                reflInertia: response.data.reel.backplate?.reflInertia || prevData.reel?.backplate?.reflInertia,
              },
              coil: {
                ...prevData.coil,
                inertia: response.data.reel.coil?.inertia || prevData.coil?.inertia,
                reflInertia: response.data.reel.coil?.reflInertia || prevData.coil?.reflInertia,
              },
              reducer: {
                ...prevData.reel?.reducer,
                reflInertia: response.data.reel.reducer?.reflInertia || prevData.reel?.reducer?.reflInertia,
              },
              chain: {
                ...prevData.reel?.chain,
                inertia: response.data.reel.chain?.inertia || prevData.reel?.chain?.inertia,
                reflInertia: response.data.reel.chain?.reflInertia || prevData.reel?.chain?.reflInertia,
              },
              totalReflInertia: {
                ...prevData.reel?.totalReflInertia,
                empty: response.data.reel.totalReflInertia?.empty || prevData.reel?.totalReflInertia?.empty,
                full: response.data.reel.totalReflInertia?.full || prevData.reel?.totalReflInertia?.full,
              },
              friction: {
                ...prevData.reel?.friction,
                bearing: {
                  ...prevData.reel?.friction?.bearing,
                  mandrel: {
                    ...prevData.reel?.friction?.bearing?.mandrel,
                    rear: response.data.reel.friction?.bearing?.mandrel?.rear || prevData.reel?.friction?.bearing?.mandrel?.rear,
                    front: response.data.reel.friction?.bearing?.mandrel?.front || prevData.reel?.friction?.bearing?.mandrel?.front,
                  },
                  coil: {
                    ...prevData.reel?.friction?.bearing?.coil,
                    front: response.data.reel.friction?.bearing?.coil?.front || prevData.reel?.friction?.bearing?.coil?.front,
                    rear: response.data.reel.friction?.bearing?.coil?.rear || prevData.reel?.friction?.bearing?.coil?.rear,
                  },
                  total: {
                    ...prevData.reel?.friction?.bearing?.total,
                    empty: response.data.reel.friction?.bearing?.total?.empty || prevData.reel?.friction?.bearing?.total?.empty,
                    full: response.data.reel.friction?.bearing?.total?.full || prevData.reel?.friction?.bearing?.total?.full,
                  },
                  refl: {
                    ...prevData.reel?.friction?.bearing?.refl,
                    empty: response.data.reel.friction?.bearing?.refl?.empty || prevData.reel?.friction?.bearing?.refl?.empty,
                    full: response.data.reel.friction?.bearing?.refl?.full || prevData.reel?.friction?.bearing?.refl?.full,
                  }
                }
              },
              torque: {
                ...prevData.reel?.torque,
                empty: {
                  ...prevData.reel?.torque?.empty,
                  torque: response.data.reel.torque?.empty?.torque || prevData.reel?.torque?.empty?.torque,
                  horsepowerRequired: response.data.reel.torque?.empty?.horsepowerRequired || prevData.reel?.torque?.empty?.horsepowerRequired,
                  regen: response.data.reel.torque?.empty?.regen || prevData.reel?.torque?.empty?.regen,
                },
                full: {
                  ...prevData.reel?.torque?.full,
                  torque: response.data.reel.torque?.full?.torque || prevData.reel?.torque?.full?.torque,
                  horsepowerRequired: response.data.reel.torque?.full?.horsepowerRequired || prevData.reel?.torque?.full?.horsepowerRequired,
                  regen: response.data.reel.torque?.full?.regen || prevData.reel?.torque?.full?.regen,
                }
              }
            }
          }));
          
          console.log("Updated calculated reel drive values:", {
            mandrelWeight: response.data.reel.mandrel?.weight,
            mandrelInertia: response.data.reel.mandrel?.inertia,
            backplateWeight: response.data.reel.backplate?.weight,
            backplateInertia: response.data.reel.backplate?.inertia,
            torqueEmpty: response.data.reel.torque?.empty?.torque,
            torqueFull: response.data.reel.torque?.full?.torque,
            hpEmpty: response.data.reel.torque?.empty?.horsepowerRequired,
            hpFull: response.data.reel.torque?.full?.horsepowerRequired,
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
            name="date"
            type="date"
            value={localData.dates?.date || ""}
            onChange={handleChange}
          />
        </div>
      </Card>
      
      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Model & HP
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            label="HP"
            name="hp"
            value={localData.reel?.horsepower !== undefined
                && localData.reel?.horsepower !== null ? String(localData.reel.horsepower) : ""}
            onChange={handleChange}
            options={REEL_HORSEPOWER_OPTIONS.map((opt) => ({
              value: String(opt.value),
              label: opt.label,
            }))}
          />
        </div>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {/* REEL */}
        <Card className="p-4">
          <Text as="h3" className="mb-4 text-lg font-medium">
            Reel
          </Text>
          <div className="space-y-2">
            <Input
              id="reelSize"
              name="reelSize"
              label="SIZE"
              value={localData.reel?.width || ""}
              onChange={handleChange}
            />
            <Input
              id="reelMaxWidth"
              name="reelMaxWidth"
              label="MAX WIDTH"
              value={localData.reel?.width || ""}
              onChange={handleChange}
            />
            <Input
              id="reelBrgDist"
              name="reelBrgDist"
              label="BRG. DIST."
              value={localData.reel?.bearing?.distance || ""}
              onChange={handleChange}
            />
            <Input
              id="reelFBrgDia"
              name="reelFBrgDia"
              label="F. BRG. DIA."
              value={localData.reel?.bearing?.diameter?.front || ""}
              onChange={handleChange}
            />
            <Input
              id="reelRBrgDia"
              name="reelRBrgDia"
              label="R. BRG. DIA."
              value={localData.reel?.bearing?.diameter?.rear || ""}
              onChange={handleChange}
            />
          </div>
        </Card>
        
        {/* MANDREL */}
        <Card className="p-4">
          <Text as="h3" className="mb-4 text-lg font-medium">
            Mandrel
          </Text>
          <div className="space-y-2">
            <Input
              id="mandrelDiameter"
              name="mandrelDiameter"
              label="DIAMETER"
              value={localData.reel?.mandrel?.diameter || ""}
              onChange={handleChange}
            />
            <Input
              id="mandrelLength"
              name="mandrelLength"
              label="LENGTH"
              value={localData.reel?.mandrel?.length || ""}
              onChange={handleChange}
            />
            <Input
              id="mandrelMaxRPM"
              name="mandrelMaxRPM"
              label="MAX RPM"
              value={localData.reel?.mandrel?.maxRPM || ""}
              onChange={handleChange}
              readOnly
            />
            <Input
              id="mandrelRPMFull"
              name="mandrelRPMFull"
              label="RPM FULL"
              value={localData.reel?.mandrel?.RpmFull || ""}
              onChange={handleChange}
              readOnly
            />
            <Input
              id="mandrelWeight"
              name="mandrelWeight"
              label="WEIGHT"
              value={localData.reel?.mandrel?.weight || ""}
              onChange={handleChange}
              readOnly
            />
            <Input
              id="mandrelInertia"
              name="mandrelInertia"
              label="INERTIA"
              value={localData.reel?.mandrel?.inertia || ""}
              onChange={handleChange}
              readOnly
            />
            <Input
              id="mandrelReflInert"
              name="mandrelReflInert"
              label="REFL. INERT."
              value={localData.reel?.mandrel?.reflInertia || ""}
              onChange={handleChange}
              readOnly
            />
          </div>
        </Card>
        
        {/* BACKPLATE */}
        <Card className="p-4">
          <Text as="h3" className="mb-4 text-lg font-medium">
            Backplate
          </Text>
          <div className="space-y-2">
            <Input
              id="backplateDiameter"
              name="backplateDiameter"
              label="DIAMETER"
              value={localData.reel?.backplate?.diameter || ""}
              onChange={handleChange}
            />
            <Input
              id="backplateThickness"
              name="backplateThickness"
              label="THICKNESS"
              value={localData.reel?.backplate?.thickness || ""}
              onChange={handleChange}
            />
            <Input
              id="backplateWeight"
              name="backplateWeight"
              label="WEIGHT"
              value={localData.reel?.backplate?.weight || ""}
              onChange={handleChange}
              readOnly
            />
            <Input
              id="backplateInertia"
              name="backplateInertia"
              label="INERTIA"
              value={localData.reel?.backplate?.inertia || ""}
              onChange={handleChange}
              readOnly
            />
            <Input
              id="backplateReflInert"
              name="backplateReflInert"
              label="REFL. INERT."
              value={localData.reel?.backplate?.reflInertia || ""}
              onChange={handleChange}
              readOnly
            />
          </div>
        </Card>
        
        {/* COIL */}
        <Card className="p-4">
          <Text as="h3" className="mb-4 text-lg font-medium">
            Coil
          </Text>
          <div className="space-y-2">
            <Input
              id="coilDensity"
              name="coilDensity"
              label="DENSITY"
              value={localData.coil?.density || ""}
              onChange={handleChange}
            />
            <Input
              id="coilOD"
              name="coilOD"
              label="O.D."
              value={localData.coil?.maxCoilOD || ""}
              onChange={handleChange}
            />
            <Input
              id="coilID"
              name="coilID"
              label="I.D."
              value={localData.coil?.coilID || ""}
              onChange={handleChange}
            />
            <Input
              id="coilWidth"
              name="coilWidth"
              label="WIDTH"
              value={localData.material?.coilWidth || ""}
              onChange={handleChange}
            />
            <Input
              id="coilWeight"
              name="coilWeight"
              label="WEIGHT"
              value={localData.coil?.maxCoilWeight || ""}
              onChange={handleChange}
            />
            <Input
              id="coilInertia"
              name="coilInertia"
              label="INERTIA"
              value={localData.coil?.inertia || ""}
              onChange={handleChange}
              readOnly
            />
            <Input
              id="coilReflInert"
              name="coilReflInert"
              label="REFL. INERT."
              value={localData.coil?.reflInertia || ""}
              onChange={handleChange}
              readOnly
            />
          </div>
        </Card>
        
        {/* REDUCER */}
        <Card className="p-4">
          <Text as="h3" className="mb-4 text-lg font-medium">
            Reducer
          </Text>
          <div className="space-y-2">
            <Input
              id="reducerRatio"
              name="reducerRatio"
              label="RATIO"
              value={localData.reel?.reducer?.ratio || ""}
              onChange={handleChange}
            />
            <Input
              id="reducerEfficiency"
              name="reducerEfficiency"
              label="EFFICIENCY"
              value={localData.reel?.reducer?.efficiency || ""}
              onChange={handleChange}
            />
            <Input
              id="reducerDriving"
              name="reducerDriving"
              label="DRIVING"
              value={localData.reel?.reducer?.driving || ""}
              onChange={handleChange}
            />
            <Input
              id="reducerBackdriving"
              name="reducerBackdriving"
              label="BACKDRIVING"
              value={localData.reel?.reducer?.backdriving || ""}
              onChange={handleChange}
            />
            <Input
              id="reducerInertia"
              name="reducerInertia"
              label="INERTIA"
              value={localData.reel?.reducer?.inertia || ""}
              onChange={handleChange}
            />
            <Input
              id="reducerReflInert"
              name="reducerReflInert"
              label="REFL. INERT."
              value={localData.reel?.reducer?.reflInertia || ""}
              onChange={handleChange}
              readOnly
            />
          </div>
        </Card>
        
        {/* CHAIN */}
        <Card className="p-4">
          <Text as="h3" className="mb-4 text-lg font-medium">
            Chain
          </Text>
          <div className="space-y-2">
            <Input
              id="chainRatio"
              name="chainRatio"
              label="RATIO"
              value={localData.reel?.chain?.ratio || ""}
              onChange={handleChange}
            />
            <Input
              id="chainSprktOD"
              name="chainSprktOD"
              label="SPRK. O.D."
              value={localData.reel?.chain?.sprktOD || ""}
              onChange={handleChange}
            />
            <Input
              id="chainSprktThk"
              name="chainSprktThk"
              label="SPRK. THK."
              value={localData.reel?.chain?.sprktThickness || ""}
              onChange={handleChange}
            />
            <Input
              id="chainWeight"
              name="chainWeight"
              label="WEIGHT"
              value={localData.reel?.chain?.weight || ""}
              onChange={handleChange}
            />
            <Input
              id="chainInertia"
              name="chainInertia"
              label="INERTIA"
              value={localData.reel?.chain?.inertia || ""}
              onChange={handleChange}
              readOnly
            />
            <Input
              id="chainReflInert"
              name="chainReflInert"
              label="REFL. INERT."
              value={localData.reel?.chain?.reflInertia || ""}
              onChange={handleChange}
              readOnly
            />
          </div>
        </Card>
        
        {/* TOTAL */}
        <Card className="p-4">
          <Text as="h3" className="mb-4 text-lg font-medium">
            Total
          </Text>
          <div className="space-y-2">
            <Input
              id="totalRatio"
              name="totalRatio"
              label="RATIO"
              value={localData.reel?.ratio || ""}
              onChange={handleChange}
              readOnly
            />
            <Input
              id="totalReflInertiaEmpty"
              name="totalReflInertiaEmpty"
              label="TOTAL REFL. INERTIA EMPTY"
              value={localData.reel?.totalReflInertia?.empty || ""}
              onChange={handleChange}
              readOnly
            />
            <Input
              id="totalReflInertiaFull"
              name="totalReflInertiaFull"
              label="TOTAL REFL. INERTIA FULL"
              value={localData.reel?.totalReflInertia?.full || ""}
              onChange={handleChange}
              readOnly
            />
          </div>
        </Card>
        
        {/* MOTOR */}
        <Card className="p-4">
          <Text as="h3" className="mb-4 text-lg font-medium">
            Motor
          </Text>
          <div className="space-y-2">
            <Input
              id="motorHP"
              name="motorHP"
              label="HP"
              value={localData.reel?.horsepower || ""}
              onChange={handleChange}
            />
            <Input
              id="motorInertia"
              name="motorInertia"
              label="INERTIA"
              value={localData.reel?.motor?.inertia || ""}
              onChange={handleChange}
            />
            <Input
              id="motorBaseRPM"
              name="motorBaseRPM"
              label="BASE RPM"
              value={localData.reel?.motor?.rpm?.base || ""}
              onChange={handleChange}
            />
            <Input
              id="motorRPMFull"
              name="motorRPMFull"
              label="RPM FULL"
              value={localData.reel?.motor?.rpm?.full || ""}
              onChange={handleChange}
            />
          </div>
        </Card>
        
        {/* FRICTION */}
        <Card className="p-4">
          <Text as="h3" className="mb-4 text-lg font-medium">
            Friction
          </Text>
          <div className="space-y-2">
            <Input
              id="frictionRBrgMand"
              name="frictionRBrgMand"
              label="R. BRG. MAND."
              value={localData.reel?.friction?.bearing?.mandrel?.rear || ""}
              onChange={handleChange}
              readOnly
            />
            <Input
              id="frictionFBrgMand"
              name="frictionFBrgMand"
              label="F. BRG. MAND."
              value={localData.reel?.friction?.bearing?.mandrel?.front || ""}
              onChange={handleChange}
              readOnly
            />
            <Input
              id="frictionFBrgCoil"
              name="frictionFBrgCoil"
              label="F. BRG. COIL"
              value={localData.reel?.friction?.bearing?.coil?.front || ""}
              onChange={handleChange}
              readOnly
            />
            <Input
              id="frictionTotalEmpty"
              name="frictionTotalEmpty"
              label="TOTAL EMPTY"
              value={localData.reel?.friction?.bearing?.total?.empty || ""}
              onChange={handleChange}
              readOnly
            />
            <Input
              id="frictionTotalFull"
              name="frictionTotalFull"
              label="TOTAL FULL"
              value={localData.reel?.friction?.bearing?.total?.full || ""}
              onChange={handleChange}
              readOnly
            />
            <Input
              id="frictionReflEmpty"
              name="frictionReflEmpty"
              label="REFL. EMPTY"
              value={localData.reel?.friction?.bearing?.refl?.empty || ""}
              onChange={handleChange}
              readOnly
            />
            <Input
              id="frictionReflFull"
              name="frictionReflFull"
              label="REFL. FULL"
              value={localData.reel?.friction?.bearing?.refl?.full || ""}
              onChange={handleChange}
              readOnly
            />
          </div>
        </Card>
        
        {/* SPEED & ACCELERATION */}
        <Card className="p-4">
          <Text as="h3" className="mb-4 text-lg font-medium">
            Speed & Acceleration
          </Text>
          <div className="space-y-2">
            <Input
              id="speed"
              name="speed"
              label="SPEED"
              value={localData.reel?.speed || ""}
              onChange={handleChange}
            />
            <Input
              id="accelRate"
              name="accelRate"
              label="ACCEL RATE"
              value={localData.reel?.motorization?.accelRate || ""}
              onChange={handleChange}
            />
            <Input
              id="accelTime"
              name="accelTime"
              label="ACCEL TIME"
              value={localData.reel?.accelerationTime || ""}
              onChange={handleChange}
              readOnly
            />
          </div>
        </Card>
        
        {/* TORQUE */}
        <Card className="p-4">
          <Text as="h3" className="mb-4 text-lg font-medium">
            Torque
          </Text>
          <div className="space-y-2">
            <Input
              id="torqueEmpty"
              name="torqueEmpty"
              label="EMPTY"
              value={localData.reel?.torque?.empty?.torque || ""}
              onChange={handleChange}
              readOnly
            />
            <Input
              id="torqueFull"
              name="torqueFull"
              label="FULL"
              value={localData.reel?.torque?.full?.torque || ""}
              onChange={handleChange}
              readOnly
            />
          </div>
        </Card>
        
        {/* HP REQ'D */}
        <Card className="p-4">
          <Text as="h3" className="mb-4 text-lg font-medium">
            HP Req'd
          </Text>
          <div className="space-y-2">
            <Input
              id="hpReqdEmpty"
              name="hpReqdEmpty"
              label="EMPTY"
              value={localData.reel?.torque?.empty?.horsepowerRequired || ""}
              onChange={handleChange}
              readOnly
            />
            <Input
              id="hpReqdFull"
              name="hpReqdFull"
              label="FULL"
              value={localData.reel?.torque?.full?.horsepowerRequired || ""}
              onChange={handleChange}
              readOnly
            />
            <div className="flex items-center">
              <label className="w-36 font-medium">OK:</label>
              <span className="bg-green-100 text-green-800 font-semibold px-2 py-1 rounded">
                OK
              </span>
            </div>
          </div>
        </Card>
        
        {/* REGEN */}
        <Card className="p-4">
          <Text as="h3" className="mb-4 text-lg font-medium">
            Regen
          </Text>
          <div className="space-y-2">
            <Input
              id="regenEmpty"
              name="regenEmpty"
              label="EMPTY"
              value={localData.reel?.torque?.empty?.regen || ""}
              onChange={handleChange}
              readOnly
            />
            <Input
              id="regenFull"
              name="regenFull"
              label="FULL"
              value={localData.reel?.torque?.full?.regen || ""}
              onChange={handleChange}
              readOnly
            />
            <div className="flex items-center">
              <label className="w-36 font-medium">YES:</label>
              <span className="bg-green-100 text-green-800 font-semibold px-2 py-1 rounded">
                YES
              </span>
            </div>
          </div>
        </Card>
        
        {/* NOTES */}
        <Card className="p-4">
          <Text as="h3" className="mb-4 text-lg font-medium">
            Notes
          </Text>
          <div className="space-y-2">
            <Input
              id="usePulloff"
              name="usePulloff"
              label="USE PULLOFF"
              value=""
              onChange={handleChange}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ReelDrive;