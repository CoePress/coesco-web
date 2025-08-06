import { useState, useEffect } from "react";
import Card from "@/components/common/card";
import Input from "@/components/common/input";
import Select from "@/components/common/select";
import Text from "@/components/common/text";
import Button from "@/components/common/button";
import { PerformanceData } from "@/contexts/performance.context";

const SHEAR_TYPE_OPTIONS = [
  { value: "single-rake", label: "Single Rake" },
  { value: "bow-tie", label: "Bow Tie" },
];

export interface ShearProps {
  data: PerformanceData;
  isEditing: boolean;
}

const Shear: React.FC<ShearProps> = ({ data, isEditing }) => {
  
  // Determine shear type based on current data or default
  const getShearType = () => {
    return data.shear?.model || "single-rake";
  };

  const [shearType, setShearType] = useState<string>(getShearType());

  useEffect(() => {
    setShearType(getShearType());
  }, [data.shear?.model]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!isEditing) return;
    
    const { name, value, type } = e.target;
    const actualValue = type === "number" ? (value === "" ? "" : Number(value)) : value;

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
      
      /////////////////////////////////
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

      if (fieldMappings[name]) {
        /////////////////////////////////
      }
    }
  };

  const handleShearTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    setShearType(newType);
    
    //////////////////////////////
  };

  const handleCalculate = () => {
    // Trigger calculation logic here
    console.log("Calculate pressed for", shearType, "shear configuration");
    // In a real implementation, this would trigger backend calculations
    // and update the data with new shear calculation results
  };

  // Get shear data from data
  const shearData = data.shear || {};
  const materialData = data.material || {};

  // Calculate derived values
  const calculateDerivedValues = () => {
    const materialThickness = Number(materialData.materialThickness) || 0;
    const coilWidth = Number(materialData.coilWidth) || 0;
    const materialTensile = Number(materialData.maxTensileStrength) || 0;
    const rakeOfBlade = Number(shearData.blade?.rakeOfBladePerFoot) || 0;
    const overlap = Number(shearData.blade?.overlap) || 0;
    const bladeOpening = Number(shearData.blade?.bladeOpening) || 0;
    const penetration = Number(shearData.blade?.percentOfPenetration) || 38; // Default 38%
    const boreSize = Number(shearData.cylinder?.boreSize) || 0;
    const rodDia = Number(shearData.cylinder?.rodDiameter) || 0;
    const stroke = Number(shearData.cylinder?.stroke) || 0;
    const pressure = Number(shearData.hydraulic?.pressure) || 0;
    const downwardStrokeTime = Number(shearData.time?.forDownwardStroke) || 0;
    const dwellTime = Number(shearData.time?.dwellTime) || 0;

    // Calculated Variables
    const angleOfBlade = rakeOfBlade * 12 * Math.PI / 180; // Convert to radians, then to display value
    const lengthOfInitialCut = coilWidth / Math.cos(rakeOfBlade * Math.PI / 180);
    const areaOfCut = materialThickness * lengthOfInitialCut;
    
    // Shear strength (70-80% of tensile)
    const shearStrength = materialTensile * 0.75; // Using 75% as middle value
    
    // Minimum stroke calculations
    const minimumStrokeForBlade = materialThickness * (penetration / 100) + overlap;
    const minStrokeForDesiredOpening = minimumStrokeForBlade + bladeOpening;
    const actualOpeningAboveMaxMaterial = stroke - minimumStrokeForBlade;
    
    // Cylinder calculations
    const cylinderArea = Math.PI * Math.pow(boreSize / 2, 2) - Math.PI * Math.pow(rodDia / 2, 2);
    const cylinderVolume = cylinderArea * stroke;
    const fluidVelocity = stroke / (downwardStrokeTime * 12); // ft/sec
    
    // Force calculations
    const forcePerCylinder = cylinderArea * pressure;
    const totalForceApplied = forcePerCylinder * 2; // Assuming 2 cylinders
    const forceReqToShear = areaOfCut * shearStrength;
    const totalForceAppliedTons = totalForceApplied / 2000;
    const safetyFactor = forceReqToShear > 0 ? totalForceApplied / forceReqToShear : 0;
    
    // Flow calculations
    const cycleTime = downwardStrokeTime + dwellTime + downwardStrokeTime; // Down + dwell + up
    const strokesPerMinute = cycleTime > 0 ? 60 / cycleTime : 0;
    const instantaneousGPM = (cylinderVolume * 2) / 231 * (60 / downwardStrokeTime); // 2 cylinders, 231 cubic inches per gallon
    const averagedGPM = instantaneousGPM * (downwardStrokeTime / cycleTime);
    const partsPerMinute = strokesPerMinute;
    const partsPerHour = partsPerMinute * 60;

    return {
      angleOfBlade: angleOfBlade * 180 / Math.PI, // Convert back to degrees for display
      lengthOfInitialCut,
      areaOfCut,
      shearStrength,
      minimumStrokeForBlade,
      minStrokeForDesiredOpening,
      actualOpeningAboveMaxMaterial,
      cylinderArea,
      cylinderVolume,
      fluidVelocity,
      forcePerCylinder,
      totalForceApplied,
      forceReqToShear,
      totalForceAppliedTons,
      safetyFactor,
      strokesPerMinute,
      instantaneousGPM,
      averagedGPM,
      partsPerMinute,
      partsPerHour,
    };
  };

  const calculatedValues = calculateDerivedValues();

  return (
    <div className="w-full flex flex-1 flex-col p-2 gap-2">
      {/* Header Information */}
      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Shear Design - {shearType === "single-rake" ? "Single Rake" : "Bow Tie"}
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            label="Shear Type"
            name="shear.type"
            value={shearType}
            onChange={handleShearTypeChange}
            options={SHEAR_TYPE_OPTIONS}
          />
        </div>
      </Card>

      {/* User Defined Variables */}
      <Card className="mb-0 p-4">
        {/* Material Specifications */}
        <div className="mb-6">
          <Text as="h4" className="mb-3 text-md font-medium">Material Specifications</Text>
          <div className="text-right">
            <Text className="text-sm">Material Type: {materialData.materialType || "MCRS"}</Text>
            <Text className="text-sm">{materialData.maxYieldStrength || "40,000"} psi yield</Text>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Max. Material Thickness (in)"
              name="material.materialThickness"
              type="number"
              value={materialData.materialThickness || ""}
              onChange={handleChange}
            />
            <Input
              label="Coil Width (in)"
              name="material.coilWidth"
              type="number"
              value={materialData.coilWidth || ""}
              onChange={handleChange}
            />
            <Input
              label="Material Tensile (psi)"
              name="material.materialTensile"
              type="number"
              value={materialData.maxTensileStrength || ""}
              onChange={handleChange}
            />
          </div>
          <div className="mt-2">
            <Text className="text-sm text-gray-600">
              Shear Strength (psi) (70-80% of tensile): {calculatedValues.shearStrength.toFixed(0)}
            </Text>
          </div>
        </div>

        {/* Blade Specifications */}
        <div className="mb-6">
          <Text as="h4" className="mb-3 text-md font-medium">Blade Specifications</Text>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <Input
                label="Rake of blade per foot"
                name="shear.rakeOfBlade"
                type="number"
                value={shearData.blade?.rakeOfBladePerFoot || ""}
                onChange={handleChange}
              />
              <Input
                label="Distance blade travels past cut (overlap)"
                name="shear.overlap"
                type="number"
                value={shearData.blade?.overlap || ""}
                onChange={handleChange}
              />
              <Input
                label="Desired blade opening"
                name="shear.bladeOpening"
                type="number"
                value={shearData.blade?.bladeOpening || ""}
                onChange={handleChange}
              />
              <Input
                label="% of penetration (equal to elongation) (38% std)"
                name="shear.penetration"
                type="number"
                value={shearData.blade?.percentOfPenetration || "38"}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Text as="h4" className="text-sm font-medium">Calculated Variables</Text>
              <div className="p-3 rounded space-y-1">
                <Text className="text-sm">Angle of blade: {calculatedValues.angleOfBlade.toFixed(5)}</Text>
                <Text className="text-sm">Length of initial cut: {calculatedValues.lengthOfInitialCut.toFixed(5)}</Text>
                <Text className="text-sm">Area of cut: {calculatedValues.areaOfCut.toFixed(5)}</Text>
              </div>
            </div>
          </div>
        </div>

        {/* Cylinder Specifications */}
        <div className="mb-6">
          <Text as="h4" className="mb-3 text-md font-medium">Cylinder Specifications</Text>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <Input
                label="Bore Size"
                name="shear.boreSize"
                type="number"
                value={shearData.cylinder?.boreSize || ""}
                onChange={handleChange}
              />
              <Input
                label="Rod Dia."
                name="shear.rodDia"
                type="number"
                value={shearData.cylinder?.rodDiameter || ""}
                onChange={handleChange}
              />
              <Input
                label="Stroke"
                name="shear.stroke"
                type="number"
                value={shearData.cylinder?.stroke || ""}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <div className="p-3 rounded space-y-1">
                <Text className="text-sm">Minimum stroke for blade: {calculatedValues.minimumStrokeForBlade.toFixed(5)}</Text>
                <Text className="text-sm">Min.stroke required for desired opening: {calculatedValues.minStrokeForDesiredOpening.toFixed(5)}</Text>
                <Text className="text-sm">Actual opening above max. mat'l: {calculatedValues.actualOpeningAboveMaxMaterial.toFixed(5)}</Text>
              </div>
            </div>
          </div>
        </div>

        {/* Hydraulic Pressure */}
        <div className="mb-6">
          <Text as="h4" className="mb-3 text-md font-medium">Hydraulic Pressure (psi)</Text>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Pressure"
              name="shear.pressure"
              type="number"
              value={shearData.hydraulic?.pressure || ""}
              onChange={handleChange}
            />
            <div className="p-3 rounded space-y-1">
              <Text className="text-sm">Cylinder Area: {calculatedValues.cylinderArea.toFixed(5)}</Text>
              <Text className="text-sm">Cylinder Volume: {calculatedValues.cylinderVolume.toFixed(5)}</Text>
              <Text className="text-sm">Fluid Velocity (ft/sec): {calculatedValues.fluidVelocity.toFixed(5)}</Text>
            </div>
          </div>
        </div>

        {/* Time */}
        <div className="mb-6">
          <Text as="h4" className="mb-3 text-md font-medium">Time</Text>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Time in seconds for (1) downward stroke"
              name="shear.downwardStrokeTime"
              type="number"
              value={shearData.time?.forDownwardStroke || ""}
              onChange={handleChange}
            />
            <Input
              label="Dwell time for feed"
              name="shear.dwellTime"
              type="number"
              value={shearData.time?.dwellTime || ""}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-center">
          <Button onClick={handleCalculate} className="px-6 py-2">
            CALCULATE
          </Button>
        </div>
      </Card>

      {/* Conclusions */}
      <Card className="mb-0 p-4">
        <div className="flex justify-between items-start mb-4">
          <Text as="h3" className="text-lg font-medium">
            Conclusions
          </Text>
          {/* COE Logo placeholder - you can add actual logo here */}
          <div className="w-24 h-24 bg-gray-200 rounded flex items-center justify-center">
            <Text className="text-xs text-gray-500">COE Logo</Text>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Text className="font-medium">Force per cyl. (double rod, plumbed in series)</Text>
                <Text>{calculatedValues.forcePerCylinder.toFixed(2)}</Text>
              </div>
              <div className="flex justify-between">
                <Text className="font-medium">Total Force Applied (lbs)</Text>
                <Text>{calculatedValues.totalForceApplied.toFixed(2)}</Text>
              </div>
              <div className="flex justify-between">
                <Text className="font-medium">Force req'd to shear (lbs)</Text>
                <Text>{calculatedValues.forceReqToShear.toFixed(2)} {calculatedValues.forceReqToShear <= calculatedValues.totalForceApplied ? "OK" : ""}</Text>
              </div>
              <div className="flex justify-between">
                <Text className="font-medium">Total Force Applied (tons)</Text>
                <Text>{calculatedValues.totalForceAppliedTons.toFixed(2)}</Text>
              </div>
              <div className="flex justify-between">
                <Text className="font-medium">Safety Factor (Must be `&gt;` 1.00)</Text>
                <Text>{calculatedValues.safetyFactor > 0 ? calculatedValues.safetyFactor.toFixed(2) : "#DIV/0!"}</Text>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Text className="font-medium">Instantaneous Gallons per minute req'd</Text>
                <Text>{calculatedValues.instantaneousGPM.toFixed(2)}</Text>
              </div>
              <div className="flex justify-between">
                <Text className="font-medium">Averaged Gallons per minute req'd</Text>
                <Text>{calculatedValues.averagedGPM.toFixed(2)}</Text>
              </div>
              <div className="flex justify-between">
                <Text className="font-medium">Shear strokes per minute</Text>
                <Text>{calculatedValues.strokesPerMinute.toFixed(0)}</Text>
              </div>
              <div className="flex justify-between">
                <Text className="font-medium">Parts per minute</Text>
                <Text>{calculatedValues.partsPerMinute.toFixed(0)}</Text>
              </div>
              <div className="flex justify-between">
                <Text className="font-medium">Parts per hour</Text>
                <Text>{calculatedValues.partsPerHour.toFixed(0)}</Text>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Notes Section - Only show for bow-tie */}
      {shearType === "bow-tie" && (
        <Card className="mb-0 p-4">
          <Text as="h3" className="mb-4 text-lg font-medium">
            Notes
          </Text>
          <div className="space-y-4">
            <div>
              <Text as="h4" className="font-medium mb-2">Shear Design:</Text>
              <div className="space-y-1 text-sm">
                <Text>5" Bore x 2" Stroke, 2 1/2" diameter Double Rod</Text>
                <Text>Bowtie Blade configuration</Text>
                <Text>Spring operated material hold down pad (steel)</Text>
                <Text>.92 opening above .118 thk material</Text>
                <Text>Ref. Midway #33660 and John Deere #33865</Text>
              </div>
            </div>
            
            <div>
              <Text as="h4" className="font-medium mb-2">Hydraulic Design:</Text>
              <div className="space-y-1 text-sm">
                <Text>25 GPM, 75 gallon reservoir, minimum</Text>
                <Text>2,000 psi operating pressure</Text>
                <Text>2,800 psi maximum system pressure</Text>
                <Text>Heat Exchanger</Text>
                <Text>Cylinders plumbed in series</Text>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Shear;