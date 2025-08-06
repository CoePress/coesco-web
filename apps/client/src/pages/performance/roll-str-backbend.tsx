import { useState, useEffect, useRef } from "react";
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
import { useUpdateEntity } from "@/hooks/_base/use-update-entity";
import { useParams } from "react-router-dom";
import { useGetEntity } from "@/hooks/_base/use-get-entity";

const ROLL_CONFIGURATION_OPTIONS = [
  { value: "7", label: "7 Roll" },
  { value: "9", label: "9 Roll" },
  { value: "11", label: "11 Roll" },
];

export interface RollStrBackbendProps {
  data: PerformanceData;
  isEditing: boolean;
}

const RollStrBackbend: React.FC<RollStrBackbendProps> = ({ data, isEditing }) => {
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

  // Determine roll configuration from straightener.rolls.numberOfRolls
  const getRollConfiguration = () => {
    const straightenerRolls = localData.straightener?.rolls?.numberOfRolls;
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
  }, [localData.straightener?.rolls?.numberOfRolls]);

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
        if (response && response.data && response.data.straightener) {
          console.log("Updating calculated backbend values from backend response");
          
          setLocalData(prevData => ({
            ...prevData,
            straightener: {
              ...prevData.straightener,
              rolls: {
                ...prevData.straightener?.rolls,
                backbend: {
                  ...prevData.straightener?.rolls?.backbend,
                  // Update calculated radius values
                  radius: {
                    ...prevData.straightener?.rolls?.backbend?.radius,
                    comingOffCoil: response.data.straightener.rolls?.backbend?.radius?.comingOffCoil || prevData.straightener?.rolls?.backbend?.radius?.comingOffCoil,
                    offCoilAfterSpringback: response.data.straightener.rolls?.backbend?.radius?.offCoilAfterSpringback || prevData.straightener?.rolls?.backbend?.radius?.offCoilAfterSpringback,
                    requiredToYieldSkinOfFlatMaterial: response.data.straightener.rolls?.backbend?.radius?.requiredToYieldSkinOfFlatMaterial || prevData.straightener?.rolls?.backbend?.radius?.requiredToYieldSkinOfFlatMaterial,
                  },
                  bendingMomentToYieldSkin: response.data.straightener.rolls?.backbend?.bendingMomentToYieldSkin || prevData.straightener?.rolls?.backbend?.bendingMomentToYieldSkin,
                  // Update roller calculations
                  rollers: {
                    ...prevData.straightener?.rolls?.backbend?.rollers,
                    first: {
                      ...prevData.straightener?.rolls?.backbend?.rollers?.first,
                      height: response.data.straightener.rolls?.backbend?.rollers?.first?.height || prevData.straightener?.rolls?.backbend?.rollers?.first?.height,
                      forceRequired: response.data.straightener.rolls?.backbend?.rollers?.first?.forceRequired || prevData.straightener?.rolls?.backbend?.rollers?.first?.forceRequired,
                      numberOfYieldStrainsAtSurface: response.data.straightener.rolls?.backbend?.rollers?.first?.numberOfYieldStrainsAtSurface || prevData.straightener?.rolls?.backbend?.rollers?.first?.numberOfYieldStrainsAtSurface,
                      up: {
                        ...prevData.straightener?.rolls?.backbend?.rollers?.first?.up,
                        resultingRadius: response.data.straightener.rolls?.backbend?.rollers?.first?.up?.resultingRadius || prevData.straightener?.rolls?.backbend?.rollers?.first?.up?.resultingRadius,
                        curvatureDifference: response.data.straightener.rolls?.backbend?.rollers?.first?.up?.curvatureDifference || prevData.straightener?.rolls?.backbend?.rollers?.first?.up?.curvatureDifference,
                        bendingMoment: response.data.straightener.rolls?.backbend?.rollers?.first?.up?.bendingMoment || prevData.straightener?.rolls?.backbend?.rollers?.first?.up?.bendingMoment,
                        springback: response.data.straightener.rolls?.backbend?.rollers?.first?.up?.springback || prevData.straightener?.rolls?.backbend?.rollers?.first?.up?.springback,
                        percentOfThicknessYielded: response.data.straightener.rolls?.backbend?.rollers?.first?.up?.percentOfThicknessYielded || prevData.straightener?.rolls?.backbend?.rollers?.first?.up?.percentOfThicknessYielded,
                        radiusAfterSpringback: response.data.straightener.rolls?.backbend?.rollers?.first?.up?.radiusAfterSpringback || prevData.straightener?.rolls?.backbend?.rollers?.first?.up?.radiusAfterSpringback,
                      },
                      down: {
                        ...prevData.straightener?.rolls?.backbend?.rollers?.first?.down,
                        resultingRadius: response.data.straightener.rolls?.backbend?.rollers?.first?.down?.resultingRadius || prevData.straightener?.rolls?.backbend?.rollers?.first?.down?.resultingRadius,
                        curvatureDifference: response.data.straightener.rolls?.backbend?.rollers?.first?.down?.curvatureDifference || prevData.straightener?.rolls?.backbend?.rollers?.first?.down?.curvatureDifference,
                        bendingMoment: response.data.straightener.rolls?.backbend?.rollers?.first?.down?.bendingMoment || prevData.straightener?.rolls?.backbend?.rollers?.first?.down?.bendingMoment,
                        springback: response.data.straightener.rolls?.backbend?.rollers?.first?.down?.springback || prevData.straightener?.rolls?.backbend?.rollers?.first?.down?.springback,
                        percentOfThicknessYielded: response.data.straightener.rolls?.backbend?.rollers?.first?.down?.percentOfThicknessYielded || prevData.straightener?.rolls?.backbend?.rollers?.first?.down?.percentOfThicknessYielded,
                        radiusAfterSpringback: response.data.straightener.rolls?.backbend?.rollers?.first?.down?.radiusAfterSpringback || prevData.straightener?.rolls?.backbend?.rollers?.first?.down?.radiusAfterSpringback,
                      }
                    },
                    middle: response.data.straightener.rolls?.backbend?.rollers?.middle || prevData.straightener?.rolls?.backbend?.rollers?.middle,
                    last: {
                      ...prevData.straightener?.rolls?.backbend?.rollers?.last,
                      height: response.data.straightener.rolls?.backbend?.rollers?.last?.height || prevData.straightener?.rolls?.backbend?.rollers?.last?.height,
                      forceRequired: response.data.straightener.rolls?.backbend?.rollers?.last?.forceRequired || prevData.straightener?.rolls?.backbend?.rollers?.last?.forceRequired,
                      numberOfYieldStrainsAtSurface: response.data.straightener.rolls?.backbend?.rollers?.last?.numberOfYieldStrainsAtSurface || prevData.straightener?.rolls?.backbend?.rollers?.last?.numberOfYieldStrainsAtSurface,
                      up: {
                        ...prevData.straightener?.rolls?.backbend?.rollers?.last?.up,
                        resultingRadius: response.data.straightener.rolls?.backbend?.rollers?.last?.up?.resultingRadius || prevData.straightener?.rolls?.backbend?.rollers?.last?.up?.resultingRadius,
                        curvatureDifference: response.data.straightener.rolls?.backbend?.rollers?.last?.up?.curvatureDifference || prevData.straightener?.rolls?.backbend?.rollers?.last?.up?.curvatureDifference,
                        bendingMoment: response.data.straightener.rolls?.backbend?.rollers?.last?.up?.bendingMoment || prevData.straightener?.rolls?.backbend?.rollers?.last?.up?.bendingMoment,
                        springback: response.data.straightener.rolls?.backbend?.rollers?.last?.up?.springback || prevData.straightener?.rolls?.backbend?.rollers?.last?.up?.springback,
                        percentOfThicknessYielded: response.data.straightener.rolls?.backbend?.rollers?.last?.up?.percentOfThicknessYielded || prevData.straightener?.rolls?.backbend?.rollers?.last?.up?.percentOfThicknessYielded,
                        radiusAfterSpringback: response.data.straightener.rolls?.backbend?.rollers?.last?.up?.radiusAfterSpringback || prevData.straightener?.rolls?.backbend?.rollers?.last?.up?.radiusAfterSpringback,
                      }
                    },
                    depthRequired: response.data.straightener.rolls?.backbend?.rollers?.depthRequired || prevData.straightener?.rolls?.backbend?.rollers?.depthRequired,
                    forceRequired: response.data.straightener.rolls?.backbend?.rollers?.forceRequired || prevData.straightener?.rolls?.backbend?.rollers?.forceRequired,
                  },
                  yieldMet: response.data.straightener.rolls?.backbend?.yieldMet || prevData.straightener?.rolls?.backbend?.yieldMet,
                }
              }
            }
          }));
          
          console.log("Updated calculated backbend values:", {
            radiusComingOffCoil: response.data.straightener.rolls?.backbend?.radius?.comingOffCoil,
            radiusOffCoilAfterSpringback: response.data.straightener.rolls?.backbend?.radius?.offCoilAfterSpringback,
            bendingMomentToYieldSkin: response.data.straightener.rolls?.backbend?.bendingMomentToYieldSkin,
            rollersDepthRequired: response.data.straightener.rolls?.backbend?.rollers?.depthRequired,
            rollersForceRequired: response.data.straightener.rolls?.backbend?.rollers?.forceRequired,
            yieldMet: response.data.straightener.rolls?.backbend?.yieldMet,
          });
        }

      } catch (error) {
        console.error('Error updating field:', error);
        setLocalData(data);
      }
    }, 500);
  };

  const handleRollConfigurationChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newConfig = e.target.value;
    setRollConfiguration(newConfig);
    
    // Update the straightener.rolls.numberOfRolls value and trigger backend update
    if (isEditing) {
      const updatedData = JSON.parse(JSON.stringify(localData));
      if (!updatedData.straightener) updatedData.straightener = {};
      if (!updatedData.straightener.rolls) updatedData.straightener.rolls = {};
      updatedData.straightener.rolls.numberOfRolls = Number(newConfig);
      
      setLocalData(updatedData);
      
      // Trigger backend update
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      updateTimeoutRef.current = setTimeout(async () => {
        try {
          if (!performanceSheetId) {
            throw new Error("Performance Sheet ID is missing.");
          }
          
          const response = await updateEntity(performanceSheetId, { data: updatedData });
          console.log("Roll configuration updated:", response);
        } catch (error) {
          console.error('Error updating roll configuration:', error);
        }
      }, 500);
    }
  };

  const handleCalculate = async () => {
    if (!isEditing) return;
    
    console.log("Calculate pressed for", rollConfiguration, "roll configuration");
    
    try {
      if (!performanceSheetId) {
        throw new Error("Performance Sheet ID is missing.");
      }

      // Trigger backbend calculation on the backend
      const response = await updateEntity(performanceSheetId, { 
        data: localData,
        triggerBackbendCalculation: true 
      });
      
      console.log("Backbend calculation triggered:", response);
      
      // The response should contain updated backbend calculations
      if (response && response.data && response.data.straightener?.rolls?.backbend) {
        setLocalData(prevData => ({
          ...prevData,
          straightener: {
            ...prevData.straightener,
            rolls: {
              ...prevData.straightener?.rolls,
              backbend: response.data.straightener.rolls.backbend
            }
          }
        }));
      }
    } catch (error) {
      console.error('Error triggering backbend calculation:', error);
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

  // Get calculation data from localData.straightener.rolls.backbend
  const backbendData = localData.straightener?.rolls?.backbend || {};
  
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
          Straightener Backbend - {rollConfiguration} Roll
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            value={localData.material?.coilWidth || ""}
            onChange={handleChange}
          />
          <Input
            label="Material Thickness (in)"
            name="material.materialThickness"
            type="number"
            value={localData.material?.materialThickness || ""}
            onChange={handleChange}
          />
          <Input
            label="Yield Strength (psi)"
            name="material.maxYieldStrength"
            type="number"
            value={localData.material?.maxYieldStrength || ""}
            onChange={handleChange}
          />
          <Select
            label="Material Type"
            name="material.materialType"
            value={localData.material?.materialType || ""}
            onChange={handleChange}
            options={MATERIAL_TYPE_OPTIONS}
          />
          <Input
            label="Straightener Model"
            name="straightener.model"
            value={localData.straightener?.model || ""}
            onChange={handleChange}
          />
          <Select
            label="Roll Type"
            name="straightener.rolls.typeOfRoll"
            value={localData.straightener?.rolls?.typeOfRoll || ""}
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
            value={localData.straightener?.rollDiameter || ""}
            onChange={handleChange}
          />
          <Input
            label="Center Distance (in)"
            name="straightener.centerDistance"
            type="number"
            value={localData.straightener?.centerDistance || ""}
            onChange={handleChange}
          />
          <Input
            label="Modulus (psi)"
            name="straightener.modulus"
            type="number"
            value={localData.straightener?.modulus || ""}
            onChange={handleChange}
          />
          <Input
            label="Jack Force Available (lb)"
            name="straightener.jackForceAvailable"
            type="number"
            value={localData.straightener?.jackForceAvailable || ""}
            onChange={handleChange}
          />
          <Input
            label="Max. Roller Depth W/Out Material (in)"
            name="straightener.rolls.depth.withoutMaterial"
            type="number"
            value={localData.straightener?.rolls?.depth?.withoutMaterial || ""}
            onChange={handleChange}
          />
          <Input
            label="Max. Roller Depth W/ Material (in)"
            name="straightener.rolls.depth.withMaterial"
            type="number"
            value={localData.straightener?.rolls?.depth?.withMaterial || ""}
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
          />
          <Input
            label="Ri (Radius Off Coil After Springback)"
            value={typeof calculationData.ri === "number" ? calculationData.ri.toFixed(2) : ""}
            readOnly
          />
          <Input
            label="1/Ri"
            value={calculationData.oneOverRi?.toFixed(4) || ""}
            readOnly
          />
          <Input
            label="1/Ry"
            value={calculationData.oneOverRy?.toFixed(4) || ""}
            readOnly
          />
          <Input
            label="Ry (Radius Required to Yield Skin)"
            value={typeof calculationData.ry === "number" ? calculationData.ry.toFixed(2) : ""}
            readOnly
          />
          <Input
            label="My (Bending Moment to Yield Skin)"
            value={typeof calculationData.my === "number" ? calculationData.my.toFixed(2) : ""}
            readOnly
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
            calculationData.rollerDepthRequired <= (localData.straightener?.rolls?.depth?.withoutMaterial || 0) 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            <Text className="text-sm">ROLLER DEPTH REQ'D:</Text>
            <Text className="text-lg font-bold">
              {calculationData.rollerDepthRequired?.toFixed(4) || "0.0000"} {
                calculationData.rollerDepthRequired <= (localData.straightener?.rolls?.depth?.withoutMaterial || 0) ? "OK" : "NOT OK"
              }
            </Text>
          </div>
          <div className={`p-3 rounded text-center font-medium ${
            calculationData.rollerForceRequired <= (localData.straightener?.jackForceAvailable || 0)
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            <Text className="text-sm">ROLLER FORCE REQ'D:</Text>
            <Text className="text-lg font-bold">
              {calculationData.rollerForceRequired?.toFixed(2) || "0.00"} {
                calculationData.rollerForceRequired <= (localData.straightener?.jackForceAvailable || 0) ? "OK" : "NOT OK"
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