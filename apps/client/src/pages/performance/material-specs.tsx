import { useEffect, useRef, useState } from "react";
import Input from "@/components/common/input";
import Select from "@/components/common/select";
import Checkbox from "@/components/common/checkbox";
import Text from "@/components/common/text";
import { Card } from "@/components";
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
import { useParams } from "react-router-dom";
import { useGetEntity } from "@/hooks/_base/use-get-entity";

export interface MaterialSpecsProps {
  data: PerformanceData;
  isEditing: boolean;
}

const MaterialSpecs: React.FC<MaterialSpecsProps> = ({ data, isEditing }) => {
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

  // Get coil width boundaries from the nested structure
  const coilWidthMin = Number(localData.coil?.minCoilWidth) || undefined;
  const coilWidthMax = Number(localData.coil?.maxCoilWidth) || undefined;

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!isEditing) return;

    const { name, value, type } = e.target;
    const checked = type === "checkbox" && "checked" in e.target ? (e.target as HTMLInputElement).checked : undefined;
    const actualValue = type === "checkbox" ? checked : value;

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
        current[parts[parts.length - 1]] = type === "checkbox" ? (actualValue ? "true" : "false") : actualValue;
      } else {
        // Handle legacy field names that map to nested structure
        const fieldMappings: { [key: string]: any } = {
          referenceNumber: { path: "referenceNumber", value: value },
          customer: { path: "customer", value: value },
          date: { path: "dates.date", value: value },
          feedDirection: { path: "feed.direction", value: value },
          controlsLevel: { path: "feed.controlsLevel", value: value },
          typeOfLine: { path: "feed.typeOfLine", value: value },
          feedControls: { path: "feed.controls", value: value },
          passline: { path: "feed.passline", value: value },
          typeOfRoll: { path: "straightener.rolls.typeOfRoll", value: value },
          reelBackplate: { path: "reel.backplate.type", value: value },
          reelStyle: { path: "reel.style", value: value },
          lightGauge: { path: "feed.lightGuageNonMarking", value: actualValue ? "true" : "false" },
          nonMarking: { path: "feed.nonMarking", value: actualValue ? "true" : "false" },
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
          updatedData[name] = type === "checkbox" ? (actualValue ? "true" : "false") : actualValue;
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
          
          current[parts[parts.length - 1]] = type === "checkbox" ? (actualValue ? "true" : "false") : actualValue;
        } else {
          // Handle legacy field mappings
          const fieldMappings: { [key: string]: any } = {
            referenceNumber: { path: "referenceNumber", value: value },
            customer: { path: "customer", value: value },
            date: { path: "dates.date", value: value },
            feedDirection: { path: "feed.direction", value: value },
            controlsLevel: { path: "feed.controlsLevel", value: value },
            typeOfLine: { path: "feed.typeOfLine", value: value },
            feedControls: { path: "feed.controls", value: value },
            passline: { path: "feed.passline", value: value },
            typeOfRoll: { path: "straightener.rolls.typeOfRoll", value: value },
            reelBackplate: { path: "reel.backplate.type", value: value },
            reelStyle: { path: "reel.style", value: value },
            lightGauge: { path: "feed.lightGuageNonMarking", value: actualValue ? "true" : "false" },
            nonMarking: { path: "feed.nonMarking", value: actualValue ? "true" : "false" },
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
            updatedData[name] = type === "checkbox" ? (actualValue ? "true" : "false") : actualValue;
          }
        }

        console.log("Updating with complete data structure:", updatedData);

        // Send to backend (this will also trigger calculations)
        const response = await updateEntity(performanceSheetId, { data: updatedData });
        
        console.log("Backend response:", response);
        
        // Handle calculated values directly from the backend response
        if (response && response.data) {
          console.log("Updating calculated values from backend response");
          
          setLocalData(prevData => ({
            ...prevData,
            // Update calculated fields from response
            material: {
              ...prevData.material,
              minBendRadius: response.data.material?.minBendRadius || prevData.material?.minBendRadius,
              minLoopLength: response.data.material?.minLoopLength || prevData.material?.minLoopLength,
              calculatedCoilOD: response.data.material?.calculatedCoilOD || prevData.material?.calculatedCoilOD,
            },
            // Update any other calculated fields as needed
            feed: {
              ...prevData.feed,
              controls: response.data.feed?.controls || prevData.feed?.controls,
              // Add other calculated feed fields
            }
          }));
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

      {/* Customer and Date Card */}
      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Customer & Date
        </Text>
        <div className="grid grid-cols-2 gap-6">
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
          Material Specifications
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Coil Width (in)"
            name="material.coilWidth"
            value={localData.material?.coilWidth || ""}
            onChange={handleChange}
            type="number"
            min={coilWidthMin}
            max={coilWidthMax}
          />
          <Input
            label="Coil Weight (Max)"
            name="coil.maxCoilWeight"
            value={localData.coil?.maxCoilWeight || ""}
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
          <Select
            label="Material Type"
            name="material.materialType"
            value={localData.material?.materialType || ""}
            onChange={handleChange}
            options={MATERIAL_TYPE_OPTIONS}
          />
          <Input
            label="Yield Strength (psi)"
            name="material.maxYieldStrength"
            value={localData.material?.maxYieldStrength || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Material Tensile (psi)"
            name="material.maxTensileStrength"
            value={localData.material?.maxTensileStrength || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Coil I.D."
            name="coil.coilID"
            value={localData.coil?.coilID || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Coil O.D."
            name="coil.maxCoilOD"
            value={localData.coil?.maxCoilOD || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Min Bend Radius (in)"
            name="material.minBendRadius"
            value={localData.material?.minBendRadius || ""}
            onChange={handleChange}
            type="number"
            readOnly
          />
          <Input
            label="Min Loop Length (ft)"
            name="material.minLoopLength"
            value={localData.material?.minLoopLength || ""}
            onChange={handleChange}
            type="number"
            readOnly
          />
          <Input
            label="Coil O.D. Calculated"
            name="material.calculatedCoilOD"
            value={localData.material?.calculatedCoilOD || ""}
            onChange={handleChange}
            type="number"
            readOnly
          />
        </div>
      </Card>

      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Other Specifications
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4">
          <Select
            label="Select Feed Direction"
            name="feedDirection"
            value={localData.feed?.direction || ""}
            onChange={handleChange}
            options={FEED_DIRECTION_OPTIONS}
          />
          <Select
            label="Select Controls Level"
            name="controlsLevel"
            value={localData.feed?.controlsLevel || ""}
            onChange={handleChange}
            options={CONTROLS_LEVEL_OPTIONS}
          />
          <Select
            label="Type of Line"
            name="typeOfLine"
            value={localData.feed?.typeOfLine || ""}
            onChange={handleChange}
            options={TYPE_OF_LINE_OPTIONS}
          />
          <Input
            label="Feed Controls"
            name="feedControls"
            type="text"
            value={localData.feed?.controls || ""}
            onChange={handleChange}
            readOnly
          />
          <Select
            label="Passline"
            name="passline"
            value={localData.feed?.passline || ""}
            onChange={handleChange}
            options={PASSLINE_OPTIONS}
          />
          <Select
            label="Select Roll"
            name="typeOfRoll"
            value={localData.straightener?.rolls?.typeOfRoll || ""}
            onChange={handleChange}
            options={ROLL_TYPE_OPTIONS}
          />
          <Select
            label="Reel Backplate"
            name="reelBackplate"
            value={localData.reel?.backplate?.type || ""}
            onChange={handleChange}
            options={REEL_BACKPLATE_OPTIONS}
          />
          <Select
            label="Reel Style"
            name="reelStyle"
            value={localData.reel?.style || ""}
            onChange={handleChange}
            options={REEL_STYLE_OPTIONS}
          />
          <Checkbox
            label="Light Gauge Non-Marking"
            name="lightGauge"
            checked={localData.feed?.lightGuageNonMarking === "true"}
            onChange={handleChange}
          />
          <Checkbox
            label="Non-Marking"
            name="nonMarking"
            checked={localData.feed?.nonMarking === "true"}
            onChange={handleChange}
          />
        </div>
      </Card>
    </div>
  );
};

export default MaterialSpecs;