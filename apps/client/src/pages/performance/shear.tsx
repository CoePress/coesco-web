import { useState, useEffect, useRef } from "react";
import Card from "@/components/common/card";
import Input from "@/components/common/input";
import Select from "@/components/common/select";
import Text from "@/components/common/text";
import Button from "@/components/common/button";
import { PerformanceData } from "@/contexts/performance.context";
import { useUpdateEntity } from "@/hooks/_base/use-update-entity";
import { useParams } from "react-router-dom";
import { useGetEntity } from "@/hooks/_base/use-get-entity";

const SHEAR_TYPE_OPTIONS = [
  { value: "single-rake", label: "Single Rake" },
  { value: "bow-tie", label: "Bow Tie" },
];

export interface ShearProps {
  data: PerformanceData;
  isEditing: boolean;
}

const Shear: React.FC<ShearProps> = ({ data, isEditing }) => {
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
  
  // Determine shear type based on current data or default
  const getShearType = () => {
    return localData.shear?.model || "single-rake";
  };

  const [shearType, setShearType] = useState<string>(getShearType());

  useEffect(() => {
    setShearType(getShearType());
  }, [localData.shear?.model]);

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
          referenceNumber: { path: "referenceNumber", value: value },
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
            referenceNumber: { path: "referenceNumber", value: value },
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
        if (response && response.data && response.data.shear) {
          console.log("Updating calculated shear values from backend response");
          
          setLocalData(prevData => ({
            ...prevData,
            shear: {
              ...prevData.shear,
              // Update calculated fields from response
              calculations: {
                ...prevData.shear,
                angleOfBlade: response.data.shear.calculations?.angleOfBlade || prevData.shear?.blade?.angleOfBlade,
                lengthOfInitialCut: response.data.shear.calculations?.lengthOfInitialCut || prevData.shear?.blade?.initialCut?.length,
                areaOfCut: response.data.shear.calculations?.areaOfCut || prevData.shear?.blade?.initialCut?.area,
                shearStrength: response.data.shear.calculations?.shearStrength || prevData.shear?.strength,
                minimumStrokeForBlade: response.data.shear.calculations?.minimumStrokeForBlade || prevData.shear?.cylinder?.minStroke?.forBlade,
                minStrokeForDesiredOpening: response.data.shear.calculations?.minStrokeForDesiredOpening || prevData.shear?.cylinder?.minStroke?.requiredForOpening,
                actualOpeningAboveMaxMaterial: response.data.shear.calculations?.actualOpeningAboveMaxMaterial || prevData.shear?.cylinder?.actualOpeningAboveMaxMaterial,
                cylinderArea: response.data.shear.calculations?.cylinderArea || prevData.shear?.hydraulic?.cylinder?.area,
                cylinderVolume: response.data.shear.calculations?.cylinderVolume || prevData.shear?.hydraulic?.cylinder?.volume,
                fluidVelocity: response.data.shear.calculations?.fluidVelocity || prevData.shear?.hydraulic?.fluidVelocity,
                forcePerCylinder: response.data.shear.calculations?.forcePerCylinder || prevData.shear?.conclusions?.force?.perCylinder,
                totalForceApplied: response.data.shear.calculations?.totalForceApplied || prevData.shear?.conclusions?.force?.totalApplied,
                forceReqToShear: response.data.shear.calculations?.forceReqToShear || prevData.shear?.conclusions?.force?.requiredToShear,
                totalForceAppliedTons: response.data.shear.calculations?.totalForceAppliedTons || prevData.shear?.conclusions?.force?.totalApplied?.tons,
                safetyFactor: response.data.shear.calculations?.safetyFactor || prevData.shear?.conclusions?.safetyFactor,
                strokesPerMinute: response.data.shear.calculations?.strokesPerMinute || prevData.shear?.conclusions?.perMinute?.shearStrokes,
                instantaneousGPM: response.data.shear.calculations?.instantaneousGPM || prevData.shear?.conclusions?.perMinute?.gallons?.instantaneous,
                averagedGPM: response.data.shear.calculations?.averagedGPM || prevData.shear?.conclusions?.perMinute?.gallons?.averaged,
                partsPerMinute: response.data.shear.calculations?.partsPerMinute || prevData.shear?.conclusions?.perMinute?.parts,
                partsPerHour: response.data.shear.calculations?.partsPerHour || prevData.shear?.conclusions?.perHour?.parts,
              }
            }
          }));
          
          console.log("Updated calculated shear values:", {
            angleOfBlade: response.data.shear.calculations?.angleOfBlade,
            lengthOfInitialCut: response.data.shear.calculations?.lengthOfInitialCut,
            areaOfCut: response.data.shear.calculations?.areaOfCut,
            safetyFactor: response.data.shear.calculations?.safetyFactor,
            strokesPerMinute: response.data.shear.calculations?.strokesPerMinute,
          });
        }

      } catch (error) {
        console.error('Error updating field:', error);
        setLocalData(data);
      }
    }, 500);
  };

  const handleShearTypeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    setShearType(newType);
    
    if (!isEditing) return;
    
    // Update local state immediately
    setLocalData(prevData => {
      const updatedData = JSON.parse(JSON.stringify(prevData));
      
      if (!updatedData.shear) updatedData.shear = {};
      updatedData.shear.model = newType;

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
        console.log("Shear type updated:", response);
      } catch (error) {
        console.error('Error updating shear type:', error);
      }
    }, 500);
  };

  const handleCalculate = async () => {
    if (!isEditing) return;
    
    console.log("Calculate pressed for", shearType, "shear configuration");
    
    try {
      if (!performanceSheetId) {
        throw new Error("Performance Sheet ID is missing.");
      }

      // Trigger shear calculation on the backend
      const response = await updateEntity(performanceSheetId, { 
        data: localData,
        triggerShearCalculation: true 
      });
      
      console.log("Shear calculation triggered:", response);
      
      // The response should contain updated shear calculations
      if (response && response.data && response.data.shear?.calculations) {
        setLocalData(prevData => ({
          ...prevData,
          shear: {
            ...prevData.shear,
            calculations: response.data.shear.calculations
          }
        }));
      }
    } catch (error) {
      console.error('Error triggering shear calculation:', error);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Get shear data from localData
  const shearData = localData.shear || {};
  const materialData = localData.material || {};

  // Calculate derived values from local data
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

    // Use calculated values from backend if available, otherwise calculate locally
    const conclusions = shearData.conclusions || {};
    
    // If we have backend calculations, use them; otherwise calculate locally for display
    if (conclusions !== undefined) {
      // Use backend calculated values
      return {
        angleOfBlade: shearData.blade?.angleOfBlade,
        lengthOfInitialCut: shearData?.blade?.initialCut?.length,
        areaOfCut: shearData?.blade?.initialCut?.area,
        shearStrength: shearData?.strength,
        minimumStrokeForBlade: shearData?.cylinder?.minStroke?.forBlade,
        minStrokeForDesiredOpening: shearData?.cylinder?.minStroke?.requiredForOpening,
        actualOpeningAboveMaxMaterial: shearData?.cylinder?.actualOpeningAboveMaxMaterial,
        cylinderArea: shearData?.hydraulic?.cylinder?.area,
        cylinderVolume: shearData?.hydraulic?.cylinder?.volume,
        fluidVelocity: shearData?.hydraulic?.fluidVelocity,
        forcePerCylinder: shearData?.conclusions?.force?.perCylinder,
        totalForceApplied: shearData?.conclusions?.force?.totalApplied,
        forceReqToShear: shearData?.conclusions?.force?.requiredToShear,
        totalForceAppliedTons: shearData?.conclusions?.force?.totalApplied?.tons,
        safetyFactor: shearData?.conclusions?.safetyFactor,
        strokesPerMinute: shearData?.conclusions?.perMinute?.shearStrokes,
        instantaneousGPM: shearData?.conclusions?.perMinute?.gallons?.instantaneous,
        averagedGPM: shearData?.conclusions?.perMinute?.gallons?.averaged,
        partsPerMinute: shearData?.conclusions?.perMinute?.parts,
        partsPerHour: shearData?.conclusions?.perHour?.parts,
      };
    }

    // Local calculations for immediate feedback
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

      {/* Header Information */}
      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Shear Design - {shearType === "single-rake" ? "Single Rake" : "Bow Tie"}
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
              name="material.maxTensileStrength"
              type="number"
              value={materialData.maxTensileStrength || ""}
              onChange={handleChange}
            />
          </div>
          <div className="mt-2">
            <Text className="text-sm text-gray-600">
              Shear Strength (psi) (70-80% of tensile): {(calculatedValues.shearStrength ?? 0).toFixed(0)}
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
                name="shear.blade.rakeOfBladePerFoot"
                type="number"
                value={shearData.blade?.rakeOfBladePerFoot || ""}
                onChange={handleChange}
              />
              <Input
                label="Distance blade travels past cut (overlap)"
                name="shear.blade.overlap"
                type="number"
                value={shearData.blade?.overlap || ""}
                onChange={handleChange}
              />
              <Input
                label="Desired blade opening"
                name="shear.blade.bladeOpening"
                type="number"
                value={shearData.blade?.bladeOpening || ""}
                onChange={handleChange}
              />
              <Input
                label="% of penetration (equal to elongation) (38% std)"
                name="shear.blade.percentOfPenetration"
                type="number"
                value={shearData.blade?.percentOfPenetration || "38"}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Text as="h4" className="text-sm font-medium">Calculated Variables</Text>
              <div className="p-3 bg-gray-50 rounded space-y-1">
                <Text className="text-sm">Angle of blade: {(calculatedValues.angleOfBlade ?? 0).toFixed(5)}</Text>
                <Text className="text-sm">Length of initial cut: {(calculatedValues.lengthOfInitialCut ?? 0).toFixed(5)}</Text>
                <Text className="text-sm">Area of cut: {(calculatedValues.areaOfCut ?? 0).toFixed(5)}</Text>
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
                name="shear.cylinder.boreSize"
                type="number"
                value={shearData.cylinder?.boreSize || ""}
                onChange={handleChange}
              />
              <Input
                label="Rod Dia."
                name="shear.cylinder.rodDiameter"
                type="number"
                value={shearData.cylinder?.rodDiameter || ""}
                onChange={handleChange}
              />
              <Input
                label="Stroke"
                name="shear.cylinder.stroke"
                type="number"
                value={shearData.cylinder?.stroke || ""}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <div className="p-3 bg-gray-50 rounded space-y-1">
                <Text className="text-sm">Minimum stroke for blade: {(calculatedValues.minimumStrokeForBlade ?? 0).toFixed(5)}</Text>
                <Text className="text-sm">Min.stroke required for desired opening: {(calculatedValues.minStrokeForDesiredOpening ?? 0).toFixed(5)}</Text>
                <Text className="text-sm">Actual opening above max. mat'l: {(calculatedValues.actualOpeningAboveMaxMaterial ?? 0).toFixed(5)}</Text>
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
              name="shear.hydraulic.pressure"
              type="number"
              value={shearData.hydraulic?.pressure || ""}
              onChange={handleChange}
            />
            <div className="p-3 bg-gray-50 rounded space-y-1">
              <Text className="text-sm">Cylinder Area: {(calculatedValues.cylinderArea ?? 0).toFixed(5)}</Text>
              <Text className="text-sm">Cylinder Volume: {(calculatedValues.cylinderVolume ?? 0).toFixed(5)}</Text>
              <Text className="text-sm">Fluid Velocity (ft/sec): {(calculatedValues.fluidVelocity ?? 0).toFixed(5)}</Text>
            </div>
          </div>
        </div>

        {/* Time */}
        <div className="mb-6">
          <Text as="h4" className="mb-3 text-md font-medium">Time</Text>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Time in seconds for (1) downward stroke"
              name="shear.time.forDownwardStroke"
              type="number"
              value={shearData.time?.forDownwardStroke || ""}
              onChange={handleChange}
            />
            <Input
              label="Dwell time for feed"
              name="shear.time.dwellTime"
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
                <Text>{(calculatedValues.forcePerCylinder ?? 0).toFixed(2)}</Text>
              </div>
              <div className="flex justify-between">
                <Text className="font-medium">Total Force Applied (lbs)</Text>
                <Text>{
                  typeof calculatedValues.totalForceApplied === "number"
                    ? calculatedValues.totalForceApplied.toFixed(2)
                    : (calculatedValues.totalForceApplied?.lbs ?? 0).toFixed(2)
                }</Text>
              </div>
              <div className="flex justify-between">
                <Text className="font-medium">Force req'd to shear (lbs)</Text>
                <Text className={
                  typeof calculatedValues.forceReqToShear === "number" &&
                  (
                    typeof calculatedValues.totalForceApplied === "number"
                      ? calculatedValues.forceReqToShear <= calculatedValues.totalForceApplied
                      : typeof calculatedValues.totalForceApplied?.lbs === "number"
                        ? calculatedValues.forceReqToShear <= calculatedValues.totalForceApplied.lbs
                        : false
                  )
                    ? "text-green-600 font-semibold"
                    : "text-red-600 font-semibold"
                }>
                  {typeof calculatedValues.forceReqToShear === "number"
                    ? calculatedValues.forceReqToShear.toFixed(2)
                    : "#DIV/0!"}
                  {" "}
                  {typeof calculatedValues.forceReqToShear === "number" &&
                  (
                    typeof calculatedValues.totalForceApplied === "number"
                      ? calculatedValues.forceReqToShear <= calculatedValues.totalForceApplied
                      : typeof calculatedValues.totalForceApplied?.lbs === "number"
                        ? calculatedValues.forceReqToShear <= calculatedValues.totalForceApplied.lbs
                        : false
                  )
                    ? "OK"
                    : "NOT OK"}
                </Text>
              </div>
              <div className="flex justify-between">
                <Text className="font-medium">Total Force Applied (tons)</Text>
                <Text>{(calculatedValues.totalForceAppliedTons ?? 0).toFixed(2)}</Text>
              </div>
              <div className="flex justify-between">
                <Text className="font-medium">Safety Factor (Must be {'>'} 1.00)</Text>
                <Text className={(calculatedValues.safetyFactor ?? 0) > 1 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                  {(calculatedValues.safetyFactor ?? 0) > 0 ? (calculatedValues.safetyFactor ?? 0).toFixed(2) : "#DIV/0!"}
                </Text>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Text className="font-medium">Instantaneous Gallons per minute req'd</Text>
                <Text>{(calculatedValues.instantaneousGPM ?? 0).toFixed(2)}</Text>
              </div>
              <div className="flex justify-between">
                <Text className="font-medium">Averaged Gallons per minute req'd</Text>
                <Text>{(calculatedValues.averagedGPM ?? 0).toFixed(2)}</Text>
              </div>
              <div className="flex justify-between">
                <Text className="font-medium">Shear strokes per minute</Text>
                <Text>{(calculatedValues.strokesPerMinute ?? 0).toFixed(0)}</Text>
              </div>
              <div className="flex justify-between">
                <Text className="font-medium">Parts per minute</Text>
                <Text>{(calculatedValues.partsPerMinute ?? 0).toFixed(0)}</Text>
              </div>
              <div className="flex justify-between">
                <Text className="font-medium">Parts per hour</Text>
                <Text>{(calculatedValues.partsPerHour ?? 0).toFixed(0)}</Text>
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