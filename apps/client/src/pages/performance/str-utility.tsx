import Card from "@/components/common/card";
import Input from "@/components/common/input";
import Select from "@/components/common/select";
import Text from "@/components/common/text";
import { usePerformanceSheet } from "@/contexts/performance.context";

const STR_UTILITY_PAYOFF_OPTIONS = [
  { value: "TOP", label: "TOP" },
  { value: "BOTTOM", label: "BOTTOM" },
  { value: "LEFT", label: "LEFT" },
  { value: "RIGHT", label: "RIGHT" },
];

const STR_UTILITY_MATERIAL_OPTIONS = [
  { value: "Cold Rolled Steel", label: "Cold Rolled Steel" },
  { value: "Hot Rolled Steel", label: "Hot Rolled Steel" },
  { value: "Stainless Steel", label: "Stainless Steel" },
  { value: "Aluminum", label: "Aluminum" },
  { value: "Other", label: "Other" },
];

const AUTO_BRAKE_COMPENSATION_OPTIONS = [
  { value: "YES", label: "YES" },
  { value: "NO", label: "NO" },
];

const StrUtility = () => {
  const { performanceData, updatePerformanceData } = usePerformanceSheet();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Handle nested field updates based on field name pattern
    if (name.includes(".")) {
      const parts = name.split(".");
      const [section, ...rest] = parts;
      
      // Build the nested update object
      let updateObj: any = {};
      let current = updateObj;
      
      // Navigate to the correct nested level
      const sectionData = performanceData[section as keyof typeof performanceData];
      current[section] = { ...(typeof sectionData === "object" && sectionData !== null ? sectionData : {}) };
      current = current[section];
      
      // Handle deeper nesting
      for (let i = 0; i < rest.length - 1; i++) {
        current[rest[i]] = { ...current[rest[i]] };
        current = current[rest[i]];
      }
      
      // Set the final value
      current[rest[rest.length - 1]] = value;
      
      updatePerformanceData(updateObj);
    } else {
      // Handle legacy field names that map to nested structure
      const fieldMappings: { [key: string]: any } = {
        customer: {
          customer: value,
        },
        date: {
          dates: {
            ...performanceData.dates,
            date: value,
          },
        },
        referenceNumber: {
          referenceNumber: value,
        },
      };

      if (fieldMappings[name]) {
        updatePerformanceData(fieldMappings[name]);
      }
    }
  };

  // Calculate status indicators
  const getJackForceStatus = () => {
    const required = Number(performanceData.straightener?.required?.force || 0);
    const available = Number(performanceData.straightener?.jackForceAvailable || 0);
    return required <= available ? "JACK FORCE OK" : "JACK FORCE INSUFFICIENT";
  };

  const getPinchGearStatus = () => {
    const requiredTorque = Number(performanceData.straightener?.rolls?.pinch?.requiredGearTorque || 0);
    const ratedTorque = Number(performanceData.straightener?.rolls?.pinch?.ratedTorque || 0);
    return requiredTorque <= ratedTorque ? "PINCH GEAR OK" : "PINCH GEAR INSUFFICIENT";
  };

  const getStrGearStatus = () => {
    const requiredTorque = Number(performanceData.straightener?.rolls?.straightener?.requiredGearTorque || 0);
    const ratedTorque = Number(performanceData.straightener?.rolls?.straightener?.ratedTorque || 0);
    return requiredTorque <= ratedTorque ? "STR GEAR OK" : "STR GEAR INSUFFICIENT";
  };

  const getHpStatus = () => {
    const required = Number(performanceData.straightener?.required?.horsepower || 0);
    const available = Number(performanceData.straightener?.horsepower || 0);
    return required <= available ? "HP SUFFICIENT" : "HP INSUFFICIENT";
  };

  const getFpmStatus = () => {
    const feedRate = Number(performanceData.straightener?.feedRate || 0);
    return feedRate > 0 ? "FPM SUFFICIENT" : "FPM INSUFFICIENT";
  };

  return (
    <div className="w-full flex flex-1 flex-col p-2 gap-2">
      {/* Header Information */}
      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Straightener Selection Utility
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Customer"
            name="customer"
            value={performanceData.customer || ""}
            onChange={handleChange}
          />
          <Input
            label="Date"
            name="date"
            type="date"
            value={performanceData.dates?.date || ""}
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
            value={performanceData.straightener?.payoff || ""}
            onChange={handleChange}
            options={STR_UTILITY_PAYOFF_OPTIONS}
          />
          <Input
            label="Str. Model"
            name="straightener.model"
            value={performanceData.straightener?.model || ""}
            onChange={handleChange}
          />
          <Input
            label="Str. Width (in.)"
            name="straightener.width"
            type="number"
            value={performanceData.straightener?.width || ""}
            onChange={handleChange}
          />
          <Input
            label="No. of Str. Rolls"
            name="straightener.rolls.numberOfRolls"
            type="number"
            value={performanceData.straightener?.rolls?.numberOfRolls || ""}
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
            value={performanceData.straightener?.actualCoilWeight || ""}
            onChange={handleChange}
          />
          <Input
            label="Coil ID. (in)"
            name="coil.coilID"
            type="number"
            value={performanceData.coil?.coilID || ""}
            onChange={handleChange}
          />
          <Input
            label="Coil Width (in)"
            name="material.coilWidth"
            type="number"
            value={performanceData.material?.coilWidth || ""}
            onChange={handleChange}
          />
          <Input
            label="Thickness (in)"
            name="material.materialThickness"
            type="number"
            value={performanceData.material?.materialThickness || ""}
            onChange={handleChange}
          />
          <Input
            label="Yield Strength (psi)"
            name="material.maxYieldStrength"
            type="number"
            value={performanceData.material?.maxYieldStrength || ""}
            onChange={handleChange}
          />
          <Select
            label="Material"
            name="material.materialType"
            value={performanceData.material?.materialType || ""}
            onChange={handleChange}
            options={STR_UTILITY_MATERIAL_OPTIONS}
          />
        </div>
      </Card>

      {/* Operating Parameters */}
      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Operating Parameters
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Horse Power (HP)"
            name="straightener.horsepower"
            type="number"
            value={performanceData.straightener?.horsepower || ""}
            onChange={handleChange}
          />
          <Input
            label="Acceleration (ft/sec²)"
            name="straightener.acceleration"
            type="number"
            value={performanceData.straightener?.acceleration || ""}
            onChange={handleChange}
          />
          <Input
            label="Feed Rate (ft/min)"
            name="straightener.feedRate"
            type="number"
            value={performanceData.straightener?.feedRate || ""}
            onChange={handleChange}
          />
          <Select
            label="Auto. Brake Compen."
            name="straightener.autoBrakeCompensation"
            value={performanceData.straightener?.autoBrakeCompensation || ""}
            onChange={handleChange}
            options={AUTO_BRAKE_COMPENSATION_OPTIONS}
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
            value={performanceData.straightener?.rolls?.straightener?.diameter || ""}
            onChange={handleChange}
          />
          <Input
            label="Pinch Roll Dia. (in)"
            name="straightener.rolls.pinch.diameter"
            type="number"
            value={performanceData.straightener?.rolls?.pinch?.diameter || ""}
            onChange={handleChange}
          />
          <Input
            label="Center Dist. (in)"
            name="straightener.centerDistance"
            type="number"
            value={performanceData.straightener?.centerDistance || ""}
            onChange={handleChange}
          />
          <Input
            label="Jack Force Avail. (lbs)"
            name="straightener.jackForceAvailable"
            type="number"
            value={performanceData.straightener?.jackForceAvailable || ""}
            onChange={handleChange}
          />
          <Input
            label="Max. Roll Depth (in)"
            name="straightener.rolls.depth.withoutMaterial"
            type="number"
            value={performanceData.straightener?.rolls?.depth?.withoutMaterial || ""}
            onChange={handleChange}
          />
          <Input
            label="Modulus (psi)"
            name="straightener.modulus"
            type="number"
            value={performanceData.straightener?.modulus || ""}
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
                value={performanceData.straightener?.gear?.pinchRoll?.numberOfTeeth || ""}
                onChange={handleChange}
              />
              <Input
                label="DP"
                name="straightener.gear.pinchRoll.dp"
                type="number"
                value={performanceData.straightener?.gear?.pinchRoll?.dp || ""}
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
                value={performanceData.straightener?.gear?.straightenerRoll?.numberOfTeeth || ""}
                onChange={handleChange}
              />
              <Input
                label="DP"
                name="straightener.gear.straightenerRoll.dp"
                type="number"
                value={performanceData.straightener?.gear?.straightenerRoll?.dp || ""}
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
            value={performanceData.straightener?.gear?.faceWidth || ""}
            onChange={handleChange}
          />
          <Input
            label="Cont. Angle (degree)"
            name="straightener.gear.contAngle"
            type="number"
            value={performanceData.straightener?.gear?.contAngle || ""}
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
                value={performanceData.straightener?.required?.force || ""}
                readOnly
                className="bg-green-100"
              />
              <Input
                label="Rated Force (lbs)"
                name="straightener.required.ratedForce"
                value={performanceData.straightener?.required?.ratedForce || ""}
                readOnly
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Pinch Roll Req. Torque"
                name="straightener.rolls.pinch.requiredGearTorque"
                value={performanceData.straightener?.rolls?.pinch?.requiredGearTorque || ""}
                readOnly
                className="bg-green-100"
              />
              <Input
                label="Pinch Roll Rated Torque"
                name="straightener.rolls.pinch.ratedTorque"
                value={performanceData.straightener?.rolls?.pinch?.ratedTorque || ""}
                readOnly
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Str. Roll Req. Torque"
                name="straightener.rolls.straightener.requiredGearTorque"
                value={performanceData.straightener?.rolls?.straightener?.requiredGearTorque || ""}
                readOnly
                className="bg-green-100"
              />
              <Input
                label="Str. Roll Rated Torque"
                name="straightener.rolls.straightener.ratedTorque"
                value={performanceData.straightener?.rolls?.straightener?.ratedTorque || ""}
                readOnly
              />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Horse Power Required (HP)"
                name="straightener.required.horsepower"
                value={performanceData.straightener?.required?.horsepower || ""}
                readOnly
                className="bg-green-100"
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
                value={performanceData.straightener?.actualCoilWeight || ""}
                readOnly
              />
              <Input
                label="Coil OD. (in)"
                name="straightener.coilOD"
                value={performanceData.straightener?.coilOD || ""}
                readOnly
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Str. Torque (in lbs)"
                name="straightener.torque.straightener"
                value={performanceData.straightener?.torque?.straightener || ""}
                readOnly
              />
              <Input
                label="Accel. Torque (in lbs)"
                name="straightener.torque.acceleration"
                value={performanceData.straightener?.torque?.acceleration || ""}
                readOnly
              />
              <Input
                label="Brake Torque (in lbs)"
                name="straightener.torque.brake"
                value={performanceData.straightener?.torque?.brake || ""}
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