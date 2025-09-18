import React, { useMemo } from "react";
import { useParams } from "react-router-dom";

import {
  FEED_DIRECTION_OPTIONS,
  CONTROLS_LEVEL_OPTIONS,
  TYPE_OF_LINE_OPTIONS,
  PASSLINE_OPTIONS,
  ROLL_TYPE_OPTIONS,
  REEL_BACKPLATE_OPTIONS,
  REEL_STYLE_OPTIONS,
  MATERIAL_TYPE_OPTIONS,
  usePerformanceDataService,
} from "@/utils/performance-sheet";
import { PerformanceData } from "@/contexts/performance.context";
import { Card, Input, Select, Text } from "@/components";
import Checkbox from "@/components/_old/checkbox";

export interface MaterialSpecsProps {
  data: PerformanceData;
  isEditing: boolean;
}

const MaterialSpecs: React.FC<MaterialSpecsProps> = ({ data, isEditing }) => {
  const { id: performanceSheetId } = useParams();

  const dataService = usePerformanceDataService(data, performanceSheetId, isEditing);
  const { state, handleFieldChange, getFieldValue, hasFieldError, getFieldError } = dataService;
  const { localData, fieldErrors, isDirty, lastSaved, isLoading, error } = state;

  // Get coil width boundaries from the nested structure
  const coilWidthBounds = useMemo(() => {
    const min = Number(localData.common?.coil?.minCoilWidth) || undefined;
    const max = Number(localData.common?.coil?.maxCoilWidth) || undefined;
    return { min, max };
  }, [localData.common?.coil?.minCoilWidth, localData.common?.coil?.maxCoilWidth]);

  // Get background color for Type of Roll based on selected value
  const getRollTypeBackgroundColor = useMemo(() => {
    const rollType = localData.materialSpecs?.straightener?.rolls?.typeOfRoll;

    if (rollType?.includes('7 Roll')) {
      return 'var(--color-success)'; // Green for 7-roll
    } else if (rollType?.includes('9 Roll')) {
      return 'var(--color-warning)'; // Yellow for 9-roll
    } else if (rollType?.includes('11 Roll')) {
      return 'var(--color-info)'; // Cyan for 11-roll
    }

    return undefined; // No special color for other values
  }, [localData.materialSpecs?.straightener?.rolls?.typeOfRoll]);

  // Customer and Date Section
  const customerDateSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Customer & Date
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Customer"
          name="common.customer"
          value={localData.common?.customer || ""}
          onChange={handleFieldChange}
          error={getFieldError("common.customer")}
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
  ), [localData, handleFieldChange, getFieldError, isEditing]);

  // Material Specifications Section
  const materialSpecsSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Material Specifications
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Input
          label="Coil Width (in)"
          name="common.material.coilWidth"
          value={localData.common?.material?.coilWidth?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          min={coilWidthBounds.min}
          max={coilWidthBounds.max}
          error={getFieldError("common.material.coilWidth")}
          disabled={!isEditing}
        />
        <Input
          label="Coil Weight (Max)"
          name="common.coil.maxCoilWeight"
          value={localData.common?.material?.coilWeight?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          error={getFieldError("common.coil.maxCoilWeight")}
          disabled={!isEditing}
        />
        <Input
          label="Material Thickness (in)"
          name="common.material.materialThickness"
          value={localData.common?.material?.materialThickness?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          error={getFieldError("common.material.materialThickness")}
          disabled={!isEditing}
        />
        <Select
          label="Material Type"
          name="common.material.materialType"
          value={localData.common?.material?.materialType || ""}
          onChange={handleFieldChange}
          options={MATERIAL_TYPE_OPTIONS}
          disabled={!isEditing}
        />
        <Input
          label="Yield Strength (psi)"
          name="common.material.maxYieldStrength"
          value={localData.common?.material?.maxYieldStrength?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          error={getFieldError("common.material.maxYieldStrength")}
          disabled={!isEditing}
        />
        <Input
          label="Material Tensile (psi)"
          name="common.material.maxTensileStrength"
          value={localData.common?.material?.maxTensileStrength?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          error={getFieldError("common.material.maxTensileStrength")}
          disabled={!isEditing}
        />
        <Input
          label="Required Max FPM"
          name="common.material.reqMaxFPM"
          value={localData.common?.material?.reqMaxFPM?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          error={getFieldError("common.material.reqMaxFPM")}
          disabled={!isEditing}
        />
        <Input
          label="Coil I.D."
          name="common.coil.coilID"
          value={localData.common?.coil?.coilID?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="Coil O.D."
          name="common.coil.maxCoilOD"
          value={localData.common?.coil?.maxCoilOD?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="Min Bend Radius (in)"
          name="materialSpecs.material.minBendRadius"
          value={localData.materialSpecs?.material?.minBendRadius?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="Min Loop Length (ft)"
          name="materialSpecs.material.minLoopLength"
          value={localData.materialSpecs?.material?.minLoopLength?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="Coil O.D. Calculated"
          name="materialSpecs.material.calculatedCoilOD"
          value={localData.materialSpecs?.material?.calculatedCoilOD?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [
    localData,
    coilWidthBounds,
    handleFieldChange,
    getFieldError,
    isEditing
  ]);

  // Other Specifications Section
  const otherSpecsSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Other Specifications
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4">
        <Select
          label="Select Feed Direction"
          name="common.equipment.feed.direction"
          value={localData.common?.equipment?.feed?.direction || ""}
          onChange={handleFieldChange}
          options={FEED_DIRECTION_OPTIONS}
          disabled={!isEditing}
        />
        <Select
          label="Select Controls Level"
          name="common.equipment.feed.controlsLevel"
          value={localData.common?.equipment?.feed?.controlsLevel || ""}
          onChange={handleFieldChange}
          options={CONTROLS_LEVEL_OPTIONS}
          disabled={!isEditing}
        />
        <Select
          label="Type of Line"
          name="common.equipment.feed.typeOfLine"
          value={localData.common?.equipment?.feed?.typeOfLine || ""}
          onChange={handleFieldChange}
          options={TYPE_OF_LINE_OPTIONS}
          disabled={!isEditing}
        />
        <Input
          label="Feed Controls"
          name="common.equipment.feed.controls"
          value={localData.common?.equipment?.feed?.controls || ""}
          onChange={handleFieldChange}
          disabled={true}
        />
        <Select
          label="Passline"
          name="common.equipment.feed.passline"
          value={localData.common?.equipment?.feed?.passline || ""}
          onChange={handleFieldChange}
          options={PASSLINE_OPTIONS}
          disabled={!isEditing}
        />
        <Select
          label="Type of Roll"
          name="materialSpecs.straightener.rolls.typeOfRoll"
          value={localData.materialSpecs?.straightener?.rolls?.typeOfRoll || ""}
          onChange={handleFieldChange}
          options={ROLL_TYPE_OPTIONS}
          disabled={!isEditing}
          customBackgroundColor={getRollTypeBackgroundColor}
        />
        <Select
          label="Reel Backplate Type"
          name="materialSpecs.reel.backplate.type"
          value={localData.materialSpecs?.reel?.backplate?.type || ""}
          onChange={handleFieldChange}
          options={REEL_BACKPLATE_OPTIONS}
          disabled={!isEditing}
        />
        <Select
          label="Reel Style"
          name="materialSpecs.reel.style"
          value={localData.materialSpecs?.reel?.style || ""}
          onChange={handleFieldChange}
          options={REEL_STYLE_OPTIONS}
          disabled={!isEditing}
        />
        <Checkbox
          label="Light Gauge Non-Marking"
          name="common.equipment.feed.lightGuageNonMarking"
          checked={localData.common?.equipment?.feed?.lightGuageNonMarking === "true"}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Checkbox
          label="Non-Marking"
          name="common.equipment.feed.nonMarking"
          checked={localData.common?.equipment?.feed?.nonMarking === "true"}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [
    localData,
    handleFieldChange,
    isEditing
  ]);

  // Status indicator component
  const StatusIndicator = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent"></div>
          Saving...
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
            <span className="text-blue-800">Saving changes and calculating...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <span className="text-red-800">Error: {error}</span>
        </div>
      )}

      {/* Form sections */}
      {customerDateSection}
      {materialSpecsSection}
      {otherSpecsSection}
    </div>
  );
};

export default MaterialSpecs;