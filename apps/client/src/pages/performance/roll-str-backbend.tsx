import { useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
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
import { usePerformanceDataService } from "@/utils/performance-service";

export interface RollStrBackbendProps {
  data: PerformanceData;
  isEditing: boolean;
}

const RollStrBackbend: React.FC<RollStrBackbendProps> = ({ data, isEditing }) => {
  const { id: performanceSheetId } = useParams();
  
  // Use the performance data service
  const dataService = usePerformanceDataService(data, performanceSheetId, isEditing);
  const { state, handleFieldChange, saveImmediately } = dataService;
  const { localData, fieldErrors, isDirty, lastSaved, isLoading, error } = state;

  // Calculate function
  const handleCalculate = useCallback(async () => {
    if (!isEditing || !performanceSheetId) return;
    
    console.log("Calculate pressed for Roll Straightener Backbend");
    
    try {
      // Trigger roll straightener backbend calculation on the backend
      const response = await saveImmediately();
      console.log("Roll Straightener Backbend calculation triggered:", response);
    } catch (error) {
      console.error('Error triggering roll straightener backbend calculation:', error);
    }
  }, [isEditing, performanceSheetId, saveImmediately]);

  // Header section
  const headerSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Roll Straightener & Back Bend Design
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>
    </Card>
  ), [localData, handleFieldChange, isEditing]);

  // Material specifications section
  const materialSpecsSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h4" className="mb-4 text-lg font-medium">Material Specifications</Text>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select
          label="Material Type"
          name="common.material.materialType"
          value={localData.common?.material?.materialType || ""}
          onChange={handleFieldChange}
          options={MATERIAL_TYPE_OPTIONS}
          disabled={!isEditing}
        />
        <Input
          label="Material Thickness (in)"
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
          label="Yield Strength (psi)"
          name="common.material.maxYieldStrength"
          type="number"
          value={localData.common?.material?.maxYieldStrength?.toString() || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Elastic Modulus (psi)"
          name="rollStrBackbend.straightener.modulus"
          type="number"
          value={localData.rollStrBackbend?.straightener?.modulus?.toString() || "30000000"}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Material Density (lb/in³)"
          name="rollStrBackbend.material.density"
          type="number"
          value={localData.rollStrBackbend?.material?.density?.toString() || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData, handleFieldChange, isEditing]);

  // Roll straightener specifications section
  const rollStraightenerSpecsSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h4" className="mb-4 text-lg font-medium">Roll Straightener Specifications</Text>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select
          label="Straightener Model"
          name="common.equipment.straightener.model"
          value={localData.common?.equipment?.straightener?.model || ""}
          onChange={handleFieldChange}
          options={STR_MODEL_OPTIONS}
          disabled={!isEditing}
        />
        <Input
          label="Roll Diameter (in)"
          name="common.equipment.straightener.rollDiameter"
          type="number"
          value={localData.common?.equipment?.straightener?.rollDiameter?.toString() || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData, handleFieldChange, isEditing]);

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
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Required Roll Diameter (in)"
          name="rollStrBackbend.straightener.rolls.backbend.requiredRollDiameter"
          type="number"
          value={localData.common?.equipment?.straightener?.rollDiameter?.toString() || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="First Roller Height (in)"
          name="rollStrBackbend.straightener.rolls.backbend.rollers.first.height"
          type="number"
          value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.height?.toString() || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Last Roller Height (in)"
          name="rollStrBackbend.straightener.rolls.backbend.rollers.last.height"
          type="number"
          value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.last?.height?.toString() || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData, handleFieldChange, handleCalculate, isEditing, isLoading]);

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
            label="Bending Moment to Yield Skin (in-lbs)"
            value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.radius?.bendingMomentToYield?.toString() || ""}
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
          label="One over radius off coil after springback"
          value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.radius?.oneOffCoil?.toString() || ""}
          disabled
          className="bg-gray-50"
        />
        <Input
          label="Curve at Yield"
          value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.radius?.curveAtYield?.toString() || ""}
          disabled
          className="bg-gray-50"
        />
        <Input
          label="Radius req to yield flat material (in)"
          value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.radius?.radiusAtYield?.toString() || ""}
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
  ), [localData]);

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
              label="Bending Moment Ratio"
              value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.up?.bendingMomentRatio?.toString() || ""}
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
              label="Bending Moment Ratio"
              value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.first?.down?.bendingMomentRatio?.toString() || ""}
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
  ), [localData]);

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
              label="Bending Moment Ratio"
              value={localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.last?.up?.bendingMomentRatio?.toString() || ""}
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
  ), [localData]);

  // Middle rollers section
  const middleRollersSection = useMemo(() => {
    // Determine number of middle rollers based on straightener rolls
    const numStraightenerRolls = localData.common?.equipment?.straightener?.numberOfRolls || 7;
    let numMiddleRollers = 0;
    
    if (numStraightenerRolls === 7) {
      numMiddleRollers = 1;
    } else if (numStraightenerRolls === 9) {
      numMiddleRollers = 2;
    } else if (numStraightenerRolls === 11) {
      numMiddleRollers = 3;
    }

    // If there's only one middle roller, check the single middle path
    if (numMiddleRollers === 1) {
      const middleData = localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.middle;
      
      return (
        <Card className="mb-4 p-4">
          <Text as="h4" className="mb-4 text-lg font-medium">Middle Roller</Text>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Up Direction */}
            <div>
              <Text as="h4" className="mb-3 font-medium text-blue-600">Up Direction</Text>
              <div className="space-y-2">
                <Input
                  label="Height (in)"
                  value={middleData?.height?.toString() || ""}
                  disabled
                  className="bg-gray-50"
                />
                <Input
                  label="Resulting Radius (in)"
                  value={middleData?.up?.resultingRadius?.toString() || ""}
                  disabled
                  className="bg-gray-50"
                />
                <Input
                  label="Curvature Difference"
                  value={middleData?.up?.curvatureDifference?.toString() || ""}
                  disabled
                  className="bg-gray-50"
                />
                <Input
                  label="Bending Moment (in-lbs)"
                  value={middleData?.up?.bendingMoment?.toString() || ""}
                  disabled
                  className="bg-gray-50"
                />
                <Input
                  label="Bending Moment Ratio"
                  value={middleData?.up?.bendingMomentRatio?.toString() || ""}
                  disabled
                  className="bg-gray-50"
                />
                <Input
                  label="Springback"
                  value={middleData?.up?.springback?.toString() || ""}
                  disabled
                  className="bg-gray-50"
                />
                <Input
                  label="% Thickness Yielded"
                  value={middleData?.up?.percentOfThicknessYielded?.toString() || ""}
                  disabled
                  className="bg-gray-50"
                />
                <Input
                  label="Force Required (lbs)"
                  value={middleData?.forceRequired?.toString() || ""}
                  disabled
                  className="bg-gray-50"
                />
                <Input
                  label="Yield Strains at Surface"
                  value={middleData?.numberOfYieldStrainsAtSurface?.toString() || ""}
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
                  value={middleData?.down?.resultingRadius?.toString() || ""}
                  disabled
                  className="bg-gray-50"
                />
                <Input
                  label="Curvature Difference"
                  value={middleData?.down?.curvatureDifference?.toString() || ""}
                  disabled
                  className="bg-gray-50"
                />
                <Input
                  label="Bending Moment (in-lbs)"
                  value={middleData?.down?.bendingMoment?.toString() || ""}
                  disabled
                  className="bg-gray-50"
                />
                <Input
                  label="Bending Moment Ratio"
                  value={middleData?.down?.bendingMomentRatio?.toString() || ""}
                  disabled
                  className="bg-gray-50"
                />
                <Input
                  label="Springback"
                  value={middleData?.down?.springback?.toString() || ""}
                  disabled
                  className="bg-gray-50"
                />
                <Input
                  label="% Thickness Yielded"
                  value={middleData?.down?.percentOfThicknessYielded?.toString() || ""}
                  disabled
                  className="bg-gray-50"
                />
                <Input
                  label="Radius After Springback (in)"
                  value={middleData?.down?.radiusAfterSpringback?.toString() || ""}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>
          </div>
        </Card>
      );
    }

    // For multiple middle rollers, render each one
    const middleRollers = [];
    for (let i = 1; i <= numMiddleRollers; i++) {
      let middleData;
      if (numStraightenerRolls === 7) {
        middleData = localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.middle;
      } 
      else { 
        middleData = localData.rollStrBackbend?.straightener?.rolls?.backbend?.rollers?.middle?.[i];
      }

      middleRollers.push(
        <Card key={i} className="mb-4 p-4">
          <Text as="h4" className="mb-4 text-lg font-medium">Middle Roller {i}</Text>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Up Direction */}
            <div>
              <Text as="h4" className="mb-3 font-medium text-blue-600">Up Direction</Text>
              <div className="space-y-2">
                <Input
                  label="Height (in)"
                  value={middleData?.height?.toString() || ""}
                  disabled
                  className="bg-gray-50"
                />
                <Input
                  label="Resulting Radius (in)"
                  value={middleData?.up?.resultingRadius?.toString() || ""}
                  disabled
                  className="bg-gray-50"
                />
                <Input
                  label="Curvature Difference"
                  value={middleData?.up?.curvatureDifference?.toString() || ""}
                  disabled
                  className="bg-gray-50"
                />
                <Input
                  label="Bending Moment (in-lbs)"
                  value={middleData?.up?.bendingMoment?.toString() || ""}
                  disabled
                  className="bg-gray-50"
                />
                <Input
                  label="Bending Moment Ratio"
                  value={middleData?.up?.bendingMomentRatio?.toString() || ""}
                  disabled
                  className="bg-gray-50"
                />
                <Input
                  label="Springback"
                  value={middleData?.up?.springback?.toString() || ""}
                  disabled
                  className="bg-gray-50"
                />
                <Input
                  label="% Thickness Yielded"
                  value={middleData?.up?.percentOfThicknessYielded?.toString() || ""}
                  disabled
                  className="bg-gray-50"
                />
                <Input
                  label="Force Required (lbs)"
                  value={middleData?.forceRequired?.toString() || ""}
                  disabled
                  className="bg-gray-50"
                />
                <Input
                  label="Yield Strains at Surface"
                  value={middleData?.numberOfYieldStrainsAtSurface?.toString() || ""}
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
                  value={middleData?.down?.resultingRadius?.toString() || ""}
                  disabled
                  className="bg-gray-50"
                />
                <Input
                  label="Curvature Difference"
                  value={middleData?.down?.curvatureDifference?.toString() || ""}
                  disabled
                  className="bg-gray-50"
                />
                <Input
                  label="Bending Moment (in-lbs)"
                  value={middleData?.down?.bendingMoment?.toString() || ""}
                  disabled
                  className="bg-gray-50"
                />
                <Input
                  label="Bending Moment Ratio"
                  value={middleData?.down?.bendingMomentRatio?.toString() || ""}
                  disabled
                  className="bg-gray-50"
                />
                <Input
                  label="Springback"
                  value={middleData?.down?.springback?.toString() || ""}
                  disabled
                  className="bg-gray-50"
                />
                <Input
                  label="% Thickness Yielded"
                  value={middleData?.down?.percentOfThicknessYielded?.toString() || ""}
                  disabled
                  className="bg-gray-50"
                />
                <Input
                  label="Radius After Springback (in)"
                  value={middleData?.down?.radiusAfterSpringback?.toString() || ""}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>
          </div>
        </Card>
      );
    }

    return <>{middleRollers}</>;
  }, [localData]);

  // Design notes section
  const designNotesSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h4" className="mb-4 text-lg font-medium">Design Summary</Text>
      <div className="space-y-4">
        <div>
          <Text as="h4" className="font-medium mb-2">Roll Straightener Configuration:</Text>
          <div className="space-y-1 text-sm">
            <Text>• Model: {localData.common?.equipment?.straightener?.model || "—"}</Text>
            <Text>• Roll Diameter: {localData.common?.equipment?.straightener?.rollDiameter || "—"} inches</Text>
          </div>
        </div>
        
        <div>
          <Text as="h4" className="font-medium mb-2">Material Properties:</Text>
          <div className="space-y-1 text-sm">
            <Text>• Material Type: {localData.common?.material?.materialType || "—"}</Text>
            <Text>• Thickness: {localData.common?.material?.materialThickness || "—"} inches</Text>
            <Text>• Width: {localData.common?.material?.coilWidth || "—"} inches</Text>
            <Text>• Yield Strength: {localData.common?.material?.maxYieldStrength || "—"} psi</Text>
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
  ), [localData]);

  // Status indicator component
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
      {/* Status bar */}
      <div className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
        <StatusIndicator />
        {fieldErrors._general && (
          <div className="text-sm text-red-600">{fieldErrors._general}</div>
        )}
      </div>

      {/* Loading and error states */}
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