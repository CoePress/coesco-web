import { useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { PerformanceData } from "@/contexts/performance.context";
import { usePerformanceDataService } from "@/utils/performance-sheet";
import { Button, Card, Input, Select, Text } from "@/components";

const SHEAR_TYPE_OPTIONS = [
  { value: "single-rake", label: "Single Rake" },
  { value: "bow-tie", label: "Bow Tie" },
];

export interface ShearProps {
  data: PerformanceData;
  isEditing: boolean;
}

const Shear: React.FC<ShearProps> = ({ data, isEditing }) => {
  const { id: performanceSheetId } = useParams();
  
  const dataService = usePerformanceDataService(data, performanceSheetId, isEditing);
  const { state, handleFieldChange, updateField, saveImmediately } = dataService;
  const { localData, fieldErrors, isDirty, lastSaved, isLoading, error } = state;

  const shearType = useMemo(() => {
    return localData.shear?.shear?.model || "single-rake";
  }, [localData.shear?.shear?.model]);

  const handleShearTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    
    if (!isEditing) return;
    
    updateField("shear.shear.model", newType);
  }, [isEditing, updateField]);

  const handleCalculate = useCallback(async () => {
    if (!isEditing || !performanceSheetId) return;
    
    console.log("Calculate pressed for", shearType, "shear configuration");
    
    try {
      const response = await saveImmediately();
      console.log("Shear calculation triggered:", response);
    } catch (error) {
      console.error('Error triggering shear calculation:', error);
    }
  }, [isEditing, performanceSheetId, saveImmediately, shearType]);

  const calculatedValues = useMemo(() => {
    const materialData = localData.common?.material || {};
    const shearData = localData.shear || {};

    const materialThickness = Number(materialData.materialThickness) || 0;
    const coilWidth = Number(materialData.coilWidth) || 0;
    const materialTensile = Number(materialData.maxTensileStrength) || 0;
    const rakeOfBlade = Number(shearData.shear?.blade?.rakeOfBladePerFoot) || 0;
    const overlap = Number(shearData.shear?.blade?.overlap) || 0;
    const bladeOpening = Number(shearData.shear?.blade?.bladeOpening) || 0;
    const penetration = Number(shearData.shear?.blade?.percentOfPenetration) || 38;
    const boreSize = Number(shearData.shear?.cylinder?.boreSize) || 0;
    const rodDia = Number(shearData.shear?.cylinder?.rodDiameter) || 0;
    const stroke = Number(shearData.shear?.cylinder?.stroke) || 0;
    const pressure = Number(shearData.shear?.hydraulic?.pressure) || 0;
    const downwardStrokeTime = Number(shearData.shear?.time?.forDownwardStroke) || 0;
    const dwellTime = Number(shearData.shear?.time?.dwellTime) || 0;

    if (shearData.shear?.conclusions?.force?.perCylinder !== undefined) {
      return {
        angleOfBlade: shearData.shear?.blade?.angleOfBlade || 0,
        lengthOfInitialCut: shearData.shear?.blade?.initialCut?.length || 0,
        areaOfCut: shearData.shear?.blade?.initialCut?.area || 0,
        shearStrength: shearData.shear?.strength || 0,
        minimumStrokeForBlade: shearData.shear?.cylinder?.minStroke?.forBlade || 0,
        minStrokeForDesiredOpening: shearData.shear?.cylinder?.minStroke?.requiredForOpening || 0,
        actualOpeningAboveMaxMaterial: shearData.shear?.cylinder?.actualOpeningAboveMaxMaterial || 0,
        cylinderArea: shearData.shear?.hydraulic?.cylinder?.area || 0,
        cylinderVolume: shearData.shear?.hydraulic?.cylinder?.volume || 0,
        fluidVelocity: shearData.shear?.hydraulic?.fluidVelocity || 0,
        forcePerCylinder: shearData.shear?.conclusions?.force?.perCylinder || 0,
        totalForceApplied: shearData.shear?.conclusions?.force?.totalApplied?.lbs || 0,
        forceReqToShear: shearData.shear?.conclusions?.force?.requiredToShear || 0,
        totalForceAppliedTons: shearData.shear?.conclusions?.force?.totalApplied?.tons || 0,
        safetyFactor: shearData.shear?.conclusions?.safetyFactor || 0,
        strokesPerMinute: shearData.shear?.conclusions?.perMinute?.shearStrokes || 0,
        instantaneousGPM: shearData.shear?.conclusions?.perMinute?.gallons?.instantaneous || 0,
        averagedGPM: shearData.shear?.conclusions?.perMinute?.gallons?.averaged || 0,
        partsPerMinute: shearData.shear?.conclusions?.perMinute?.parts || 0,
        partsPerHour: shearData.shear?.conclusions?.perHour?.parts || 0,
      };
    }

    const angleOfBlade = rakeOfBlade * 12; // Convert to display value
    const lengthOfInitialCut = coilWidth / Math.cos(rakeOfBlade * Math.PI / 180);
    const areaOfCut = materialThickness * lengthOfInitialCut;
    const shearStrength = materialTensile * 0.75; // 75% of tensile
    
    const minimumStrokeForBlade = materialThickness * (penetration / 100) + overlap;
    const minStrokeForDesiredOpening = minimumStrokeForBlade + bladeOpening;
    const actualOpeningAboveMaxMaterial = stroke - minimumStrokeForBlade;
    
    const cylinderArea = Math.PI * Math.pow(boreSize / 2, 2) - Math.PI * Math.pow(rodDia / 2, 2);
    const cylinderVolume = cylinderArea * stroke;
    const fluidVelocity = downwardStrokeTime > 0 ? stroke / (downwardStrokeTime * 12) : 0;
    
    const forcePerCylinder = cylinderArea * pressure;
    const totalForceApplied = forcePerCylinder * 2;
    const forceReqToShear = areaOfCut * shearStrength;
    const totalForceAppliedTons = totalForceApplied / 2000;
    const safetyFactor = forceReqToShear > 0 ? totalForceApplied / forceReqToShear : 0;
    
    const cycleTime = downwardStrokeTime + dwellTime + downwardStrokeTime;
    const strokesPerMinute = cycleTime > 0 ? 60 / cycleTime : 0;
    const instantaneousGPM = downwardStrokeTime > 0 ? (cylinderVolume * 2) / 231 * (60 / downwardStrokeTime) : 0;
    const averagedGPM = cycleTime > 0 ? instantaneousGPM * (downwardStrokeTime / cycleTime) : 0;
    const partsPerMinute = strokesPerMinute;
    const partsPerHour = partsPerMinute * 60;

    return {
      angleOfBlade,
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
  }, [localData.common?.material, localData.shear]);

  const headerSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Shear Design - {shearType === "single-rake" ? "Single Rake" : "Bow Tie"}
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Customer"
          name="common.customer"
          value={localData.common?.customer || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Date"
          name="rfq.dates.date"
          type="date"
          value={localData.rfq?.dates?.date || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Select
          label="Shear Type"
          name="shear.shear.model"
          value={shearType}
          onChange={handleShearTypeChange}
          options={SHEAR_TYPE_OPTIONS}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData, shearType, handleFieldChange, handleShearTypeChange, isEditing]);

  const materialSpecsSection = useMemo(() => (
    <div className="mb-6">
      <Text as="h4" className="mb-3 text-md font-medium">Material Specifications</Text>
      <div className="text-right mb-2">
        <Text className="text-sm">Material Type: {localData.common?.material?.materialType || "MCRS"}</Text>
        <Text className="text-sm">{localData.common?.material?.maxYieldStrength || "40,000"} psi yield</Text>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Max. Material Thickness (in)"
          name="common.material.materialThickness"
          type="number"
          value={localData.common?.material?.materialThickness?.toString() || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Coil Width (in)"
          name="common.material.coilWidth"
          type="number"
          value={localData.common?.material?.coilWidth?.toString() || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Material Tensile (psi)"
          name="common.material.maxTensileStrength"
          type="number"
          value={localData.common?.material?.maxTensileStrength?.toString() || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
      </div>
      <div className="mt-2">
        <Text className="text-sm text-gray-600">
          Shear Strength (psi) (70-80% of tensile): {calculatedValues.shearStrength.toFixed(0)}
        </Text>
      </div>
    </div>
  ), [localData, calculatedValues, handleFieldChange, isEditing]);

  const bladeSpecsSection = useMemo(() => (
    <div className="mb-6">
      <Text as="h4" className="mb-3 text-md font-medium">Blade Specifications</Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <Input
            label="Rake of blade per foot"
            name="shear.shear.blade.rakeOfBladePerFoot"
            type="number"
            value={localData.shear?.shear?.blade?.rakeOfBladePerFoot?.toString() || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
          <Input
            label="Distance blade travels past cut (overlap)"
            name="shear.shear.blade.overlap"
            type="number"
            value={localData.shear?.shear?.blade?.overlap?.toString() || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
          <Input
            label="Desired blade opening"
            name="shear.shear.blade.bladeOpening"
            type="number"
            value={localData.shear?.shear?.blade?.bladeOpening?.toString() || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
          <Input
            label="% of penetration (equal to elongation) (38% std)"
            name="shear.shear.blade.percentOfPenetration"
            type="number"
            value={localData.shear?.shear?.blade?.percentOfPenetration?.toString() || "38"}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
        </div>
        <div className="space-y-2">
          <Text as="h4" className="text-sm font-medium">Calculated Variables</Text>
          <div className="p-3 bg-gray-50 rounded space-y-1">
            <Text className="text-sm">Angle of blade: {calculatedValues.angleOfBlade.toFixed(5)}</Text>
            <Text className="text-sm">Length of initial cut: {calculatedValues.lengthOfInitialCut.toFixed(5)}</Text>
            <Text className="text-sm">Area of cut: {calculatedValues.areaOfCut.toFixed(5)}</Text>
          </div>
        </div>
      </div>
    </div>
  ), [localData, calculatedValues, handleFieldChange, isEditing]);

  const cylinderSpecsSection = useMemo(() => (
    <div className="mb-6">
      <Text as="h4" className="mb-3 text-md font-medium">Cylinder Specifications</Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <Input
            label="Bore Size"
            name="shear.shear.cylinder.boreSize"
            type="number"
            value={localData.shear?.shear?.cylinder?.boreSize?.toString() || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
          <Input
            label="Rod Dia."
            name="shear.shear.cylinder.rodDiameter"
            type="number"
            value={localData.shear?.shear?.cylinder?.rodDiameter?.toString() || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
          <Input
            label="Stroke"
            name="shear.shear.cylinder.stroke"
            type="number"
            value={localData.shear?.shear?.cylinder?.stroke?.toString() || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
        </div>
        <div className="space-y-2">
          <div className="p-3 bg-gray-50 rounded space-y-1">
            <Text className="text-sm">Minimum stroke for blade: {calculatedValues.minimumStrokeForBlade.toFixed(5)}</Text>
            <Text className="text-sm">Min.stroke required for desired opening: {calculatedValues.minStrokeForDesiredOpening.toFixed(5)}</Text>
            <Text className="text-sm">Actual opening above max. mat'l: {calculatedValues.actualOpeningAboveMaxMaterial.toFixed(5)}</Text>
          </div>
        </div>
      </div>
    </div>
  ), [localData, calculatedValues, handleFieldChange, isEditing]);

  const hydraulicSection = useMemo(() => (
    <div className="mb-6">
      <Text as="h4" className="mb-3 text-md font-medium">Hydraulic Pressure (psi)</Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Pressure"
          name="shear.shear.hydraulic.pressure"
          type="number"
          value={localData.shear?.shear?.hydraulic?.pressure?.toString() || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <div className="p-3 bg-gray-50 rounded space-y-1">
          <Text className="text-sm">Cylinder Area: {calculatedValues.cylinderArea.toFixed(5)}</Text>
          <Text className="text-sm">Cylinder Volume: {calculatedValues.cylinderVolume.toFixed(5)}</Text>
          <Text className="text-sm">Fluid Velocity (ft/sec): {calculatedValues.fluidVelocity.toFixed(5)}</Text>
        </div>
      </div>
    </div>
  ), [localData, calculatedValues, handleFieldChange, isEditing]);

  const timeSection = useMemo(() => (
    <div className="mb-6">
      <Text as="h4" className="mb-3 text-md font-medium">Time</Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Time in seconds for (1) downward stroke"
          name="shear.shear.time.forDownwardStroke"
          type="number"
          value={localData.shear?.shear?.time?.forDownwardStroke?.toString() || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Dwell time for feed"
          name="shear.shear.time.dwellTime"
          type="number"
          value={localData.shear?.shear?.time?.dwellTime?.toString() || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
      </div>
    </div>
  ), [localData, handleFieldChange, isEditing]);

  const userDefinedSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">User Defined Variables</Text>
      {materialSpecsSection}
      {bladeSpecsSection}
      {cylinderSpecsSection}
      {hydraulicSection}
      {timeSection}
      
      <div className="mt-4 flex justify-center">
        <Button 
          onClick={handleCalculate} 
          className="px-6 py-2"
          disabled={!isEditing || isLoading}
        >
          {isLoading ? "CALCULATING..." : "CALCULATE"}
        </Button>
      </div>
    </Card>
  ), [materialSpecsSection, bladeSpecsSection, cylinderSpecsSection, hydraulicSection, timeSection, handleCalculate, isEditing, isLoading]);

  const conclusionsSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <div className="flex justify-between items-start mb-4">
        <Text as="h3" className="text-lg font-medium">
          Conclusions
        </Text>
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
              <Text className={
                calculatedValues.forceReqToShear <= calculatedValues.totalForceApplied
                  ? "text-green-600 font-semibold"
                  : "text-red-600 font-semibold"
              }>
                {calculatedValues.forceReqToShear > 0 ? calculatedValues.forceReqToShear.toFixed(2) : "#DIV/0!"}
                {" "}
                {calculatedValues.forceReqToShear <= calculatedValues.totalForceApplied ? "OK" : "NOT OK"}
              </Text>
            </div>
            <div className="flex justify-between">
              <Text className="font-medium">Total Force Applied (tons)</Text>
              <Text>{calculatedValues.totalForceAppliedTons.toFixed(2)}</Text>
            </div>
            <div className="flex justify-between">
              <Text className="font-medium">Safety Factor (Must be {'>'} 1.00)</Text>
              <Text className={calculatedValues.safetyFactor > 1 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                {calculatedValues.safetyFactor > 0 ? calculatedValues.safetyFactor.toFixed(2) : "#DIV/0!"}
              </Text>
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
  ), [calculatedValues]);

  const notesSection = useMemo(() => {
    if (shearType !== "bow-tie") return null;
    
    return (
      <Card className="mb-4 p-4">
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
    );
  }, [shearType]);

  const StatusIndicator = () => {
    if (isLoading) {
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
      <div className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
        <StatusIndicator />
        {fieldErrors._general && (
          <div className="text-sm text-red-600">{fieldErrors._general}</div>
        )}
      </div>

      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-blue-800">
              Saving changes and calculating...
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <span className="text-red-800">
            Error: {error}
          </span>
        </div>
      )}

      {headerSection}
      {userDefinedSection}
      {conclusionsSection}
      {notesSection}
    </div>
  );
};

export default Shear