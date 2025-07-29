import { useState, useEffect } from "react";
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

export interface FeedProps {
  data: PerformanceData;
  isEditing?: boolean;
  onChange?: (data: PerformanceData) => void;
}

const Feed: React.FC<FeedProps> = ({ data, isEditing, onChange }) => {  
  // Determine feed type based on current data or default
  const getFeedType = () => {
    // Fix: Convert string to boolean for comparison
    const isPullThruBool = data.feed?.pullThru?.isPullThru === "true";
    if (isPullThruBool) {
      return "sigma-v-straightener";
    }
    if (data.feed?.model?.includes("CPRF")) {
      return "sigma-v";
    }
    return "sigma-v"; // default
  };

  const [feedType, setFeedType] = useState<string>(getFeedType());

  useEffect(() => {
    setFeedType(getFeedType());
  }, [data.feed?.model, data.feed?.pullThru?.isPullThru]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!isEditing) return;
    
    const { name, value } = e.target;

    if (name.includes(".")) {
      const parts = name.split(".");
      const [section, ...rest] = parts;
      
      let updateObj: any = {};
      let current = updateObj;
      
      const sectionData = data[section as keyof typeof data];
      current[section] = { ...(typeof sectionData === "object" && sectionData !== null ? sectionData : {}) };
      current = current[section];
      
      for (let i = 0; i < rest.length - 1; i++) {
        const key = rest[i];
        current[key] = { ...(current[key] || {}) };
        current = current[key];
      }
      
      current[rest[rest.length - 1]] = value;
      if (onChange) {
        onChange(updateObj);
      }
    } else {
      if (onChange) {
        onChange({
          [name]: value,
          referenceNumber: ""
        });
      }
    }
  };

  const handleFeedTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFeedType = e.target.value;
    setFeedType(newFeedType);
    
    // Update relevant fields based on feed type
    const updates: any = {
      feed: {
        ...data.feed,
        pullThru: {
          ...data.feed?.pullThru,
          isPullThru: newFeedType === "sigma-v-straightener" ? "true" : "false",
        }
      }
    };

    if (newFeedType === "sigma-v" || newFeedType === "sigma-v-straightener") {
      updates.feed.model = "CPRF-S5";
    }

    if (onChange) {
      onChange(updates);
    }
  };

  const renderSigmaVFields = () => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Motor"
          name="feed.motor"
          type="text"
          value={data.feed?.motor || ""}
          onChange={handleChange}
        />
        <Input
          label="AMP"
          name="feed.amp"
          type="text"
          value={data.feed?.amp || ""}
          onChange={handleChange}
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Input
          label="STR Max Speed (ft/min)"
          name="feed.maximumVelocity"
          type="number"
          value={data.feed?.maximumVelocity || ""}
          onChange={handleChange}
        />
        <Input
          label="Friction in Die (lbs)"
          name="feed.frictionInDie"
          type="number"
          value={data.feed?.frictionInDie || ""}
          onChange={handleChange}
        />
        <Input
          label="Acceleration Rate (ft/sec²)"
          name="feed.accelerationRate"
          type="number"
          value={data.feed?.accelerationRate || ""}
          onChange={handleChange}
        />
        <Input
          label="Default Accel (ft/sec²)"
          name="feed.defaultAcceleration"
          type="number"
          value={data.feed?.defaultAcceleration || ""}
          onChange={handleChange}
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Input
          label="Max Motor RPM"
          name="feed.maxMotorRPM"
          type="number"
          // Fix: Use safe property access with fallback
          value={(data.feed as any)?.maxMotorRPM || ""}
          onChange={handleChange}
        />
        <Input
          label="Motor Inertia (lbs-in-sec²)"
          name="feed.motorInertia"
          type="number"
          // Fix: Use safe property access with fallback
          value={(data.feed as any)?.motorInertia || ""}
          onChange={handleChange}
        />
        <Input
          label="Max Velocity (ft/min)"
          name="feed.maxVelocity"
          type="number"
          // Fix: Use safe property access with fallback
          value={(data.feed as any)?.maxVelocity || ""}
          onChange={handleChange}
        />
        <Input
          label="Settle Time (sec)"
          name="feed.settleTime"
          type="number"
          // Fix: Use safe property access with fallback
          value={(data.feed as any)?.settleTime || ""}
          onChange={handleChange}
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Input
          label="Chart Minimum Length (in)"
          name="feed.chartMinLength"
          type="number"
          value={data.feed?.chartMinLength || ""}
          onChange={handleChange}
        />
        <Input
          label="Length Increment (in)"
          name="feed.lengthIncrement"
          type="number"
          value={data.feed?.lengthIncrement || ""}
          onChange={handleChange}
        />
        <Input
          label="Feed Angle 1 (Deg)"
          name="feed.feedAngle1"
          type="number"
          value={data.feed?.feedAngle1 || ""}
          onChange={handleChange}
        />
        <Input
          label="Feed Angle 2 (Deg)"
          name="feed.feedAngle2"
          type="number"
          value={data.feed?.feedAngle2 || ""}
          onChange={handleChange}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Ratio"
          name="feed.ratio"
          type="number"
          value={data.feed?.ratio || ""}
          onChange={handleChange}
        />
        <Input
          label="ReGen (Watts)"
          name="feed.regen"
          type="number"
          value={data.feed?.regen || ""}
          onChange={handleChange}
        />
      </div>
    </>
  );

  const renderSigmaVStraightenerFields = () => (
    <>
      {renderSigmaVFields()}
      
      <Card className="mt-4">
        <Text as="h4" className="text-lg font-semibold mb-4">Straightener Configuration</Text>
        
        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Straightening Rolls"
            name="feed.pullThru.straightenerRolls"
            type="number"
            value={data.feed?.pullThru?.straightenerRolls || ""}
            onChange={handleChange}
          />
          <Input
            label="Str. Pinch Rolls"
            name="feed.pullThru.pinchRolls"
            type="number"
            value={data.feed?.pullThru?.pinchRolls || ""}
            onChange={handleChange}
          />
          <Input
            label="Payoff Max Speed (ft/min)"
            name="straightener.payoffMaxSpeed"
            type="number"
            // Fix: Use safe property access with fallback
            value={(data.straightener as any)?.payoffMaxSpeed || ""}
            onChange={handleChange}
          />
        </div>
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
          value={data.feed?.motor || ""}
          onChange={handleChange}
        />
        <Input
          label="AMP"
          name="feed.amp"
          type="text"
          value={data.feed?.amp || ""}
          onChange={handleChange}
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Input
          label="STR Speed (ft/min)"
          name="feed.maximumVelocity"
          type="number"
          value={data.feed?.maximumVelocity || ""}
          onChange={handleChange}
        />
        <Input
          label="Friction @ DIE (lbs)"
          name="feed.frictionInDie"
          type="number"
          value={data.feed?.frictionInDie || ""}
          onChange={handleChange}
        />
        <Input
          label="Acceleration Rate (ft/sec²)"
          name="feed.accelerationRate"
          type="number"
          value={data.feed?.accelerationRate || ""}
          onChange={handleChange}
        />
        <Input
          label="Default Accel (ft/sec²)"
          name="feed.defaultAcceleration"
          type="number"
          value={data.feed?.defaultAcceleration || ""}
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
              value={data.feed?.average?.length || ""}
              onChange={handleChange}
            />
            <Input
              label="SPM"
              name="feed.average.spm"
              type="number"
              value={data.feed?.average?.spm || ""}
              onChange={handleChange}
            />
            <Input
              label="FPM"
              name="feed.average.fpm"
              type="number"
              value={data.feed?.average?.fpm || ""}
              onChange={handleChange}
              disabled
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
              value={data.feed?.max?.length || ""}
              onChange={handleChange}
            />
            <Input
              label="SPM"
              name="feed.max.spm"
              type="number"
              value={data.feed?.max?.spm || ""}
              onChange={handleChange}
            />
            <Input
              label="FPM"
              name="feed.max.fpm"
              type="number"
              value={data.feed?.max?.fpm || ""}
              onChange={handleChange}
              disabled
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
              value={data.feed?.min?.length || ""}
              onChange={handleChange}
            />
            <Input
              label="SPM"
              name="feed.min.spm"
              type="number"
              value={data.feed?.min?.spm || ""}
              onChange={handleChange}
            />
            <Input
              label="FPM"
              name="feed.min.fpm"
              type="number"
              value={data.feed?.min?.fpm || ""}
              onChange={handleChange}
              disabled
            />
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="w-full flex flex-1 flex-col p-2 gap-2">
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
            value={data.feed?.application || ""}
            onChange={handleChange}
          />
          <Select
            label="Model"
            name="feed.model"
            value={data.feed?.model || ""}
            onChange={handleChange}
            options={
              feedType === "Sigma 5"
                ? SIGMA_5_FEED_MODEL_OPTIONS
                : feedType === "sigma-v-straightener"
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
            value={data.feed?.machineWidth !== undefined ? String(data.feed?.machineWidth) : ""}
            onChange={handleChange}
            options={MACHINE_WIDTH_OPTIONS}
          />
          <Select
            label="Loop Pit"
            name="feed.loopPit"
            value={data.feed?.loopPit || ""}
            onChange={handleChange}
            options={YES_NO_OPTIONS}
          />
          <Select
            label="Full Width Rolls"
            name="feed.fullWidthRolls"
            value={data.feed?.fullWidthRolls || ""}
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
              value={data.material?.coilWidth || ""}
              onChange={handleChange}
            />
            <Input
              label="Thickness"
              name="material.materialThickness"
              type="number"
              value={data.material?.materialThickness || ""}
              onChange={handleChange}
            />
            <Input
              label="Press Bed Length"
              name="feed.pressBedLength"
              type="number"
              // Fix: Use safe property access with fallback
              value={(data.feed as any)?.pressBedLength || ""}
              onChange={handleChange}
            />
            <Input
              label="Density"
              name="material.materialDensity"
              type="number"
              value={data.material?.materialDensity || ""}
              onChange={handleChange}
            />
            <Input
              label="Mat'l In Loop"
              name="feed.materialInLoop"
              type="number"
              // Fix: Use safe property access with fallback
              value={(data.feed as any)?.materialInLoop || ""}
              onChange={handleChange}
            />
          </div>
        </div>

        {feedType === "sigma-v" && renderSigmaVFields()}
        {feedType === "sigma-v-straightener" && renderSigmaVStraightenerFields()}
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