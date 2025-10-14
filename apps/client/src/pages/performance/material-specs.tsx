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
import {
  mapControlsLevelToFeedControls,
} from "@/utils/feed-controls-mapping";
import { getRequiredFieldBackgroundColor } from "@/utils/performance-helpers";
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
  const { state, handleFieldChange, getFieldValue, getFieldError } = dataService;
  const { localData, fieldErrors, isDirty, lastSaved, isLoading, error } = state;

  // Required fields list
  const requiredFields = [
    'common.material.materialThickness', 'common.material.coilWidth', 'common.material.materialType',
    'common.material.maxYieldStrength', "common.equipment.feed.direction", "common.equipment.feed.controlsLevel",
    "common.equipment.feed.typeOfLine", "common.equipment.feed.controls", "common.equipment.feed.passline",
    "materialSpecs.reel.backplate.type", "materialSpecs.reel.style",
  ];

  // Helper function to get required field background color
  const getRequiredBgColor = (fieldName: string) => {
    return getRequiredFieldBackgroundColor(fieldName, requiredFields, getFieldValue);
  };

  // Get coil width boundaries from the nested structure
  const coilWidthBounds = useMemo(() => {
    const min = Number(localData.common?.coil?.minCoilWidth) || undefined;
    const max = Number(localData.common?.coil?.maxCoilWidth) || undefined;
    return { min, max };
  }, [localData.common?.coil?.minCoilWidth, localData.common?.coil?.maxCoilWidth]);

  // Get feed controls mapping based on controls level
  const feedControlsMapping = useMemo(() => {
    const controlsLevel = localData.common?.equipment?.feed?.controlsLevel || "";
    return mapControlsLevelToFeedControls(controlsLevel);
  }, [localData.common?.equipment?.feed?.controlsLevel]);

  // Get feed controls background color based on validation
  const getFeedControlsBackgroundColor = useMemo(() => {
    const currentValue = localData.common?.equipment?.feed?.controls || feedControlsMapping.controls;
    const validOptions = [
      "Sigma 5 Feed",
      "Sigma 5 Feed Plus",
      "Sigma 5 Feed Pull Thru",
      "Allen Bradley",
      "Allen Bradley MPL Feed",
      "Allen Bradley MPL Feed Plus",
      "IP Indexer Feed",
      "IP Indexer Feed Plus"
    ];

    if (!currentValue) {
      return undefined; // No value, no special color
    }

    // Check if current value matches any of the valid options (case insensitive)
    const isValid = validOptions.some(option =>
      option.toLowerCase() === currentValue.toLowerCase().trim()
    );

    return isValid ? 'var(--color-success)' : undefined;
  }, [localData.common?.equipment?.feed?.controls, feedControlsMapping.controls]);

  // Get background color for Type of Roll based on selected value
  const getRollTypeBackgroundColor = useMemo(() => {
    const rollType = localData.materialSpecs?.straightener?.rolls?.typeOfRoll;

    // Handle both string and number values
    const rollTypeStr = typeof rollType === 'number' ? `${rollType} Roll Str Backbend` : rollType;

    if (rollTypeStr?.includes('7 Roll')) {
      return 'var(--color-success)'; // Green for 7-roll
    } else if (rollTypeStr?.includes('9 Roll')) {
      return 'var(--color-warning)'; // Yellow for 9-roll
    } else if (rollTypeStr?.includes('11 Roll')) {
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
          customBackgroundColor={getRequiredBgColor("common.material.coilWidth")}
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
          customBackgroundColor={getRequiredBgColor("common.material.materialThickness")}
        />
        <Select
          label="Material Type"
          name="common.material.materialType"
          value={localData.common?.material?.materialType || ""}
          onChange={handleFieldChange}
          options={MATERIAL_TYPE_OPTIONS}
          placeholder="Select material type..."
          disabled={!isEditing}
          customBackgroundColor={getRequiredBgColor("common.material.materialType")}
        />
        <Input
          label="Yield Strength (psi)"
          name="common.material.maxYieldStrength"
          value={localData.common?.material?.maxYieldStrength?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          error={getFieldError("common.material.maxYieldStrength")}
          disabled={!isEditing}
          customBackgroundColor={getRequiredBgColor("common.material.maxYieldStrength")}
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
          placeholder="Select feed direction..."
          disabled={!isEditing}
          customBackgroundColor={getRequiredBgColor("common.equipment.feed.direction")}
        />
        <Select
          label="Select Controls Level"
          name="common.equipment.feed.controlsLevel"
          value={localData.common?.equipment?.feed?.controlsLevel || ""}
          onChange={handleFieldChange}
          options={CONTROLS_LEVEL_OPTIONS}
          placeholder="Select controls level..."
          disabled={!isEditing}
          customBackgroundColor={getRequiredBgColor("common.equipment.feed.controlsLevel")}
        />
        <Select
          label="Type of Line"
          name="common.equipment.feed.typeOfLine"
          value={localData.common?.equipment?.feed?.typeOfLine || ""}
          onChange={handleFieldChange}
          options={TYPE_OF_LINE_OPTIONS}
          placeholder="Select type of line..."
          disabled={!isEditing}
          customBackgroundColor={getRequiredBgColor("common.equipment.feed.typeOfLine")}
        />
        <Input
          label="Feed Controls"
          name="common.equipment.feed.controls"
          value={localData.common?.equipment?.feed?.controls || feedControlsMapping.controls || "Sigma 5 Feed"}
          onChange={handleFieldChange}
          disabled={true}
          customBackgroundColor={getFeedControlsBackgroundColor}
        />
        <Select
          label="Passline"
          name="common.equipment.feed.passline"
          value={localData.common?.equipment?.feed?.passline || ""}
          onChange={handleFieldChange}
          options={PASSLINE_OPTIONS}
          placeholder="Select passline..."
          disabled={!isEditing}
          customBackgroundColor={getRequiredBgColor("common.equipment.feed.passline")}
        />
        <Select
          label="Type of Roll"
          name="materialSpecs.straightener.rolls.typeOfRoll"
          value={localData.materialSpecs?.straightener?.rolls?.typeOfRoll || ""}
          onChange={e => {
            handleFieldChange(e);
            const value = e.target.value;
            let numRolls = 0;
            if (value.includes("7 Roll")) numRolls = 7;
            else if (value.includes("9 Roll")) numRolls = 9;
            else if (value.includes("11 Roll")) numRolls = 11;
            if (numRolls) {
              handleFieldChange({
                target: {
                  name: "common.equipment.straightener.numberOfRolls",
                  value: numRolls.toString()
                }
              } as React.ChangeEvent<HTMLInputElement>);
            }
          }}
          options={ROLL_TYPE_OPTIONS}
          placeholder="Select type of roll..."
          disabled={!isEditing}
          customBackgroundColor={getRollTypeBackgroundColor}
        />
        <Select
          label="Reel Backplate Type"
          name="materialSpecs.reel.backplate.type"
          value={localData.materialSpecs?.reel?.backplate?.type || ""}
          onChange={handleFieldChange}
          options={REEL_BACKPLATE_OPTIONS}
          placeholder="Select backplate type..."
          disabled={!isEditing}
          customBackgroundColor={getRequiredBgColor("materialSpecs.reel.backplate.type")}
        />
        <Select
          label="Reel Style"
          name="materialSpecs.reel.style"
          value={localData.materialSpecs?.reel?.style || ""}
          onChange={handleFieldChange}
          options={REEL_STYLE_OPTIONS}
          placeholder="Select reel style..."
          disabled={!isEditing}
          customBackgroundColor={getRequiredBgColor("materialSpecs.reel.style")}
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
    <div className="w-full flex flex-1 flex-col px-2 pb-2 gap-2">
      {/* Status bar */}
      <div className="flex justify-between items-center p-2 bg-muted rounded-md">
        <StatusIndicator />
        {fieldErrors._general && (
          <div className="text-sm text-red-600">{fieldErrors._general}</div>
        )}
      </div>

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
