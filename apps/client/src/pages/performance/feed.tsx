import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { debounce } from "lodash";
import Card from "@/components/common/card";
import Input from "@/components/common/input";
import Select from "@/components/common/select";
import Text from "@/components/common/text";
import { PerformanceData } from "@/contexts/performance.context";
import {
  FEED_MODEL_OPTIONS,
  MACHINE_WIDTH_OPTIONS,
  YES_NO_OPTIONS,
  SIGMA_5_FEED_MODEL_OPTIONS,
  SIGMA_5_PULLTHRU_FEED_MODEL_OPTIONS,
  ALLEN_BRADLEY_FEED_MODEL_OPTIONS,
} from "@/utils/select-options";
import { useUpdateEntity } from "@/hooks/_base/use-update-entity";
import { useGetEntity } from "@/hooks/_base/use-get-entity";

export interface FeedProps {
  data: PerformanceData;
  isEditing: boolean;
}

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

const Feed: React.FC<FeedProps> = ({ data, isEditing }) => {
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

  // Determine feed type based on current data
  const feedType = useMemo(() => {
    const isPullThruBool = localData.feed?.feed?.pullThru?.isPullThru === "true";
    if (isPullThruBool) {
      return "sigma-5-pull-thru";
    }
    if (localData.feed?.feed?.model?.includes("CPRF")) {
      return "sigma-5";
    }
    if (localData.feed?.feed?.model?.includes("AB") || localData.feed?.feed?.model?.includes("Allen")) {
      return "allen-bradley";
    }
    return "sigma-5"; // default
  }, [localData.feed?.feed?.model, localData.feed?.feed?.pullThru?.isPullThru]);

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

        console.log("Saving Feed changes:", changes);
        
        const response = await updateEntity(performanceSheetId, { data: updatedData });
        
        // Handle calculated values from backend
        if (response?.data?.feed) {
          console.log("Updating calculated feed values from backend response");
          
          setLocalData(prevData => ({
            ...prevData,
            common: {
              ...prevData.common,
              equipment: {
                ...prevData.common?.equipment,
                feed: {
                  ...prevData.common?.equipment?.feed,
                  maximumVelocity: response.data.feed.max_velocity || prevData.common?.equipment?.feed?.maximumVelocity,
                }
              }
            },
            feed: {
              ...prevData.feed,
              // Update calculated FPM values
              average: {
                ...prevData.common?.feedRates?.average,
                fpm: response.data.feed.average?.fpm || prevData.common?.feedRates?.average?.fpm
              },
              max: {
                ...prevData.common?.feedRates?.max,
                fpm: response.data.feed.max?.fpm || prevData.common?.feedRates?.max?.fpm
              },
              min: {
                ...prevData.common?.feedRates?.min,
                fpm: response.data.feed.min?.fpm || prevData.common?.feedRates?.min?.fpm
              },
              // Update other calculated feed fields
              maxMotorRPM: response.data.feed.max_motor_rpm || prevData.feed?.feed?.maxMotorRPM,
              motorInertia: response.data.feed.motor_inertia || prevData.feed?.feed?.motorInertia,
              settleTime: response.data.feed.settle_time || prevData.feed?.feed?.settleTime,
              regen: response.data.feed.regen || prevData.feed?.feed?.regen,
              materialInLoop: response.data.feed.material_in_loop || prevData.feed?.feed?.materialInLoop,
              ratio: response.data.feed.ratio || prevData.feed?.feed?.ratio,
              reflInertia: response.data.feed.refl_inertia || prevData.feed?.feed?.reflInertia,
              match: response.data.feed.match || prevData.feed?.feed?.match,
              torque: {
                ...prevData.feed?.feed?.torque,
                motorPeak: response.data.feed.motor_peak_torque || prevData.feed?.feed?.torque?.motorPeak,
                rms: response.data.feed.motor_rms_torque || prevData.feed?.feed?.torque?.rms,
                frictional: response.data.feed.frictional_torque || prevData.feed?.feed?.torque?.frictional,
                loop: response.data.feed.loop_torque || prevData.feed?.feed?.torque?.loop,
                settle: response.data.feed.settle_torque || prevData.feed?.feed?.torque?.settle,
                peak: response.data.feed.peak_torque || prevData.feed?.feed?.torque?.peak,
                acceleration: response.data.feed.acceleration_torque || prevData.feed?.feed?.torque?.acceleration,
              },
              tableValues: response.data.feed.table_values || prevData.feed?.feed?.tableValues,
            },
            // Update press bed length if calculated
            press: {
              ...prevData.feed?.press,
              bedLength: response.data.feed.press_bed_length || prevData.feed?.press?.bedLength,
            }
          }));
        }

        setLastSaved(new Date());
        setIsDirty(false);
        pendingChangesRef.current = {};
        
      } catch (error) {
        console.error('Error saving Feed:', error);
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

    // Update local state immediately
    setLocalData(prevData => {
      const newData = { ...prevData };
      const processedValue = type === "number" ? (value === "" ? "" : value) : value;
      
      // Handle legacy field mappings
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

  // Handle feed type change
  const handleFeedTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFeedType = e.target.value;
    
    if (!isEditing) return;
    
    // Update local state immediately
    setLocalData(prevData => {
      const newData = { ...prevData };
      
      // Ensure feed structure exists
      if (!newData.feed) newData.feed = {};
      if (!newData.feed.feed) newData.feed.feed = {};
      if (!newData.feed.feed.pullThru) newData.feed.feed.pullThru = {};
      
      // Update relevant fields based on feed type
      newData.feed.feed.pullThru.isPullThru = newFeedType === "sigma-5-pull-thru" ? "true" : "false";

      // Update model based on feed type
      if (newFeedType === "sigma-5" || newFeedType === "sigma-5-pull-thru") {
        newData.feed.feed.model = "CPRF-S5";
      } else if (newFeedType === "allen-bradley") {
        newData.feed.feed.model = "AB-CPRF";
      }

      return newData;
    });

    // Track pending changes
    pendingChangesRef.current["feed.pullThru.isPullThru"] = newFeedType === "sigma-5-pull-thru" ? "true" : "false";
    if (newFeedType === "sigma-5" || newFeedType === "sigma-5-pull-thru") {
      pendingChangesRef.current["feed.model"] = "CPRF-S5";
    } else if (newFeedType === "allen-bradley") {
      pendingChangesRef.current["feed.model"] = "AB-CPRF";
    }
    setIsDirty(true);

    // Debounce save
    debouncedSave(pendingChangesRef.current);
  }, [isEditing, debouncedSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  // Header section
  const headerSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Customer & Date
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Customer"
          name="customer"
          value={localData.common?.customer || ""}
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
  ), [localData.common?.customer, localData.rfq?.dates?.date, handleChange, isEditing]);

  // Feed configuration section
  const feedConfigSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">Feed Configuration</Text>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Select
          label="Feed Type"
          name="feedType"
          value={feedType}
          onChange={handleFeedTypeChange}
          options={FEED_MODEL_OPTIONS}
          disabled={!isEditing}
        />
        <Input
          label="Application"
          name="feed.application"
          value={localData.feed?.feed?.application || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Select
          label="Model"
          name="feed.model"
          value={localData.feed?.feed?.model || ""}
          onChange={handleChange}
          options={
            feedType === "sigma-5"
              ? SIGMA_5_FEED_MODEL_OPTIONS
              : feedType === "sigma-5-pull-thru"
                ? SIGMA_5_PULLTHRU_FEED_MODEL_OPTIONS
                : feedType === "allen-bradley"
                  ? ALLEN_BRADLEY_FEED_MODEL_OPTIONS
                  : SIGMA_5_FEED_MODEL_OPTIONS
          }
          disabled={!isEditing}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select
          label="Machine Width"
          name="feed.machineWidth"
          value={localData.feed?.feed?.machineWidth !== undefined ? String(localData.feed?.feed?.machineWidth) : ""}
          onChange={handleChange}
          options={MACHINE_WIDTH_OPTIONS}
          disabled={!isEditing}
        />
        <Select
          label="Loop Pit"
          name="feed.loopPit"
          value={localData.feed?.feed?.loopPit || ""}
          onChange={handleChange}
          options={YES_NO_OPTIONS}
          disabled={!isEditing}
        />
        <Select
          label="Full Width Rolls"
          name="feed.fullWidthRolls"
          value={localData.feed?.feed?.fullWidthRolls || ""}
          onChange={handleChange}
          options={YES_NO_OPTIONS}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [feedType, localData.feed, handleChange, handleFeedTypeChange, isEditing]);

  // Material information section
  const materialInfoSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h4" className="mb-4 text-lg font-medium">Material Information</Text>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Input
          label="Width"
          name="material.coilWidth"
          type="number"
          value={localData.common?.material?.coilWidth?.toString() || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Thickness"
          name="material.materialThickness"
          type="number"
          value={localData.common?.material?.materialThickness?.toString() || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Press Bed Length"
          name="press.bedLength"
          type="number"
          value={localData.feed?.press?.bedLength?.toString() || ""}
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="Density"
          name="material.materialDensity"
          type="number"
          value={localData.common?.material?.materialDensity?.toString() || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Mat'l In Loop"
          name="feed.materialInLoop"
          type="number"
          value={localData.feed?.feed?.materialInLoop?.toString() || ""}
          disabled={true}
          className="bg-gray-50"
        />
      </div>
    </Card>
  ), [localData.common?.material, localData.feed?.press?.bedLength, localData.feed?.feed?.materialInLoop, handleChange, isEditing]);

  // Sigma 5 fields
  const sigma5Fields = useMemo(() => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Motor"
          name="feed.motor"
          value={localData.feed?.feed?.motor || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="AMP"
          name="feed.amp"
          value={localData.feed?.feed?.amp || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Input
          label="STR Max Speed (ft/min)"
          name="feed.maximumVelocity"
          type="number"
          value={localData.common?.equipment?.feed?.maximumVelocity?.toString() || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Friction in Die (lbs)"
          name="feed.frictionInDie"
          type="number"
          value={localData.feed?.feed?.frictionInDie?.toString() || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Acceleration Rate (ft/sec²)"
          name="feed.accelerationRate"
          type="number"
          value={localData.feed?.feed?.accelerationRate?.toString() || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Default Accel (ft/sec²)"
          name="feed.defaultAcceleration"
          type="number"
          value={localData.feed?.feed?.defaultAcceleration?.toString() || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Input
          label="Max Motor RPM"
          name="feed.maxMotorRPM"
          type="number"
          value={localData.feed?.feed?.maxMotorRPM?.toString() || ""}
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="Motor Inertia (lbs-in-sec²)"
          name="feed.motorInertia"
          type="number"
          value={localData.feed?.feed?.motorInertia?.toString() || ""}
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="Max Velocity (ft/min)"
          name="feed.maxVelocity"
          type="number"
          value={localData.common?.equipment?.feed?.maximumVelocity?.toString() || ""}
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="Settle Time (sec)"
          name="feed.settleTime"
          type="number"
          value={localData.feed?.feed?.settleTime?.toString() || ""}
          disabled={true}
          className="bg-gray-50"
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Input
          label="Chart Minimum Length (in)"
          name="feed.chartMinLength"
          type="number"
          value={localData.feed?.feed?.chartMinLength?.toString() || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Length Increment (in)"
          name="feed.lengthIncrement"
          type="number"
          value={localData.feed?.feed?.lengthIncrement?.toString() || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Feed Angle 1 (Deg)"
          name="feed.feedAngle1"
          type="number"
          value={localData.feed?.feed?.feedAngle1?.toString() || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Feed Angle 2 (Deg)"
          name="feed.feedAngle2"
          type="number"
          value={localData.feed?.feed?.feedAngle2?.toString() || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Ratio"
          name="feed.ratio"
          type="number"
          value={localData.feed?.feed?.ratio?.toString() || ""}
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="ReGen (Watts)"
          name="feed.regen"
          type="number"
          value={localData.feed?.feed?.regen?.toString() || ""}
          disabled={true}
          className="bg-gray-50"
        />
      </div>
    </div>
  ), [localData.feed, handleChange, isEditing]);

  // Pull-through fields
  const pullThruFields = useMemo(() => (
    <div className="space-y-4">
      {sigma5Fields}
      
      <Card className="mt-4 p-4">
        <Text as="h4" className="text-lg font-semibold mb-4">Pull-Through Configuration</Text>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Center Distance (in)"
            name="feed.feed.pullThru.centerDistance"
            type="number"
            value={localData.feed?.feed?.pullThru?.centerDistance?.toString() || ""}
            onChange={handleChange}
            disabled={!isEditing}
          />
          <Input
            label="Yield Strength (psi)"
            name="feed.feed.pullThru.yieldStrength"
            type="number"
            value={localData.feed?.feed?.pullThru?.yieldStrength?.toString() || ""}
            onChange={handleChange}
            disabled={!isEditing}
          />
          <Input
            label="K-Constant"
            name="feed.feed.pullThru.kConst"
            type="number"
            value={localData.feed?.feed?.pullThru?.kConst?.toString() || ""}
            onChange={handleChange}
            disabled={!isEditing}
          />
          <Input
            label="Straightener Pinch Rolls"
            name="feed.feed.pullThru.pinchRolls"
            type="number"
            value={localData.feed?.feed?.pullThru?.pinchRolls?.toString() || ""}
            onChange={handleChange}
            disabled={!isEditing}
          />
        </div>
      </Card>
    </div>
  ), [sigma5Fields, localData.feed?.feed?.pullThru, handleChange, isEditing]);

  // Allen Bradley fields
  const allenBradleyFields = useMemo(() => (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
        <Text className="text-sm text-yellow-800">
          Note: Other AMP options and additional calculations are available for Allen Bradley configurations.
        </Text>
      </div>
    </div>
  ), [localData.feed, handleChange, isEditing]);

  // Feed specifications section
  const feedSpecsSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h4" className="mb-4 text-lg font-medium">Feed Specifications</Text>
      
      {feedType === "sigma-5" && sigma5Fields}
      {feedType === "sigma-5-pull-thru" && pullThruFields}
      {feedType === "allen-bradley" && allenBradleyFields}
    </Card>
  ), [feedType, sigma5Fields, pullThruFields, allenBradleyFields]);

  // Feed length table section
  const feedLengthTableSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h4" className="mb-4 text-lg font-medium">Feed Length & Speed Settings</Text>
      
      <div className="grid grid-cols-3 gap-6">
        <div>
          <Text as="h4" className="font-medium mb-2">Average</Text>
          <div className="space-y-2">
            <Input
              label="Length"
              name="feed.average.length"
              type="number"
              value={localData.common?.feedRates?.average?.length?.toString() || ""}
              onChange={handleChange}
              disabled={!isEditing}
            />
            <Input
              label="SPM"
              name="feed.average.spm"
              type="number"
              value={localData.common?.feedRates?.average?.spm?.toString() || ""}
              onChange={handleChange}
              disabled={!isEditing}
            />
            <Input
              label="FPM"
              name="feed.average.fpm"
              type="number"
              value={localData.common?.feedRates?.average?.fpm?.toString() || ""}
              disabled={true}
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
              value={localData.common?.feedRates?.max?.length?.toString() || ""}
              onChange={handleChange}
              disabled={!isEditing}
            />
            <Input
              label="SPM"
              name="feed.max.spm"
              type="number"
              value={localData.common?.feedRates?.max?.spm?.toString() || ""}
              onChange={handleChange}
              disabled={!isEditing}
            />
            <Input
              label="FPM"
              name="feed.max.fpm"
              type="number"
              value={localData.common?.feedRates?.max?.fpm?.toString() || ""}
              disabled={true}
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
              value={localData.common?.feedRates?.min?.length?.toString() || ""}
              onChange={handleChange}
              disabled={!isEditing}
            />
            <Input
              label="SPM"
              name="feed.min.spm"
              type="number"
              value={localData.common?.feedRates?.min?.spm?.toString() || ""}
              onChange={handleChange}
              disabled={!isEditing}
            />
            <Input
              label="FPM"
              name="feed.min.fpm"
              type="number"
              value={localData.common?.feedRates?.min?.fpm?.toString() || ""}
              disabled={true}
              className="bg-gray-50"
            />
          </div>
        </div>
      </div>
    </Card>
  ), [localData.feed, handleChange, isEditing]);

  // Performance results table section
  const performanceResultsSection = useMemo(() => {
    const tableData = localData.feed?.feed?.tableValues || [];
    const lengthRows = [4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60];

    return (
      <Card className="mb-4 p-4">
        <Text as="h4" className="mb-4 text-lg font-medium">Performance Results</Text>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-800">
                <th className="border border-gray-300 p-2 text-white">Length</th>
                <th className="border border-gray-300 p-2 text-white">SPM @ 180°</th>
                <th className="border border-gray-300 p-2 text-white">FPM</th>
                <th className="border border-gray-300 p-2 text-white">SPM @ 240°</th>
                <th className="border border-gray-300 p-2 text-white">FPM</th>
              </tr>
            </thead>
            <tbody>
              {lengthRows.map((length) => {
                const rowData = tableData.find((row: any) => row.length === length);
                return (
                  <tr key={length} className="bg-gray-800">
                    <td className="border border-gray-300 p-2 text-center text-white">{length}</td>
                    <td className="border border-gray-300 p-2 text-center text-white">
                      {rowData?.spm_at_fa1 || "#N/A"}
                    </td>
                    <td className="border border-gray-300 p-2 text-center text-white">
                      {rowData?.fpm_fa1 || "#N/A"}
                    </td>
                    <td className="border border-gray-300 p-2 text-center text-white">
                      {rowData?.spm_at_fa2 || "#N/A"}
                    </td>
                    <td className="border border-gray-300 p-2 text-center text-white">
                      {rowData?.fpm_fa2 || "#N/A"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    );
  }, [localData.feed?.feed?.tableValues]);

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
      {feedConfigSection}
      {materialInfoSection}
      {feedSpecsSection}
      {feedLengthTableSection}
      {performanceResultsSection}
    </div>
  );
};

export default Feed;