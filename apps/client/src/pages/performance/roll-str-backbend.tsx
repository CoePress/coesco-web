import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { debounce } from "lodash";
import Card from "@/components/common/card";
import Input from "@/components/common/input";
import Select from "@/components/common/select";
import Text from "@/components/common/text";
import Button from "@/components/common/button";
import { PerformanceData } from "@/contexts/performance.context";
import {
  STR_MODEL_OPTIONS,
  MATERIAL_TYPE_OPTIONS,
} from "@/utils/select-options";
import { useUpdateEntity } from "@/hooks/_base/use-update-entity";
import { useGetEntity } from "@/hooks/_base/use-get-entity";

export interface RollStrBackbendProps {
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

const RollStrBackbend: React.FC<RollStrBackbendProps> = ({ data, isEditing }) => {
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

        console.log("Saving Roll Straightener changes:", changes);
        
        const response = await updateEntity(performanceSheetId, { data: updatedData });
        
        // Handle calculated values from backend
        if (response?.data?.rollStrBackbend) {
          console.log("Updating calculated roll straightener values from backend response");
          
          setLocalData(prevData => ({
            ...prevData,
            rollStrBackbend: {
              ...prevData.rollStrBackbend,
              straightener: {
                ...prevData.rollStrBackbend?.straightener,
                rolls: {
                  ...prevData.rollStrBackbend?.straightener?.rolls,
                  backbend: {
                    ...prevData.rollStrBackbend?.straightener?.rolls?.backbend,
                    // Update calculated radius values
                    radius: {
                      ...prevData.rollStrBackbend?.straightener?.rolls?.backbend?.radius,
                      comingOffCoil: response.data.rollStrBackbend?.straightener?.rolls?.backbend?.radius?.comingOffCoil || prevData.rollStrBackbend?.straightener?.rolls?.backbend?.radius?.comingOffCoil,
                      offCoilAfterSpringback: response.data.rollStrBackbend?.straightener?.rolls?.backbend?.radius?.offCoilAfterSpringback || prevData.rollStrBackbend?.straightener?.rolls?.backbend?.radius?.offCoilAfterSpringback,
                      requiredToYieldSkinOfFlatMaterial: response.data.rollStrBackbend?.straightener?.rolls?.backbend?.radius?.requiredToYieldSkinOfFlatMaterial || prevData.rollStrBackbend?.straightener?.rolls?.backbend?.radius?.requiredToYieldSkinOfFlatMaterial,
                    },
                    bendingMomentToYieldSkin: response.data.rollStrBackbend?.straightener?.rolls?.backbend?.bendingMomentToYieldSkin || prevData.rollStrBackbend?.straightener?.rolls?.backbend?.bendingMomentToYieldSkin,
                    // Update roller calculations
                    rollers: {
                      ...prevData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers,
                      first: {
                        ...prevData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first,
                        height: response.data.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.height || prevData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.height,
                        forceRequired: response.data.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.forceRequired || prevData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.forceRequired,
                        numberOfYieldStrainsAtSurface: response.data.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.numberOfYieldStrainsAtSurface || prevData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.numberOfYieldStrainsAtSurface,
                        up: {
                          ...prevData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.up,
                          resultingRadius: response.data.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.up?.resultingRadius || prevData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.up?.resultingRadius,
                          curvatureDifference: response.data.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.up?.curvatureDifference || prevData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.up?.curvatureDifference,
                          bendingMoment: response.data.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.up?.bendingMoment || prevData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.up?.bendingMoment,
                          springback: response.data.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.up?.springback || prevData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.up?.springback,
                          percentOfThicknessYielded: response.data.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.up?.percentOfThicknessYielded || prevData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.up?.percentOfThicknessYielded,
                          radiusAfterSpringback: response.data.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.up?.radiusAfterSpringback || prevData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.up?.radiusAfterSpringback,
                        },
                        down: {
                          ...prevData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.down,
                          resultingRadius: response.data.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.down?.resultingRadius || prevData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.down?.resultingRadius,
                          curvatureDifference: response.data.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.down?.curvatureDifference || prevData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.down?.curvatureDifference,
                          bendingMoment: response.data.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.down?.bendingMoment || prevData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.down?.bendingMoment,
                          springback: response.data.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.down?.springback || prevData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.down?.springback,
                          percentOfThicknessYielded: response.data.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.down?.percentOfThicknessYielded || prevData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.down?.percentOfThicknessYielded,
                          radiusAfterSpringback: response.data.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.down?.radiusAfterSpringback || prevData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.down?.radiusAfterSpringback,
                        }
                      },
                      middle: response.data.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.middle || prevData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.middle,
                      last: {
                        ...prevData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.last,
                        height: response.data.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.last?.height || prevData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.last?.height,
                        forceRequired: response.data.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.last?.forceRequired || prevData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.last?.forceRequired,
                        numberOfYieldStrainsAtSurface: response.data.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.last?.numberOfYieldStrainsAtSurface || prevData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.last?.numberOfYieldStrainsAtSurface,
                        up: {
                          ...prevData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.last?.up,
                          resultingRadius: response.data.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.last?.up?.resultingRadius || prevData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.last?.up?.resultingRadius,
                          curvatureDifference: response.data.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.last?.up?.curvatureDifference || prevData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.last?.up?.curvatureDifference,
                          bendingMoment: response.data.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.last?.up?.bendingMoment || prevData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.last?.up?.bendingMoment,
                          springback: response.data.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.last?.up?.springback || prevData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.last?.up?.springback,
                          percentOfThicknessYielded: response.data.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.last?.up?.percentOfThicknessYielded || prevData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.last?.up?.percentOfThicknessYielded,
                          radiusAfterSpringback: response.data.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.last?.up?.radiusAfterSpringback || prevData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.last?.up?.radiusAfterSpringback,
                        }
                      },
                      depthRequired: response.data.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.depthRequired || prevData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.depthRequired,
                      forceRequired: response.data.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.forceRequired || prevData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.forceRequired,
                    },
                    yieldMet: response.data.rollStrBackbend?.straightener?.rolls?.backbend?.yieldMet || prevData.rollStrBackbend?.straightener?.rolls?.backbend?.yieldMet,
                  }
                }
              }
            }
          }));
        }

        setLastSaved(new Date());
        setIsDirty(false);
        pendingChangesRef.current = {};
        
      } catch (error) {
        console.error('Error saving Roll Straightener:', error);
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

  // Calculate function
  const handleCalculate = useCallback(async () => {
    if (!isEditing || !performanceSheetId) return;
    
    setIsCalculating(true);
    console.log("Calculate pressed for Roll Straightener Backbend");
    
    try {
      // Trigger roll straightener backbend calculation on the backend
      const response = await updateEntity(performanceSheetId, { 
        data: localData,
        triggerRollStrBackbendCalculation: true 
      });
      
      console.log("Roll Straightener Backbend calculation triggered:", response);
      
      // The response should contain updated roll straightener calculations
      if (response?.data?.rollStrBackbend) {
        setLocalData(prevData => ({
          ...prevData,
          rollStrBackbend: {
            ...prevData.rollStrBackbend,
            ...response.data.rollStrBackbend
          }
        }));
      }
    } catch (error) {
      console.error('Error triggering roll straightener backbend calculation:', error);
      setFieldErrors(prev => ({ 
        ...prev, 
        _general: 'Failed to calculate roll straightener backbend. Please try again.' 
      }));
    } finally {
      setIsCalculating(false);
    }
  }, [isEditing, performanceSheetId, updateEntity, localData]);

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
        Roll Straightener & Back Bend Design
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Customer"
          name="customer"
          value={localData.rfq?.customer || ""}
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
  ), [localData.rfq?.customer, localData.rfq?.dates?.date, handleChange, isEditing]);

  // Material specifications section
  const materialSpecsSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h4" className="mb-4 text-lg font-medium">Material Specifications</Text>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select
          label="Material Type"
          name="material.materialType"
          value={localData.rollStrBackbend?.material?.materialType || ""}
          onChange={handleChange}
          options={MATERIAL_TYPE_OPTIONS}
          disabled={!isEditing}
        />
        <Input
          label="Material Thickness (in)"
          name="material.materialThickness"
          type="number"
          value={localData.rollStrBackbend?.material?.materialThickness?.toString() || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Coil Width (in)"
          name="material.coilWidth"
          type="number"
          value={localData.rollStrBackbend?.material?.coilWidth?.toString() || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Yield Strength (psi)"
          name="material.maxYieldStrength"
          type="number"
          value={localData.rollStrBackbend?.material?.maxYieldStrength?.toString() || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Elastic Modulus (psi)"
          name="material.elasticModulus"
          type="number"
          value={localData.rollStrBackbend?.straightener?.modulus?.toString() || "30000000"}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Material Density (lb/in³)"
          name="material.materialDensity"
          type="number"
          value={localData.rollStrBackbend?.material?.density?.toString() || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData.rollStrBackbend?.material, handleChange, isEditing]);

  // Roll straightener specifications section
  const rollStraightenerSpecsSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h4" className="mb-4 text-lg font-medium">Roll Straightener Specifications</Text>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select
          label="Straightener Model"
          name="rollStrBackbend.straightener.model"
          value={localData.rollStrBackbend?.straightener?.model || ""}
          onChange={handleChange}
          options={STR_MODEL_OPTIONS}
          disabled={!isEditing}
        />
        <Input
          label="Roll Diameter (in)"
          name="rollStrBackbend.straightener.rollDiameter"
          type="number"
          value={localData.rollStrBackbend?.straightener?.rollDiameter?.toString() || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData.rollStrBackbend?.straightener, handleChange, isEditing]);

  // Backbend specifications section
  const backbendSpecsSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h4" className="mb-4 text-lg font-medium">Backbend Specifications</Text>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Coming Off Coil Radius (in)"
          name="rollStrBackbend.straightener.rolls.backbend.radius.comingOffCoil"
          type="number"
          value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.radius?.comingOffCoil?.toString() || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Required Roll Diameter (in)"
          name="rollStrBackbend.straightener.rolls.backbend.requiredRollDiameter"
          type="number"
          value={localData.rollStrBackbend?.straightener?.rollDiameter?.toString() || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="First Roller Height (in)"
          name="rollStrBackbend.straightener.rolls.backbend.rollers.first.height"
          type="number"
          value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.height?.toString() || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Last Roller Height (in)"
          name="rollStrBackbend.straightener.rolls.backbend.rollers.last.height"
          type="number"
          value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.last?.height?.toString() || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
      </div>
      
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
  ), [localData.rollStrBackbend?.straightener, handleChange, handleCalculate, isEditing, isCalculating]);

  // Calculated results section
  const calculatedResultsSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h4" className="mb-4 text-lg font-medium">Calculated Results</Text>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Radius Values */}
        <div className="space-y-2">
          <Text as="h4" className="font-medium">Radius Values (in)</Text>
          <Input
            label="Off Coil After Springback"
            value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.radius?.offCoilAfterSpringback?.toString() || ""}
            disabled
            className="bg-gray-50"
          />
          <Input
            label="Required to Yield Skin"
            value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.radius?.requiredToYieldSkinOfFlatMaterial?.toString() || ""}
            disabled
            className="bg-gray-50"
          />
        </div>

        {/* First Roller Results */}
        <div className="space-y-2">
          <Text as="h4" className="font-medium">First Roller</Text>
          <Input
            label="Force Required (lbs)"
            value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.forceRequired?.toString() || ""}
            disabled
            className="bg-gray-50"
          />
          <Input
            label="Yield Strains at Surface"
            value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.numberOfYieldStrainsAtSurface?.toString() || ""}
            disabled
            className="bg-gray-50"
          />
        </div>

        {/* Last Roller Results */}
        <div className="space-y-2">
          <Text as="h4" className="font-medium">Last Roller</Text>
          <Input
            label="Force Required (lbs)"
            value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.last?.forceRequired?.toString() || ""}
            disabled
            className="bg-gray-50"
          />
          <Input
            label="Yield Strains at Surface"
            value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.last?.numberOfYieldStrainsAtSurface?.toString() || ""}
            disabled
            className="bg-gray-50"
          />
        </div>
      </div>

      {/* Overall Results */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Bending Moment to Yield Skin (in-lbs)"
          value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.bendingMomentToYieldSkin?.toString() || ""}
          disabled
          className="bg-gray-50"
        />
        <Input
          label="Total Depth Required (in)"
          value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.depthRequired?.toString() || ""}
          disabled
          className="bg-gray-50"
        />
        <Input
          label="Total Force Required (lbs)"
          value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.forceRequired?.toString() || ""}
          disabled
          className="bg-gray-50"
        />
      </div>

      {/* Yield Status */}
      <div className="mt-4">
        <div className={`p-3 rounded-md ${
          localData.rollStrBackbend?.straightener?.rolls?.backbend?.yieldMet === 'Yes' 
            ? 'bg-green-100 border border-green-300' 
            : localData.rollStrBackbend?.straightener?.rolls?.backbend?.yieldMet === 'No'
            ? 'bg-red-100 border border-red-300'
            : 'bg-gray-100 border border-gray-300'
        }`}>
          <Text className="font-medium">
            Yield Requirements Met: {localData.rollStrBackbend?.straightener?.rolls?.backbend?.yieldMet || "Not Calculated"}
          </Text>
        </div>
      </div>
    </Card>
  ), [localData.rollStrBackbend?.straightener?.rolls?.backbend]);

  // First roller detailed results section
  const firstRollerDetailsSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h4" className="mb-4 text-lg font-medium">First Roller Detailed Results</Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Up Direction */}
        <div>
          <Text as="h4" className="mb-3 font-medium text-blue-600">Up Direction</Text>
          <div className="space-y-2">
            <Input
              label="Resulting Radius (in)"
              value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.up?.resultingRadius?.toString() || ""}
              disabled
              className="bg-gray-50"
            />
            <Input
              label="Curvature Difference"
              value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.up?.curvatureDifference?.toString() || ""}
              disabled
              className="bg-gray-50"
            />
            <Input
              label="Bending Moment (in-lbs)"
              value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.up?.bendingMoment?.toString() || ""}
              disabled
              className="bg-gray-50"
            />
            <Input
              label="Springback"
              value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.up?.springback?.toString() || ""}
              disabled
              className="bg-gray-50"
            />
            <Input
              label="% Thickness Yielded"
              value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.up?.percentOfThicknessYielded?.toString() || ""}
              disabled
              className="bg-gray-50"
            />
            <Input
              label="Radius After Springback (in)"
              value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.up?.radiusAfterSpringback?.toString() || ""}
              disabled
              className="bg-gray-50"
            />
          </div>
        </div>

        {/* Down Direction */}
        <div>
          <Text as="h4" className="mb-3 font-medium text-red-600">Down Direction</Text>
          <div className="space-y-2">
            <Input
              label="Resulting Radius (in)"
              value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.down?.resultingRadius?.toString() || ""}
              disabled
              className="bg-gray-50"
            />
            <Input
              label="Curvature Difference"
              value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.down?.curvatureDifference?.toString() || ""}
              disabled
              className="bg-gray-50"
            />
            <Input
              label="Bending Moment (in-lbs)"
              value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.down?.bendingMoment?.toString() || ""}
              disabled
              className="bg-gray-50"
            />
            <Input
              label="Springback"
              value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.down?.springback?.toString() || ""}
              disabled
              className="bg-gray-50"
            />
            <Input
              label="% Thickness Yielded"
              value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.down?.percentOfThicknessYielded?.toString() || ""}
              disabled
              className="bg-gray-50"
            />
            <Input
              label="Radius After Springback (in)"
              value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.down?.radiusAfterSpringback?.toString() || ""}
              disabled
              className="bg-gray-50"
            />
          </div>
        </div>
      </div>
    </Card>
  ), [localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first]);

  // Last roller detailed results section
  const lastRollerDetailsSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h4" className="mb-4 text-lg font-medium">Last Roller Detailed Results</Text>
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        {/* Up Direction Only for Last Roller */}
        <div>
          <Text as="h4" className="mb-3 font-medium text-blue-600">Up Direction</Text>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Resulting Radius (in)"
              value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.last?.up?.resultingRadius?.toString() || ""}
              disabled
              className="bg-gray-50"
            />
            <Input
              label="Curvature Difference"
              value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.last?.up?.curvatureDifference?.toString() || ""}
              disabled
              className="bg-gray-50"
            />
            <Input
              label="Bending Moment (in-lbs)"
              value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.last?.up?.bendingMoment?.toString() || ""}
              disabled
              className="bg-gray-50"
            />
            <Input
              label="Springback"
              value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.last?.up?.springback?.toString() || ""}
              disabled
              className="bg-gray-50"
            />
            <Input
              label="% Thickness Yielded"
              value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.last?.up?.percentOfThicknessYielded?.toString() || ""}
              disabled
              className="bg-gray-50"
            />
            <Input
              label="Radius After Springback (in)"
              value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.last?.up?.radiusAfterSpringback?.toString() || ""}
              disabled
              className="bg-gray-50"
            />
          </div>
        </div>
      </div>
    </Card>
  ), [localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.last]);

  // Middle rollers section
  const middleRollersSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h4" className="mb-4 text-lg font-medium">Middle Rollers</Text>
      <div className="space-y-2">
        <Input
          label="Middle Roller Configuration"
          value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.middle?.toString() || "Standard Configuration"}
          disabled
          className="bg-gray-50"
        />
      </div>
    </Card>
  ), [localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.middle]);

  // Design notes section
  const designNotesSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h4" className="mb-4 text-lg font-medium">Design Summary</Text>
      <div className="space-y-4">
        <div>
          <Text as="h4" className="font-medium mb-2">Roll Straightener Configuration:</Text>
          <div className="space-y-1 text-sm">
            <Text>• Model: {localData.rollStrBackbend?.straightener?.model || "—"}</Text>
            <Text>• Roll Diameter: {localData.rollStrBackbend?.straightener?.rollDiameter || "—"} inches</Text>
          </div>
        </div>
        
        <div>
          <Text as="h4" className="font-medium mb-2">Material Properties:</Text>
          <div className="space-y-1 text-sm">
            <Text>• Material Type: {localData.rollStrBackbend?.material?.materialType || "—"}</Text>
            <Text>• Thickness: {localData.rollStrBackbend?.material?.materialThickness || "—"} inches</Text>
            <Text>• Width: {localData.rollStrBackbend?.material?.coilWidth || "—"} inches</Text>
            <Text>• Yield Strength: {localData.rollStrBackbend?.material?.maxYieldStrength || "—"} psi</Text>
          </div>
        </div>

        <div>
          <Text as="h4" className="font-medium mb-2">Backbend Results:</Text>
          <div className="space-y-1 text-sm">
            <Text>• Coming Off Coil Radius: {localData.rollStrBackbend?.straightener?.rolls?.backbend?.radius?.comingOffCoil || "—"} inches</Text>
            <Text>• Total Force Required: {localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.forceRequired || "—"} lbs</Text>
            <Text>• Yield Requirements Met: {localData.rollStrBackbend?.straightener?.rolls?.backbend?.yieldMet || "Not Calculated"}</Text>
          </div>
        </div>
      </div>
    </Card>
  ), [localData.rollStrBackbend?.straightener, localData.rollStrBackbend?.material]);

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
      {materialSpecsSection}
      {rollStraightenerSpecsSection}
      {backbendSpecsSection}
      {calculatedResultsSection}
      {firstRollerDetailsSection}
      {lastRollerDetailsSection}
      {middleRollersSection}
      {designNotesSection}
    </div>
  );
};

export default RollStrBackbend;