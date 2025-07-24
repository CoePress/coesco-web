import { useState, useEffect } from "react";
import { usePerformanceSheet } from "@/contexts/performance.context";
import Card from "@/components/common/card";
import Input from "@/components/common/input";
import Select from "@/components/common/select";
import Text from "@/components/common/text";

const FEED_TYPE_OPTIONS = [
  { value: "sigma-v", label: "Sigma V Feed" },
  { value: "sigma-v-straightener", label: "Sigma V Feed with Straightener" },
  { value: "allen-bradley", label: "Allen Bradley Feed" },
];

const LOOP_PIT_OPTIONS = [
  { value: "Y", label: "Yes" },
  { value: "N", label: "No" },
];

const Feed = () => {
  const { performanceData, updatePerformanceData } = usePerformanceSheet();
  
  // Determine feed type based on current data or default
  const getFeedType = () => {
    // Fix: Convert string to boolean for comparison
    const isPullThruBool = performanceData.feed?.pullThru?.isPullThru === "true";
    if (isPullThruBool) {
      return "sigma-v-straightener";
    }
    if (performanceData.feed?.model?.includes("CPRF")) {
      return "sigma-v";
    }
    return "sigma-v"; // default
  };

  const [feedType, setFeedType] = useState<string>(getFeedType());

  useEffect(() => {
    setFeedType(getFeedType());
  }, [performanceData.feed?.model, performanceData.feed?.pullThru?.isPullThru]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const parts = name.split(".");
      const [section, ...rest] = parts;
      
      let updateObj: any = {};
      let current = updateObj;
      
      const sectionData = performanceData[section as keyof typeof performanceData];
      current[section] = { ...(typeof sectionData === "object" && sectionData !== null ? sectionData : {}) };
      current = current[section];
      
      for (let i = 0; i < rest.length - 1; i++) {
        const key = rest[i];
        current[key] = { ...(current[key] || {}) };
        current = current[key];
      }
      
      current[rest[rest.length - 1]] = value;
      updatePerformanceData(updateObj);
    } else {
      updatePerformanceData({ [name]: value });
    }
  };

  const handleFeedTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFeedType = e.target.value;
    setFeedType(newFeedType);
    
    // Update relevant fields based on feed type
    const updates: any = {
      feed: {
        ...performanceData.feed,
        pullThru: {
          ...performanceData.feed?.pullThru,
          isPullThru: newFeedType === "sigma-v-straightener" ? "true" : "false",
        }
      }
    };

    if (newFeedType === "sigma-v" || newFeedType === "sigma-v-straightener") {
      updates.feed.model = "CPRF-S5";
    }

    updatePerformanceData(updates);
  };

  const renderSigmaVFields = () => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Motor"
          name="feed.motor"
          type="text"
          value={performanceData.feed?.motor || ""}
          onChange={handleChange}
        />
        <Input
          label="AMP"
          name="feed.amp"
          type="text"
          value={performanceData.feed?.amp || ""}
          onChange={handleChange}
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Input
          label="STR Max Speed (ft/min)"
          name="feed.maximumVelocity"
          type="number"
          value={performanceData.feed?.maximumVelocity || ""}
          onChange={handleChange}
        />
        <Input
          label="Friction in Die (lbs)"
          name="feed.frictionInDie"
          type="number"
          value={performanceData.feed?.frictionInDie || ""}
          onChange={handleChange}
        />
        <Input
          label="Acceleration Rate (ft/sec²)"
          name="feed.accelerationRate"
          type="number"
          value={performanceData.feed?.accelerationRate || ""}
          onChange={handleChange}
        />
        <Input
          label="Default Accel (ft/sec²)"
          name="feed.defaultAcceleration"
          type="number"
          value={performanceData.feed?.defaultAcceleration || ""}
          onChange={handleChange}
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Input
          label="Max Motor RPM"
          name="feed.maxMotorRPM"
          type="number"
          // Fix: Use safe property access with fallback
          value={(performanceData.feed as any)?.maxMotorRPM || ""}
          onChange={handleChange}
        />
        <Input
          label="Motor Inertia (lbs-in-sec²)"
          name="feed.motorInertia"
          type="number"
          // Fix: Use safe property access with fallback
          value={(performanceData.feed as any)?.motorInertia || ""}
          onChange={handleChange}
        />
        <Input
          label="Max Velocity (ft/min)"
          name="feed.maxVelocity"
          type="number"
          // Fix: Use safe property access with fallback
          value={(performanceData.feed as any)?.maxVelocity || ""}
          onChange={handleChange}
        />
        <Input
          label="Settle Time (sec)"
          name="feed.settleTime"
          type="number"
          // Fix: Use safe property access with fallback
          value={(performanceData.feed as any)?.settleTime || ""}
          onChange={handleChange}
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Input
          label="Chart Minimum Length (in)"
          name="feed.chartMinLength"
          type="number"
          value={performanceData.feed?.chartMinLength || ""}
          onChange={handleChange}
        />
        <Input
          label="Length Increment (in)"
          name="feed.lengthIncrement"
          type="number"
          value={performanceData.feed?.lengthIncrement || ""}
          onChange={handleChange}
        />
        <Input
          label="Feed Angle 1 (Deg)"
          name="feed.feedAngle1"
          type="number"
          value={performanceData.feed?.feedAngle1 || ""}
          onChange={handleChange}
        />
        <Input
          label="Feed Angle 2 (Deg)"
          name="feed.feedAngle2"
          type="number"
          value={performanceData.feed?.feedAngle2 || ""}
          onChange={handleChange}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Ratio"
          name="feed.ratio"
          type="number"
          value={performanceData.feed?.ratio || ""}
          onChange={handleChange}
        />
        <Input
          label="ReGen (Watts)"
          name="feed.regen"
          type="number"
          value={performanceData.feed?.regen || ""}
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
            value={performanceData.feed?.pullThru?.straightenerRolls || ""}
            onChange={handleChange}
          />
          <Input
            label="Str. Pinch Rolls"
            name="feed.pullThru.pinchRolls"
            type="number"
            value={performanceData.feed?.pullThru?.pinchRolls || ""}
            onChange={handleChange}
          />
          <Input
            label="Payoff Max Speed (ft/min)"
            name="straightener.payoffMaxSpeed"
            type="number"
            // Fix: Use safe property access with fallback
            value={(performanceData.straightener as any)?.payoffMaxSpeed || ""}
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
          value={performanceData.feed?.motor || ""}
          onChange={handleChange}
        />
        <Input
          label="AMP"
          name="feed.amp"
          type="text"
          value={performanceData.feed?.amp || ""}
          onChange={handleChange}
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Input
          label="STR Speed (ft/min)"
          name="feed.maximumVelocity"
          type="number"
          value={performanceData.feed?.maximumVelocity || ""}
          onChange={handleChange}
        />
        <Input
          label="Friction @ DIE (lbs)"
          name="feed.frictionInDie"
          type="number"
          value={performanceData.feed?.frictionInDie || ""}
          onChange={handleChange}
        />
        <Input
          label="Acceleration Rate (ft/sec²)"
          name="feed.accelerationRate"
          type="number"
          value={performanceData.feed?.accelerationRate || ""}
          onChange={handleChange}
        />
        <Input
          label="Default Accel (ft/sec²)"
          name="feed.defaultAcceleration"
          type="number"
          value={performanceData.feed?.defaultAcceleration || ""}
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
    <Card>
      <Text as="h4" className="text-lg font-semibold mb-4">Feed Length & Speed Settings</Text>
      
      <div className="grid grid-cols-3 gap-6">
        <div>
          <Text as="h4" className="font-medium mb-2">Average</Text>
          <div className="space-y-2">
            <Input
              label="Length"
              name="feed.average.length"
              type="number"
              value={performanceData.feed?.average?.length || ""}
              onChange={handleChange}
            />
            <Input
              label="SPM"
              name="feed.average.spm"
              type="number"
              value={performanceData.feed?.average?.spm || ""}
              onChange={handleChange}
            />
            <Input
              label="FPM"
              name="feed.average.fpm"
              type="number"
              value={performanceData.feed?.average?.fpm || ""}
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
              value={performanceData.feed?.max?.length || ""}
              onChange={handleChange}
            />
            <Input
              label="SPM"
              name="feed.max.spm"
              type="number"
              value={performanceData.feed?.max?.spm || ""}
              onChange={handleChange}
            />
            <Input
              label="FPM"
              name="feed.max.fpm"
              type="number"
              value={performanceData.feed?.max?.fpm || ""}
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
              value={performanceData.feed?.min?.length || ""}
              onChange={handleChange}
            />
            <Input
              label="SPM"
              name="feed.min.spm"
              type="number"
              value={performanceData.feed?.min?.spm || ""}
              onChange={handleChange}
            />
            <Input
              label="FPM"
              name="feed.min.fpm"
              type="number"
              value={performanceData.feed?.min?.fpm || ""}
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
      <Card>
        <Text as="h3" className="text-xl font-semibold mb-4">Feed Configuration</Text>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Select
            label="Feed Type"
            name="feedType"
            value={feedType}
            onChange={handleFeedTypeChange}
            options={FEED_TYPE_OPTIONS}
          />
          <Input
            label="Application"
            name="feed.application"
            type="text"
            value={performanceData.feed?.application || ""}
            onChange={handleChange}
          />
          <Input
            label="Model"
            name="feed.model"
            type="text"
            value={performanceData.feed?.model || ""}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Input
            label="Machine Width"
            name="feed.machineWidth"
            type="number"
            value={performanceData.feed?.machineWidth || ""}
            onChange={handleChange}
          />
          <Select
            label="Loop Pit"
            name="feed.loopPit"
            value={performanceData.feed?.loopPit || ""}
            onChange={handleChange}
            options={LOOP_PIT_OPTIONS}
          />
          <Select
            label="Full Width Rolls"
            name="feed.fullWidthRolls"
            value={performanceData.feed?.fullWidthRolls || ""}
            onChange={handleChange}
            options={LOOP_PIT_OPTIONS}
          />
        </div>

        <div className="mb-6">
          <Text as="h4" className="text-lg font-semibold mb-4">Material Information</Text>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Input
              label="Width"
              name="material.coilWidth"
              type="number"
              value={performanceData.material?.coilWidth || ""}
              onChange={handleChange}
            />
            <Input
              label="Thickness"
              name="material.materialThickness"
              type="number"
              value={performanceData.material?.materialThickness || ""}
              onChange={handleChange}
            />
            <Input
              label="Press Bed Length"
              name="feed.pressBedLength"
              type="number"
              // Fix: Use safe property access with fallback
              value={(performanceData.feed as any)?.pressBedLength || ""}
              onChange={handleChange}
            />
            <Input
              label="Density"
              name="material.materialDensity"
              type="number"
              value={performanceData.material?.materialDensity || ""}
              onChange={handleChange}
            />
            <Input
              label="Mat'l In Loop"
              name="feed.materialInLoop"
              type="number"
              // Fix: Use safe property access with fallback
              value={(performanceData.feed as any)?.materialInLoop || ""}
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
      <Card>
        <Text as="h4" className="text-lg font-semibold mb-4">Performance Results</Text>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-border">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border p-2">Length</th>
                <th className="border border-border p-2">SPM @ 180°</th>
                <th className="border border-border p-2">FPM</th>
                <th className="border border-border p-2">SPM @ 240°</th>
                <th className="border border-border p-2">FPM</th>
              </tr>
            </thead>
            <tbody>
              {[4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60].map((length) => (
                <tr key={length}>
                  <td className="border border-border p-2 text-center">{length}</td>
                  <td className="border border-border p-2 text-center">#N/A</td>
                  <td className="border border-border p-2 text-center">#N/A</td>
                  <td className="border border-border p-2 text-center">#N/A</td>
                  <td className="border border-border p-2 text-center">#N/A</td>
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