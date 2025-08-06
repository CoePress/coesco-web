import { useState, useEffect, useRef } from "react";
import { PerformanceData } from "@/contexts/performance.context";
import Card from "@/components/common/card";
import Input from "@/components/common/input";
import Select from "@/components/common/select";
import Text from "@/components/common/text";
import {
  FEED_MODEL_OPTIONS,
  MACHINE_WIDTH_OPTIONS,
  YES_NO_OPTIONS,
  SIGMA_5_FEED_MODEL_OPTIONS,
  SIGMA_5_PULLTHRU_FEED_MODEL_OPTIONS,
  ALLEN_BRADLEY_FEED_MODEL_OPTIONS,
} from "@/utils/select-options";
import { useUpdateEntity } from "@/hooks/_base/use-update-entity";
import { useParams } from "react-router-dom";

export interface FeedProps {
  data: PerformanceData;
  isEditing: boolean;
}

const Feed: React.FC<FeedProps> = ({ data, isEditing }) => {
  const endpoint = `/performance/sheets`;
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
  
  // Determine feed type based on current data or default
  const getFeedType = () => {
    // Fix: Convert string to boolean for comparison
    const isPullThruBool = localData.feed?.pullThru?.isPullThru === "true";
    if (isPullThruBool) {
      return "sigma-5-pull-thru";
    }
    if (localData.feed?.model?.includes("CPRF")) {
      return "sigma-5";
    }
    return "sigma-5"; // default
  };

  const [feedType, setFeedType] = useState<string>(getFeedType());

  useEffect(() => {
    setFeedType(getFeedType());
  }, [localData.feed?.model, localData.feed?.pullThru?.isPullThru]);

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
        if (response && response.data && response.data.feed) {
          console.log("Updating calculated feed values from backend response");
          
          setLocalData(prevData => ({
            ...prevData,
            feed: {
              ...prevData.feed,
              // Update calculated FPM values
              average: {
                ...prevData.feed?.average,
                fpm: response.data.feed.average?.fpm?.toString() || prevData.feed?.average?.fpm
              },
              max: {
                ...prevData.feed?.max,
                fpm: response.data.feed.max?.fpm?.toString() || prevData.feed?.max?.fpm
              },
              min: {
                ...prevData.feed?.min,
                fpm: response.data.feed.min?.fpm?.toString() || prevData.feed?.min?.fpm
              },
              // Update other calculated feed fields
              maxMotorRPM: response.data.feed.maxMotorRPM || prevData.feed?.maxMotorRPM,
              motorInertia: response.data.feed.motorInertia || prevData.feed?.motorInertia,
              maxVelocity: response.data.feed.maxVelocity || prevData.feed?.maximumVelocity,
              settleTime: response.data.feed.settleTime || prevData.feed?.settleTime,
              regen: response.data.feed.regen || prevData.feed?.regen,
              pressBedLength: response.data.feed.pressBedLength || prevData.feed?.pressBedLength,
              materialInLoop: response.data.feed.materialInLoop || prevData.feed?.materialInLoop,
            }
          }));
          
          console.log("Updated calculated feed values:", {
            averageFPM: response.data.feed.average?.fpm,
            maxFPM: response.data.feed.max?.fpm,
            minFPM: response.data.feed.min?.fpm,
            maxMotorRPM: response.data.feed.maxMotorRPM,
            regen: response.data.feed.regen,
          });
        }

      } catch (error) {
        console.error('Error updating field:', error);
        setLocalData(data);
      }
    }, 500);
  };

  const handleFeedTypeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFeedType = e.target.value;
    setFeedType(newFeedType);
    
    if (!isEditing) return;
    
    // Update local state immediately
    setLocalData(prevData => {
      const updatedData = JSON.parse(JSON.stringify(prevData));
      
      // Update relevant fields based on feed type
      if (!updatedData.feed) updatedData.feed = {};
      if (!updatedData.feed.pullThru) updatedData.feed.pullThru = {};
      
      updatedData.feed.pullThru.isPullThru = newFeedType === "sigma-5-pull-thru" ? "true" : "false";

      if (newFeedType === "sigma-5" || newFeedType === "sigma-5-pull-thru") {
        updatedData.feed.model = "CPRF-S5";
      }

      return updatedData;
    });

    // Trigger backend update
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(async () => {
      try {
        if (!performanceSheetId) {
          throw new Error("Performance Sheet ID is missing.");
        }
        
        const response = await updateEntity(performanceSheetId, { data: localData });
        console.log("Feed type updated:", response);
      } catch (error) {
        console.error('Error updating feed type:', error);
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

  const renderSigmaVFields = () => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Motor"
          name="feed.motor"
          type="text"
          value={localData.feed?.motor || ""}
          onChange={handleChange}
        />
        <Input
          label="AMP"
          name="feed.amp"
          type="text"
          value={localData.feed?.amp || ""}
          onChange={handleChange}
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Input
          label="STR Max Speed (ft/min)"
          name="feed.maximumVelocity"
          type="number"
          value={localData.feed?.maximumVelocity || ""}
          onChange={handleChange}
        />
        <Input
          label="Friction in Die (lbs)"
          name="feed.frictionInDie"
          type="number"
          value={localData.feed?.frictionInDie || ""}
          onChange={handleChange}
        />
        <Input
          label="Acceleration Rate (ft/sec²)"
          name="feed.accelerationRate"
          type="number"
          value={localData.feed?.accelerationRate || ""}
          onChange={handleChange}
        />
        <Input
          label="Default Accel (ft/sec²)"
          name="feed.defaultAcceleration"
          type="number"
          value={localData.feed?.defaultAcceleration || ""}
          onChange={handleChange}
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Input
          label="Max Motor RPM"
          name="feed.maxMotorRPM"
          type="number"
          value={localData.feed?.maxMotorRPM || ""}
          onChange={handleChange}
          readOnly
          className="bg-gray-50"
        />
        <Input
          label="Motor Inertia (lbs-in-sec²)"
          name="feed.motorInertia"
          type="number"
          value={localData.feed?.motorInertia || ""}
          onChange={handleChange}
          readOnly
          className="bg-gray-50"
        />
        <Input
          label="Max Velocity (ft/min)"
          name="feed.maxVelocity"
          type="number"
          value={localData.feed?.maximumVelocity || ""}
          onChange={handleChange}
          readOnly
          className="bg-gray-50"
        />
        <Input
          label="Settle Time (sec)"
          name="feed.settleTime"
          type="number"
          value={localData.feed?.settleTime || ""}
          onChange={handleChange}
          readOnly
          className="bg-gray-50"
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Input
          label="Chart Minimum Length (in)"
          name="feed.chartMinLength"
          type="number"
          value={localData.feed?.chartMinLength || ""}
          onChange={handleChange}
        />
        <Input
          label="Length Increment (in)"
          name="feed.lengthIncrement"
          type="number"
          value={localData.feed?.lengthIncrement || ""}
          onChange={handleChange}
        />
        <Input
          label="Feed Angle 1 (Deg)"
          name="feed.feedAngle1"
          type="number"
          value={localData.feed?.feedAngle1 || ""}
          onChange={handleChange}
        />
        <Input
          label="Feed Angle 2 (Deg)"
          name="feed.feedAngle2"
          type="number"
          value={localData.feed?.feedAngle2 || ""}
          onChange={handleChange}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Ratio"
          name="feed.ratio"
          type="number"
          value={localData.feed?.ratio || ""}
          onChange={handleChange}
        />
        <Input
          label="ReGen (Watts)"
          name="feed.regen"
          type="number"
          value={localData.feed?.regen || ""}
          onChange={handleChange}
          readOnly
          className="bg-gray-50"
        />
      </div>
    </>
  );

  const renderSigma5PullThruFields = () => (
    <>
      {renderSigmaVFields()}
      
      <Card className="mt-4">
        <Text as="h4" className="text-lg font-semibold mb-4">Pull-Through Configuration</Text>
        
        
      </Card>
    </>
  );

  const renderAllenBradleyFields = () => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Motor"
          name="feed.motor"
          type="text"
          value={localData.feed?.motor || ""}
          onChange={handleChange}
        />
        <Input
          label="AMP"
          name="feed.amp"
          type="text"
          value={localData.feed?.amp || ""}
          onChange={handleChange}
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Input
          label="STR Speed (ft/min)"
          name="feed.maximumVelocity"
          type="number"
          value={localData.feed?.maximumVelocity || ""}
          onChange={handleChange}
        />
        <Input
          label="Friction @ DIE (lbs)"
          name="feed.frictionInDie"
          type="number"
          value={localData.feed?.frictionInDie || ""}
          onChange={handleChange}
        />
        <Input
          label="Acceleration Rate (ft/sec²)"
          name="feed.accelerationRate"
          type="number"
          value={localData.feed?.accelerationRate || ""}
          onChange={handleChange}
        />
        <Input
          label="Default Accel (ft/sec²)"
          name="feed.defaultAcceleration"
          type="number"
          value={localData.feed?.defaultAcceleration || ""}
          onChange={handleChange}
        />
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
        <Text className="text-sm text-yellow-800">
          Note: Other AMP options and additional calculations are available for Allen Bradley configurations.
        </Text>
      </div>
    </>
  );

  const renderFeedLengthTable = () => (
    <Card className="mb-0 p-4">
      <Text as="h4" className="mb-4 text-lg font-medium">Feed Length & Speed Settings</Text>
      
      <div className="grid grid-cols-3 gap-6">
        <div>
          <Text as="h4" className="font-medium mb-2">Average</Text>
          <div className="space-y-2">
            <Input
              label="Length"
              name="feed.average.length"
              type="number"
              value={localData.feed?.average?.length || ""}
              onChange={handleChange}
            />
            <Input
              label="SPM"
              name="feed.average.spm"
              type="number"
              value={localData.feed?.average?.spm || ""}
              onChange={handleChange}
            />
            <Input
              label="FPM"
              name="feed.average.fpm"
              type="number"
              value={localData.feed?.average?.fpm || ""}
              onChange={handleChange}
              readOnly
              className="bg-gray-50"
            />
          </div>
        </div>

        <div>
          <Text as="h4" className="font-medium mb-2">Maximum</Text>
          <div className="space-y-2">
            <Input
              label="Length"
              name="feed.max.length"
              type="number"
              value={localData.feed?.max?.length || ""}
              onChange={handleChange}
            />
            <Input
              label="SPM"
              name="feed.max.spm"
              type="number"
              value={localData.feed?.max?.spm || ""}
              onChange={handleChange}
            />
            <Input
              label="FPM"
              name="feed.max.fpm"
              type="number"
              value={localData.feed?.max?.fpm || ""}
              onChange={handleChange}
              readOnly
              className="bg-gray-50"
            />
          </div>
        </div>

        <div>
          <Text as="h4" className="font-medium mb-2">Minimum</Text>
          <div className="space-y-2">
            <Input
              label="Length"
              name="feed.min.length"
              type="number"
              value={localData.feed?.min?.length || ""}
              onChange={handleChange}
            />
            <Input
              label="SPM"
              name="feed.min.spm"
              type="number"
              value={localData.feed?.min?.spm || ""}
              onChange={handleChange}
            />
            <Input
              label="FPM"
              name="feed.min.fpm"
              type="number"
              value={localData.feed?.min?.fpm || ""}
              onChange={handleChange}
              readOnly
              className="bg-gray-50"
            />
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="w-full flex flex-1 flex-col p-2 gap-2">
      {/* ...existing loading and error states... */}

      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">Feed Configuration</Text>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Select
            label="Feed Type"
            name="feedType"
            value={feedType}
            onChange={handleFeedTypeChange}
            options={FEED_MODEL_OPTIONS}
          />
          <Input
            label="Application"
            name="feed.application"
            type="text"
            value={localData.feed?.application || ""}
            onChange={handleChange}
          />
          <Select
            label="Model"
            name="feed.model"
            value={localData.feed?.model || ""}
            onChange={handleChange}
            options={
              feedType === "sigma-5"
                ? SIGMA_5_FEED_MODEL_OPTIONS
                : feedType === "sigma-5-pull-thru"
                  ? SIGMA_5_PULLTHRU_FEED_MODEL_OPTIONS
                  : feedType === "allen-bradley"
                    ? ALLEN_BRADLEY_FEED_MODEL_OPTIONS
                    : FEED_MODEL_OPTIONS
            }
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Machine Width"
            name="feed.machineWidth"
            value={localData.feed?.machineWidth !== undefined ? String(localData.feed?.machineWidth) : ""}
            onChange={handleChange}
            options={MACHINE_WIDTH_OPTIONS}
          />
          <Select
            label="Loop Pit"
            name="feed.loopPit"
            value={localData.feed?.loopPit || ""}
            onChange={handleChange}
            options={YES_NO_OPTIONS}
          />
          <Select
            label="Full Width Rolls"
            name="feed.fullWidthRolls"
            value={localData.feed?.fullWidthRolls || ""}
            onChange={handleChange}
            options={YES_NO_OPTIONS}
          />
        </div>
      </Card>

      <Card className="mb-0 p-4">
        <div className="mb-6">
          <Text as="h4" className="mb-4 text-lg font-medium">Material Information</Text>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Input
              label="Width"
              name="material.coilWidth"
              type="number"
              value={localData.material?.coilWidth || ""}
              onChange={handleChange}
            />
            <Input
              label="Thickness"
              name="material.materialThickness"
              type="number"
              value={localData.material?.materialThickness || ""}
              onChange={handleChange}
            />
            <Input
              label="Press Bed Length"
              name="feed.pressBedLength"
              type="number"
              value={localData.feed?.pressBedLength || ""}
              onChange={handleChange}
              readOnly
              className="bg-gray-50"
            />
            <Input
              label="Density"
              name="material.materialDensity"
              type="number"
              value={localData.material?.materialDensity || ""}
              onChange={handleChange}
            />
            <Input
              label="Mat'l In Loop"
              name="feed.materialInLoop"
              type="number"
              value={localData.feed?.materialInLoop || ""}
              onChange={handleChange}
              readOnly
              className="bg-gray-50"
            />
          </div>
        </div>

        {feedType === "sigma-v" && renderSigmaVFields()}
        {feedType === "sigma-v-straightener" && renderSigma5PullThruFields()}
        {feedType === "allen-bradley" && renderAllenBradleyFields()}
      </Card>

      {renderFeedLengthTable()}

      {/* Performance Results Table - Similar to Excel output */}
      <Card className="mb-0 p-4">
        <Text as="h4" className="mb-4 text-lg font-medium">Performance Results</Text>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-border">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border p-2 text-white">Length</th>
                <th className="border border-border p-2 text-white">SPM @ 180°</th>
                <th className="border border-border p-2 text-white">FPM</th>
                <th className="border border-border p-2 text-white">SPM @ 240°</th>
                <th className="border border-border p-2 text-white">FPM</th>
              </tr>
            </thead>
            <tbody>
              {[4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60].map((length) => (
                <tr key={length}>
                  <td className="border border-border p-2 text-center text-white">{length}</td>
                  <td className="border border-border p-2 text-center text-white">#N/A</td>
                  <td className="border border-border p-2 text-center text-white">#N/A</td>
                  <td className="border border-border p-2 text-center text-white">#N/A</td>
                  <td className="border border-border p-2 text-center text-white">#N/A</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Feed;