import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { debounce } from "lodash";
import Card from "@/components/common/card";
import Input from "@/components/common/input";
import Select from "@/components/common/select";
import Text from "@/components/common/text";
import Button from "@/components/common/button";
import { PerformanceData } from "@/contexts/performance.context";
import { useUpdateEntity } from "@/hooks/_base/use-update-entity";
import { useGetEntity } from "@/hooks/_base/use-get-entity";

const SHEAR_TYPE_OPTIONS = [
  { value: "single-rake", label: "Single Rake" },
  { value: "bow-tie", label: "Bow Tie" },
];

export interface ShearProps {
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

const Shear: React.FC<ShearProps> = ({ data, isEditing }) => {
  const endpoint = `/performance/sheets`;
  const { loading, error } = useGetEntity(endpoint);
  const { updateEntity, loading: updateLoading, error: updateError } = useUpdateEntity(endpoint);
  const { id: performanceSheetId } = useParams();
  
  // Local state management
  const [localData, setLocalData] = useState<PerformanceData>(data);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Refs for cleanup and debouncing
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingChangesRef = useRef<Record<string, any>>({});

  // Sync with prop data on initial load only
  useEffect(() => {
    if (data && data.referenceNumber && !localData.referenceNumber) {
      setLocalData(data);
    }
  }, [data, localData.referenceNumber]);

  // Determine shear type based on current data
  const shearType = useMemo(() => {
    return localData.shear?.shear?.model || "single-rake";
  }, [localData.shear?.shear?.model]);

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async (changes: Record<string, any>) => {
      if (!performanceSheetId || !isEditing) return;

      try {
        // Create a deep copy and apply all pending changes
        const updatedData = JSON.parse(JSON.stringify(localData));
        
        Object.entries(changes).forEach(([path, value]) => {
          // Handle legacy field mappings
          if (path === "customer") {
            setNestedValue(updatedData, "rfq.customer", value);
          } else if (path === "date") {
            setNestedValue(updatedData, "rfq.dates.date", value);
          } else {
            setNestedValue(updatedData, path, value);
          }
        });

        console.log("Saving Shear changes:", changes);
        
        const response = await updateEntity(performanceSheetId, { data: updatedData });
        
        // Handle calculated values from backend
        if (response?.data?.shear) {
          console.log("Updating calculated shear values from backend response");
          
          setLocalData(prevData => ({
            ...prevData,
            shear: {
              ...prevData.shear,
              // Update calculated blade fields
              blade: {
                ...prevData.shear?.shear?.blade,
                angleOfBlade: response.data.shear.angle_of_blade || prevData.shear?.shear?.blade?.angleOfBlade,
                initialCut: {
                  ...prevData.shear?.shear?.blade?.initialCut,
                  length: response.data.shear.length_of_init_cut || prevData.shear?.shear?.blade?.initialCut?.length,
                  area: response.data.shear.area_of_cut || prevData.shear?.shear?.blade?.initialCut?.area,
                }
              },
              // Update shear strength
              strength: response.data.shear.shear_strength || prevData.shear?.shear?.strength,
              // Update cylinder calculations
              cylinder: {
                ...prevData.shear?.shear?.cylinder,
                minStroke: {
                  ...prevData.shear?.shear?.cylinder?.minStroke,
                  forBlade: response.data.shear.min_stroke_for_blade || prevData.shear?.shear?.cylinder?.minStroke?.forBlade,
                  requiredForOpening: response.data.shear.min_stroke_req_for_opening || prevData.shear?.shear?.cylinder?.minStroke?.requiredForOpening,
                },
                actualOpeningAboveMaxMaterial: response.data.shear.actual_opening_above_max_material || prevData.shear?.shear?.cylinder?.actualOpeningAboveMaxMaterial,
              },
              // Update hydraulic calculations
              hydraulic: {
                ...prevData.shear?.shear?.hydraulic,
                cylinder: {
                  ...prevData.shear?.shear?.hydraulic?.cylinder,
                  area: response.data.shear.cylinder_area || prevData.shear?.shear?.hydraulic?.cylinder?.area,
                  volume: response.data.shear.cylinder_volume || prevData.shear?.shear?.hydraulic?.cylinder?.volume,
                },
                fluidVelocity: response.data.shear.fluid_velocity || prevData.shear?.shear?.hydraulic?.fluidVelocity,
              },
              // Update conclusions
              conclusions: {
                ...prevData.shear?.shear?.conclusions,
                force: {
                  ...prevData.shear?.shear?.conclusions?.force,
                  perCylinder: response.data.shear.force_per_cylinder || prevData.shear?.shear?.conclusions?.force?.perCylinder,
                  totalApplied: {
                    lbs: response.data.shear.total_force_applied_lbs || prevData.shear?.shear?.conclusions?.force?.totalApplied?.lbs,
                    tons: response.data.shear.total_force_applied_tons || prevData.shear?.shear?.conclusions?.force?.totalApplied?.tons,
                  },
                  requiredToShear: response.data.shear.force_req_to_shear || prevData.shear?.shear?.conclusions?.force?.requiredToShear,
                },
                safetyFactor: response.data.shear.safety_factor || prevData.shear?.shear?.conclusions?.safetyFactor,
                perMinute: {
                  ...prevData.shear?.shear?.conclusions?.perMinute,
                  shearStrokes: response.data.shear.shear_strokes_per_minute || prevData.shear?.shear?.conclusions?.perMinute?.shearStrokes,
                  parts: response.data.shear.parts_per_minute || prevData.shear?.shear?.conclusions?.perMinute?.parts,
                  gallons: {
                    ...prevData.shear?.shear?.conclusions?.perMinute?.gallons,
                    instantaneous: response.data.shear.instant_gallons_per_minute_req || prevData.shear?.shear?.conclusions?.perMinute?.gallons?.instantaneous,
                    averaged: response.data.shear.averaged_gallons_per_minute_req || prevData.shear?.shear?.conclusions?.perMinute?.gallons?.averaged,
                  }
                },
                perHour: {
                  ...prevData.shear?.shear?.conclusions?.perHour,
                  parts: response.data.shear.parts_per_hour || prevData.shear?.shear?.conclusions?.perHour?.parts,
                }
              }
            }
          }));
        }

        setLastSaved(new Date());
        setIsDirty(false);
        pendingChangesRef.current = {};
        
      } catch (error) {
        console.error('Error saving Shear:', error);
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

  // Handle shear type change
  const handleShearTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    
    if (!isEditing) return;
    
    // Update local state immediately
    setLocalData(prevData => {
      const newData = { ...prevData };
      setNestedValue(newData, "shear.model", newType);
      return newData;
    });

    // Track pending change
    pendingChangesRef.current["shear.model"] = newType;
    setIsDirty(true);

    // Debounce save
    debouncedSave(pendingChangesRef.current);
  }, [isEditing, debouncedSave]);

  // Calculate function
  const handleCalculate = useCallback(async () => {
    if (!isEditing || !performanceSheetId) return;
    
    setIsCalculating(true);
    console.log("Calculate pressed for", shearType, "shear configuration");
    
    try {
      // Trigger shear calculation on the backend
      const response = await updateEntity(performanceSheetId, { 
        data: localData,
        triggerShearCalculation: true 
      });
      
      console.log("Shear calculation triggered:", response);
      
      // The response should contain updated shear calculations
      if (response?.data?.shear) {
        setLocalData(prevData => ({
          ...prevData,
          shear: {
            ...prevData.shear,
            ...response.data.shear
          }
        }));
      }
    } catch (error) {
      console.error('Error triggering shear calculation:', error);
      setFieldErrors(prev => ({ 
        ...prev, 
        _general: 'Failed to calculate shear. Please try again.' 
      }));
    } finally {
      setIsCalculating(false);
    }
  }, [isEditing, performanceSheetId, updateEntity, localData, shearType]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  // Calculate derived values from local data (for immediate feedback)
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

    // Use backend calculated values if available, otherwise calculate locally for immediate feedback
    if (shearData.shear?.conclusions?.force?.perCylinder !== undefined) {
      // Use backend values
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

    // Local calculations for immediate feedback
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

  // Header section
  const headerSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Shear Design - {shearType === "single-rake" ? "Single Rake" : "Bow Tie"}
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <Select
          label="Shear Type"
          name="shear.model"
          value={shearType}
          onChange={handleShearTypeChange}
          options={SHEAR_TYPE_OPTIONS}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData.common?.customer, localData.rfq?.dates?.date, shearType, handleChange, handleShearTypeChange, isEditing]);

  // Material specifications section
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
          name="material.materialThickness"
          type="number"
          value={localData.common?.material?.materialThickness?.toString() || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Coil Width (in)"
          name="material.coilWidth"
          type="number"
          value={localData.common?.material?.coilWidth?.toString() || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Material Tensile (psi)"
          name="material.maxTensileStrength"
          type="number"
          value={localData.common?.material?.maxTensileStrength?.toString() || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
      </div>
      <div className="mt-2">
        <Text className="text-sm text-gray-600">
          Shear Strength (psi) (70-80% of tensile): {calculatedValues.shearStrength.toFixed(0)}
        </Text>
      </div>
    </div>
  ), [localData.common?.material, calculatedValues.shearStrength, handleChange, isEditing]);

  // Blade specifications section
  const bladeSpecsSection = useMemo(() => (
    <div className="mb-6">
      <Text as="h4" className="mb-3 text-md font-medium">Blade Specifications</Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <Input
            label="Rake of blade per foot"
            name="shear.blade.rakeOfBladePerFoot"
            type="number"
            value={localData.shear?.shear?.blade?.rakeOfBladePerFoot?.toString() || ""}
            onChange={handleChange}
            disabled={!isEditing}
          />
          <Input
            label="Distance blade travels past cut (overlap)"
            name="shear.blade.overlap"
            type="number"
            value={localData.shear?.shear?.blade?.overlap?.toString() || ""}
            onChange={handleChange}
            disabled={!isEditing}
          />
          <Input
            label="Desired blade opening"
            name="shear.blade.bladeOpening"
            type="number"
            value={localData.shear?.shear?.blade?.bladeOpening?.toString() || ""}
            onChange={handleChange}
            disabled={!isEditing}
          />
          <Input
            label="% of penetration (equal to elongation) (38% std)"
            name="shear.blade.percentOfPenetration"
            type="number"
            value={localData.shear?.shear?.blade?.percentOfPenetration?.toString() || "38"}
            onChange={handleChange}
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
  ), [localData.shear?.shear?.blade, calculatedValues, handleChange, isEditing]);

  // Cylinder specifications section
  const cylinderSpecsSection = useMemo(() => (
    <div className="mb-6">
      <Text as="h4" className="mb-3 text-md font-medium">Cylinder Specifications</Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <Input
            label="Bore Size"
            name="shear.cylinder.boreSize"
            type="number"
            value={localData.shear?.shear?.cylinder?.boreSize?.toString() || ""}
            onChange={handleChange}
            disabled={!isEditing}
          />
          <Input
            label="Rod Dia."
            name="shear.cylinder.rodDiameter"
            type="number"
            value={localData.shear?.shear?.cylinder?.rodDiameter?.toString() || ""}
            onChange={handleChange}
            disabled={!isEditing}
          />
          <Input
            label="Stroke"
            name="shear.cylinder.stroke"
            type="number"
            value={localData.shear?.shear?.cylinder?.stroke?.toString() || ""}
            onChange={handleChange}
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
  ), [localData.shear?.shear?.cylinder, calculatedValues, handleChange, isEditing]);

  // Hydraulic pressure section
  const hydraulicSection = useMemo(() => (
    <div className="mb-6">
      <Text as="h4" className="mb-3 text-md font-medium">Hydraulic Pressure (psi)</Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Pressure"
          name="shear.hydraulic.pressure"
          type="number"
          value={localData.shear?.shear?.hydraulic?.pressure?.toString() || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <div className="p-3 bg-gray-50 rounded space-y-1">
          <Text className="text-sm">Cylinder Area: {calculatedValues.cylinderArea.toFixed(5)}</Text>
          <Text className="text-sm">Cylinder Volume: {calculatedValues.cylinderVolume.toFixed(5)}</Text>
          <Text className="text-sm">Fluid Velocity (ft/sec): {calculatedValues.fluidVelocity.toFixed(5)}</Text>
        </div>
      </div>
    </div>
  ), [localData.shear?.shear?.hydraulic?.pressure, calculatedValues, handleChange, isEditing]);

  // Time section
  const timeSection = useMemo(() => (
    <div className="mb-6">
      <Text as="h4" className="mb-3 text-md font-medium">Time</Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Time in seconds for (1) downward stroke"
          name="shear.time.forDownwardStroke"
          type="number"
          value={localData.shear?.shear?.time?.forDownwardStroke?.toString() || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Dwell time for feed"
          name="shear.time.dwellTime"
          type="number"
          value={localData.shear?.shear?.time?.dwellTime?.toString() || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
      </div>
    </div>
  ), [localData.shear?.shear?.time, handleChange, isEditing]);

  // User defined variables section
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
          disabled={!isEditing || isCalculating}
        >
          {isCalculating ? "CALCULATING..." : "CALCULATE"}
        </Button>
      </div>
    </Card>
  ), [materialSpecsSection, bladeSpecsSection, cylinderSpecsSection, hydraulicSection, timeSection, handleCalculate, isEditing, isCalculating]);

  // Conclusions section
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

  // Notes section for bow-tie
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

  // Status indicator component
  const StatusIndicator = () => {
    if (updateLoading || isCalculating) {
      return (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent"></div>
          {isCalculating ? "Calculating..." : "Saving..."}
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
      {userDefinedSection}
      {conclusionsSection}
      {notesSection}
    </div>
  );
};

export default Shear;