import { useState, useEffect } from "react";
import Card from "@/components/common/card";
import Input from "@/components/common/input";
import Select from "@/components/common/select";
import Text from "@/components/common/text";
import Button from "@/components/common/button";
import { PerformanceData } from "@/contexts/performance.context";
import {
  MATERIAL_TYPE_OPTIONS,
  ROLL_TYPE_OPTIONS,
} from "@/utils/select-options";

const ROLL_CONFIGURATION_OPTIONS = [
  { value: "7", label: "7 Roll" },
  { value: "9", label: "9 Roll" },
  { value: "11", label: "11 Roll" },
];

export interface RollStrBackbendProps {
  data: PerformanceData;
  isEditing?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | Partial<PerformanceData>) => void;
}

const RollStrBackbend: React.FC<RollStrBackbendProps> = ({ data, isEditing, onChange }) => {
  // Determine roll configuration from straightener.rolls.numberOfRolls
  const getRollConfiguration = () => {
    const straightenerRolls = data.straightener?.rolls?.numberOfRolls;
    const rollsString = String(straightenerRolls);
    
    if (rollsString === "7" || rollsString === "9" || rollsString === "11") {
      return rollsString;
    }
    return "7"; // Default to 7 if not one of the valid options
  };

  const [rollConfiguration, setRollConfiguration] = useState<string>(getRollConfiguration());

  // Update rollConfiguration when data changes
  useEffect(() => {
    const newRollConfig = getRollConfiguration();
    if (newRollConfig !== rollConfiguration) {
      setRollConfiguration(newRollConfig);
    }
  }, [data.straightener?.rolls?.numberOfRolls]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!isEditing) return;
    
    const { name, value, type } = e.target;
    const actualValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    // Handle nested field updates based on field name pattern
    if (name.includes(".")) {
      const parts = name.split(".");
      const [section, ...rest] = parts;
      
      // Build the nested update object
      let updateObj: any = {};
      let current = updateObj;
      
      // Navigate to the correct nested level
      const sectionData = data[section as keyof typeof data];
      current[section] = { ...(typeof sectionData === "object" && sectionData !== null ? sectionData : {}) };
      current = current[section];
      
      // Handle deeper nesting
      for (let i = 0; i < rest.length - 1; i++) {
        current[rest[i]] = { ...current[rest[i]] };
        current = current[rest[i]];
      }
      
      // Set the final value
      current[rest[rest.length - 1]] = actualValue;
      
      if (onChange) {
        onChange(updateObj);
      }
    } else {
      // Handle legacy field names that map to nested structure
      const fieldMappings: { [key: string]: any } = {
        customer: {
          customer: value,
        },
        date: {
          dates: {
            ...data.dates,
            date: value,
          },
        },
        referenceNumber: {
          referenceNumber: value,
        },
      };

      if (fieldMappings[name] && onChange) {
        onChange(fieldMappings[name]);
      } else if (onChange) {
        onChange(e);
      }
    }
  };

  const handleRollConfigurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newConfig = e.target.value;
    setRollConfiguration(newConfig);
    
    // Update the straightener.rolls.numberOfRolls value
    if (onChange) {
      onChange({
        straightener: {
          ...data.straightener,
          rolls: {
            ...data.straightener?.rolls,
            numberOfRolls: Number(newConfig),
          },
        },
      });
    }
  };

  const handleCalculate = () => {
    // Trigger calculation logic here
    console.log("Calculate pressed for", rollConfiguration, "roll configuration");
    // In a real implementation, this would trigger backend calculations
    // and update the data with new backbend calculation results
  };

  // Get roller columns based on configuration
  const getRollerColumns = () => {
    switch (rollConfiguration) {
      case "7":
        return [
          { label: "FIRST ROLLER", index: 0 },
          { label: "MID. ROLLER", index: 1 },
          { label: "LAST ROLLER", index: 2 },
        ];
      case "9":
        return [
          { label: "FIRST ROLLER", index: 0 },
          { label: "MID. ROLLER", index: 1 },
          { label: "MID. ROLLER", index: 2 },
          { label: "LAST ROLLER", index: 3 },
        ];
      case "11":
        return [
          { label: "FIRST ROLLER", index: 0 },
          { label: "MID. ROLLER", index: 1 },
          { label: "MID. ROLLER", index: 2 },
          { label: "MID. ROLLER", index: 3 },
          { label: "LAST ROLLER", index: 4 },
        ];
      default:
        return [];
    }
  };

  const rollerColumns = getRollerColumns();

  // Get calculation data from data.straightener.rolls.backbend
  const backbendData = data.straightener?.rolls?.backbend || {};
  
  // Helper function to get roller data based on configuration
  const getRollerData = () => {
    const rollers = backbendData.rollers || {};
    const config = rollConfiguration;
    
    // Define which rollers to use based on configuration
    let rollerKeys: string[] = [];
    switch (config) {
      case "7":
        rollerKeys = ["first", "middle", "last"];
        break;
      case "9":
        rollerKeys = ["first", "middle", "middle", "last"];
        break;
      case "11":
        rollerKeys = ["first", "middle", "middle", "middle", "last"];
        break;
      default:
        rollerKeys = ["first", "middle", "last"];
    }
    
    return { rollers, rollerKeys };
  };
  
  const { rollers, rollerKeys } = getRollerData();
  
  // Helper function to extract array data from roller structure
  const extractRollerArray = (dataType: 'height' | 'forceRequired' | 'numberOfYieldStrainsAtSurface') => {
    return rollerKeys.map(key => {
      if (key === "middle" && rollerKeys.filter(k => k === "middle").length > 1) {
        // For multiple middle rollers, we need to handle indexing
        const middleIndex = rollerKeys.slice(0, rollerKeys.indexOf(key) + 1).filter(k => k === "middle").length - 1;
        const middleArray = Array.isArray(rollers.middle) ? rollers.middle : [];
        return middleArray[middleIndex]?.[dataType] || 0;
      }
      // Only allow 'first', 'middle', or 'last' as keys
      if (key === "first" || key === "last") {
        return (rollers[key as "first" | "last"]?.[dataType] ?? 0);
      }
      return 0;
    });
  };
  
  // Helper function to extract up/down data
  const extractUpDownArray = (dataType: 'resultingRadius' | 'curvatureDifference' | 'bendingMoment' | 'springback' | 'percentOfThicknessYielded' | 'radiusAfterSpringback') => {
    const result: number[] = [];
    
    rollerKeys.forEach((key, index) => {
      let rollerData;
      if (key === "middle" && rollerKeys.filter(k => k === "middle").length > 1) {
        const middleIndex = rollerKeys.slice(0, index + 1).filter(k => k === "middle").length - 1;
        rollerData = Array.isArray(rollers.middle) ? rollers.middle[middleIndex] : undefined;
      } else {
        if (key === "first" || key === "last") {
          rollerData = rollers[key as "first" | "last"];
        } else {
          rollerData = undefined;
        }
      }
      
      // Add up value
      result.push(rollerData?.up?.[dataType] || 0);
      
      // Add down value (except for last roller)
      if (key !== "last") {
        result.push(rollerData?.down?.[dataType] || 0);
      }
    });
    
    return result;
  };
  
  // Helper function to extract direction of bend
  const extractDirectionArray = () => {
    const result: string[] = [];
    
    rollerKeys.forEach((key) => {
      if (key === "middle" && rollerKeys.filter(k => k === "middle").length > 1) {
      } else {
        if (key === "first" || key === "last") {
        } else if (key === "middle") {
        } else {
        }
      }
      
      // Add up direction
      result.push("UP");
      
      // Add down direction (except for last roller)
      if (key !== "last") {
        result.push("DOWN");
      }
    });
    
    return result;
  };

  const calculationData = {
    ro: backbendData.radius?.comingOffCoil || 0,
    ri: backbendData.radius?.offCoilAfterSpringback || 0,
    ry: backbendData.radius?.requiredToYieldSkinOfFlatMaterial || 0,
    oneOverRi: 0,
    oneOverRy: 0,
    my: backbendData.bendingMomentToYieldSkin || 0,
    rollHeight: extractRollerArray('height'),
    resultingRadius: extractUpDownArray('resultingRadius'),
    directionOfBend: extractDirectionArray(),
    oneRMinusOneRi: extractUpDownArray('curvatureDifference'),
    mb: extractUpDownArray('bendingMoment'),
    mbOverMy: extractUpDownArray('bendingMoment').map(mb => mb / (backbendData.bendingMomentToYieldSkin || 1)),
    forceRequired: extractRollerArray('forceRequired'),
    springback: extractUpDownArray('springback'),
    percentYielded: extractUpDownArray('percentOfThicknessYielded'),
    yieldStrains: extractRollerArray('numberOfYieldStrainsAtSurface'),
    radiusAfterSpringback: extractUpDownArray('radiusAfterSpringback'),
    rollerDepthRequired: backbendData.rollers?.depthRequired || 0,
    rollerForceRequired: backbendData.rollers?.forceRequired || 0,
    yieldMet: backbendData.yieldMet || false,
  };

  calculationData.oneOverRi = calculationData.ri !== 0 ? 1 / calculationData.ri : 0;
  calculationData.oneOverRy = calculationData.ry !== 0 ? 1 / calculationData.ry : 0;

  return (
    <div className="w-full flex flex-1 flex-col p-2 gap-2">
      {/* Header Information */}
      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Straightener Backbend - {rollConfiguration} Roll
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            label="Customer"
            name="customer"
            value={data.customer || ""}
            onChange={handleChange}
          />
          <Input
            label="Date"
            name="date"
            type="date"
            value={data.dates?.date || ""}
            onChange={handleChange}
          />
          <Select
            label="Number of Rolls"
            name="straightener.rolls.numberOfRolls"
            value={rollConfiguration}
            onChange={handleRollConfigurationChange}
            options={ROLL_CONFIGURATION_OPTIONS}
          />
        </div>
      </Card>

      {/* Material & Coil Information */}
      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Material & Coil Information
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            label="Coil Width (in)"
            name="material.coilWidth"
            type="number"
            value={data.material?.coilWidth || ""}
            onChange={handleChange}
          />
          <Input
            label="Material Thickness (in)"
            name="material.materialThickness"
            type="number"
            value={data.material?.materialThickness || ""}
            onChange={handleChange}
          />
          <Input
            label="Yield Strength (psi)"
            name="material.maxYieldStrength"
            type="number"
            value={data.material?.maxYieldStrength || ""}
            onChange={handleChange}
          />
          <Select
            label="Material Type"
            name="material.materialType"
            value={data.material?.materialType || ""}
            onChange={handleChange}
            options={MATERIAL_TYPE_OPTIONS}
          />
          <Input
            label="Straightener Model"
            name="straightener.model"
            value={data.straightener?.model || ""}
            onChange={handleChange}
          />
          <Select
            label="Roll Type"
            name="straightener.rolls.typeOfRoll"
            value={data.straightener?.rolls?.typeOfRoll || ""}
            onChange={handleChange}
            options={ROLL_TYPE_OPTIONS}
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
            label="Roll Dia. (in)"
            name="straightener.rollDiameter"
            type="number"
            value={data.straightener?.rollDiameter || ""}
            onChange={handleChange}
          />
          <Input
            label="Center Distance (in)"
            name="straightener.centerDistance"
            type="number"
            value={data.straightener?.centerDistance || ""}
            onChange={handleChange}
          />
          <Input
            label="Modulus (psi)"
            name="straightener.modulus"
            type="number"
            value={data.straightener?.modulus || ""}
            onChange={handleChange}
          />
          <Input
            label="Jack Force Available (lb)"
            name="straightener.jackForceAvailable"
            type="number"
            value={data.straightener?.jackForceAvailable || ""}
            onChange={handleChange}
          />
          <Input
            label="Max. Roller Depth W/Out Material (in)"
            name="straightener.rolls.depth.withoutMaterial"
            type="number"
            value={data.straightener?.rolls?.depth?.withoutMaterial || ""}
            onChange={handleChange}
          />
          <Input
            label="Max. Roller Depth W/ Material (in)"
            name="straightener.rolls.depth.withMaterial"
            type="number"
            value={data.straightener?.rolls?.depth?.withMaterial || ""}
            onChange={handleChange}
          />
        </div>
      </Card>

      {/* Radius Calculations */}
      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Radius Calculations
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Ro (Radius Coming Off Coil)"
            value={typeof calculationData.ro === "number" ? calculationData.ro.toFixed(2) : ""}
            readOnly
            className="bg-gray-100"
          />
          <Input
            label="Ri (Radius Off Coil After Springback)"
            value={typeof calculationData.ri === "number" ? calculationData.ri.toFixed(2) : ""}
            readOnly
            className="bg-gray-100"
          />
          <Input
            label="1/Ri"
            value={calculationData.oneOverRi?.toFixed(4) || ""}
            readOnly
            className="bg-gray-100"
          />
          <Input
            label="1/Ry"
            value={calculationData.oneOverRy?.toFixed(4) || ""}
            readOnly
            className="bg-gray-100"
          />
          <Input
            label="Ry (Radius Required to Yield Skin)"
            value={typeof calculationData.ry === "number" ? calculationData.ry.toFixed(2) : ""}
            readOnly
            className="bg-gray-100"
          />
          <Input
            label="My (Bending Moment to Yield Skin)"
            value={typeof calculationData.my === "number" ? calculationData.my.toFixed(2) : ""}
            readOnly
            className="bg-gray-100"
          />
        </div>
        <div className="mt-4 flex justify-center">
          <Button onClick={handleCalculate} className="px-6 py-2">
            CALCULATE
          </Button>
        </div>
      </Card>

            {/* Roller Analysis Table */}
      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Roller Analysis
        </Text>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left text-sm font-medium" rowSpan={2}>Parameter</th>
                {rollerColumns.map((column, index) => (
                  <th key={index} className="border border-gray-300 p-2 text-center text-sm font-medium" colSpan={index === rollerColumns.length - 1 ? 1 : 2}>
                    {column.label}
                  </th>
                ))}
              </tr>
              <tr className="bg-gray-100">
                {rollerColumns.map((_column, index) => (
                  index === rollerColumns.length - 1 ? (
                    // Last roller only has "up"
                    <th key={`${index}-up`} className="border border-gray-300 p-1 text-center text-xs font-medium">
                      UP
                    </th>
                  ) : (
                    // All other rollers have both "up" and "down"
                    <>
                      <th key={`${index}-up`} className="border border-gray-300 p-1 text-center text-xs font-medium">
                        UP
                      </th>
                      <th key={`${index}-down`} className="border border-gray-300 p-1 text-center text-xs font-medium">
                        DOWN
                      </th>
                    </>
                  )
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 text-sm font-medium text-white">ROLL HEIGHT</td>
                {rollerColumns.map((column, index) => (
                  index === rollerColumns.length - 1 ? (
                    // Last roller only shows one value
                    <td key={index} className="border border-gray-300 p-2 text-center text-sm text-white">
                      {calculationData.rollHeight[column.index]?.toFixed(3) || "-"}
                    </td>
                  ) : (
                    // Other rollers show value in UP column, empty in DOWN column
                    <>
                      <td key={`${index}-up`} className="border border-gray-300 p-2 text-center text-sm text-white">
                        {calculationData.rollHeight[column.index]?.toFixed(3) || "-"}
                      </td>
                      <td key={`${index}-down`} className="border border-gray-300 p-2 text-center text-sm text-white">
                        -
                      </td>
                    </>
                  )
                ))}
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 text-sm font-medium text-white">RESULTING RADIUS</td>
                {rollerColumns.map((column, index) => (
                  index === rollerColumns.length - 1 ? (
                    // Last roller only shows up value
                    <td key={index} className="border border-gray-300 p-2 text-center text-sm text-white">
                      {calculationData.resultingRadius[column.index * 2]?.toFixed(2) || "-"}
                    </td>
                  ) : (
                    // Other rollers show both up and down
                    <>
                      <td key={`${index}-up`} className="border border-gray-300 p-2 text-center text-sm text-white">
                        {calculationData.resultingRadius[column.index * 2]?.toFixed(2) || "-"}
                      </td>
                      <td key={`${index}-down`} className="border border-gray-300 p-2 text-center text-sm text-white">
                        {calculationData.resultingRadius[column.index * 2 + 1]?.toFixed(2) || "-"}
                      </td>
                    </>
                  )
                ))}
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 text-sm font-medium text-white">DIRECTION OF BEND</td>
                {rollerColumns.map((column, index) => (
                  index === rollerColumns.length - 1 ? (
                    // Last roller only shows up direction
                    <td key={index} className="border border-gray-300 p-2 text-center text-sm text-white">
                      {calculationData.directionOfBend[column.index * 2] || "-"}
                    </td>
                  ) : (
                    // Other rollers show both up and down directions
                    <>
                      <td key={`${index}-up`} className="border border-gray-300 p-2 text-center text-sm text-white">
                        {calculationData.directionOfBend[column.index * 2] || "-"}
                      </td>
                      <td key={`${index}-down`} className="border border-gray-300 p-2 text-center text-sm text-white">
                        {calculationData.directionOfBend[column.index * 2 + 1] || "-"}
                      </td>
                    </>
                  )
                ))}
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 text-sm font-medium text-white">1/R-1/Ri</td>
                {rollerColumns.map((column, index) => (
                  index === rollerColumns.length - 1 ? (
                    <td key={index} className="border border-gray-300 p-2 text-center text-sm text-white">
                      {calculationData.oneRMinusOneRi[column.index * 2]?.toFixed(4) || "-"}
                    </td>
                  ) : (
                    <>
                      <td key={`${index}-up`} className="border border-gray-300 p-2 text-center text-sm text-white">
                        {calculationData.oneRMinusOneRi[column.index * 2]?.toFixed(4) || "-"}
                      </td>
                      <td key={`${index}-down`} className="border border-gray-300 p-2 text-center text-sm text-white">
                        {calculationData.oneRMinusOneRi[column.index * 2 + 1]?.toFixed(4) || "-"}
                      </td>
                    </>
                  )
                ))}
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 text-sm font-medium text-white">Mb</td>
                {rollerColumns.map((column, index) => (
                  index === rollerColumns.length - 1 ? (
                    <td key={index} className="border border-gray-300 p-2 text-center text-sm text-white">
                      {calculationData.mb[column.index * 2]?.toFixed(2) || "-"}
                    </td>
                  ) : (
                    <>
                      <td key={`${index}-up`} className="border border-gray-300 p-2 text-center text-sm text-white">
                        {calculationData.mb[column.index * 2]?.toFixed(2) || "-"}
                      </td>
                      <td key={`${index}-down`} className="border border-gray-300 p-2 text-center text-sm text-white">
                        {calculationData.mb[column.index * 2 + 1]?.toFixed(2) || "-"}
                      </td>
                    </>
                  )
                ))}
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 text-sm font-medium text-white">Mb/My</td>
                {rollerColumns.map((column, index) => (
                  index === rollerColumns.length - 1 ? (
                    <td key={index} className="border border-gray-300 p-2 text-center text-sm text-white">
                      {calculationData.mbOverMy[column.index * 2]?.toFixed(4) || "-"}
                    </td>
                  ) : (
                    <>
                      <td key={`${index}-up`} className="border border-gray-300 p-2 text-center text-sm text-white">
                        {calculationData.mbOverMy[column.index * 2]?.toFixed(4) || "-"}
                      </td>
                      <td key={`${index}-down`} className="border border-gray-300 p-2 text-center text-sm text-white">
                        {calculationData.mbOverMy[column.index * 2 + 1]?.toFixed(4) || "-"}
                      </td>
                    </>
                  )
                ))}
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 text-sm font-medium text-white">FORCE REQUIRED</td>
                {rollerColumns.map((column, index) => (
                  index === rollerColumns.length - 1 ? (
                    <td key={index} className="border border-gray-300 p-2 text-center text-sm text-white">
                      {calculationData.forceRequired[column.index]?.toFixed(2) || "-"}
                    </td>
                  ) : (
                    // Show force required only in UP column, empty in DOWN column
                    <>
                      <td key={`${index}-up`} className="border border-gray-300 p-2 text-center text-sm text-white">
                        {calculationData.forceRequired[column.index]?.toFixed(2) || "-"}
                      </td>
                      <td key={`${index}-down`} className="border border-gray-300 p-2 text-center text-sm text-white">
                        -
                      </td>
                    </>
                  )
                ))}
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 text-sm font-medium text-white">SPRINGBACK</td>
                {rollerColumns.map((column, index) => (
                  index === rollerColumns.length - 1 ? (
                    <td key={index} className="border border-gray-300 p-2 text-center text-sm text-white">
                      {calculationData.springback[column.index * 2]?.toFixed(4) || "-"}
                    </td>
                  ) : (
                    <>
                      <td key={`${index}-up`} className="border border-gray-300 p-2 text-center text-sm text-white">
                        {calculationData.springback[column.index * 2]?.toFixed(4) || "-"}
                      </td>
                      <td key={`${index}-down`} className="border border-gray-300 p-2 text-center text-sm text-white">
                        {calculationData.springback[column.index * 2 + 1]?.toFixed(4) || "-"}
                      </td>
                    </>
                  )
                ))}
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 text-sm font-medium text-white">% OF MAT'L THK. YIELDED</td>
                {rollerColumns.map((column, index) => (
                  index === rollerColumns.length - 1 ? (
                    <td key={index} className={`border border-gray-300 p-2 text-white text-center text-sm font-semibold ${
                      calculationData.percentYielded[column.index * 2] >= 70 ? 'bg-green-400' : ''
                    }`}>
                      {calculationData.percentYielded[column.index * 2] ? `${calculationData.percentYielded[column.index * 2]}%` : "-"}
                    </td>
                  ) : (
                    <>
                      <td key={`${index}-up`} className={`border border-gray-300 p-2 text-white text-center text-sm font-semibold ${
                        calculationData.percentYielded[column.index * 2] >= 70 ? 'bg-green-400' : ''
                      }`}>
                        {calculationData.percentYielded[column.index * 2] ? `${calculationData.percentYielded[column.index * 2]}%` : "-"}
                      </td>
                      <td key={`${index}-down`} className={`border border-gray-300 p-2 text-white text-center text-sm font-semibold ${
                        calculationData.percentYielded[column.index * 2 + 1] >= 70 ? 'bg-green-400' : ''
                      }`}>
                        {calculationData.percentYielded[column.index * 2 + 1] ? `${calculationData.percentYielded[column.index * 2 + 1]}%` : "-"}
                      </td>
                    </>
                  )
                ))}
              </tr>
              {rollConfiguration === "7" && calculationData.yieldStrains?.length > 0 && (
                <tr>
                  <td className="border border-gray-300 p-2 text-sm font-medium text-white"># OF YIELD STRAINS AT SURFACE</td>
                  {rollerColumns.map((column, index) => (
                    index === rollerColumns.length - 1 ? (
                      <td key={index} className="border border-gray-300 p-2 text-center text-sm text-white">
                        {calculationData.yieldStrains[column.index]?.toFixed(2) || "-"}
                      </td>
                    ) : (
                      // Show yield strains only in UP column, empty in DOWN column
                      <>
                        <td key={`${index}-up`} className="border border-gray-300 p-2 text-center text-sm text-white">
                          {calculationData.yieldStrains[column.index]?.toFixed(2) || "-"}
                        </td>
                        <td key={`${index}-down`} className="border border-gray-300 p-2 text-center text-sm text-white">
                          -
                        </td>
                      </>
                    )
                  ))}
                </tr>
              )}
              <tr>
                <td className="border border-gray-300 p-2 text-sm font-medium text-white">RADIUS AFTER SPRINGBACK</td>
                {rollerColumns.map((column, index) => (
                  index === rollerColumns.length - 1 ? (
                    <td key={index} className="border border-gray-300 p-2 text-center text-sm text-white">
                      {calculationData.radiusAfterSpringback[column.index * 2]?.toFixed(2) || "-"}
                    </td>
                  ) : (
                    <>
                      <td key={`${index}-up`} className="border border-gray-300 p-2 text-center text-sm text-white">
                        {calculationData.radiusAfterSpringback[column.index * 2]?.toFixed(2) || "-"}
                      </td>
                      <td key={`${index}-down`} className="border border-gray-300 p-2 text-center text-sm text-white">
                        {calculationData.radiusAfterSpringback[column.index * 2 + 1]?.toFixed(2) || "-"}
                      </td>
                    </>
                  )
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Status Summary */}
      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Status Summary
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-3 rounded text-center font-medium ${
            calculationData.rollerDepthRequired <= (data.straightener?.rolls?.depth?.withoutMaterial || 0) 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            <Text className="text-sm">ROLLER DEPTH REQ'D:</Text>
            <Text className="text-lg font-bold">
              {calculationData.rollerDepthRequired?.toFixed(4) || "0.0000"} {
                calculationData.rollerDepthRequired <= (data.straightener?.rolls?.depth?.withoutMaterial || 0) ? "OK" : "NOT OK"
              }
            </Text>
          </div>
          <div className={`p-3 rounded text-center font-medium ${
            calculationData.rollerForceRequired <= (data.straightener?.jackForceAvailable || 0)
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            <Text className="text-sm">ROLLER FORCE REQ'D:</Text>
            <Text className="text-lg font-bold">
              {calculationData.rollerForceRequired?.toFixed(2) || "0.00"} {
                calculationData.rollerForceRequired <= (data.straightener?.jackForceAvailable || 0) ? "OK" : "NOT OK"
              }
            </Text>
          </div>
          <div className={`p-3 rounded text-center font-medium ${
            calculationData.yieldMet ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <Text className="text-sm">YIELD MET:</Text>
            <Text className="text-lg font-bold">{calculationData.yieldMet ? "OK" : "NOT OK"}</Text>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RollStrBackbend;