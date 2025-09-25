import { useCallback, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { PerformanceData } from "@/contexts/performance.context";
import {
  FEED_MODEL_OPTIONS,
  MACHINE_WIDTH_OPTIONS,
  YES_NO_OPTIONS,
  PRESS_APPLICATION_OPTIONS,
  STRAIGHTENER_ROLLS_OPTIONS,
  STR_FEED_RATE_OPTIONS,
  usePerformanceDataService,
} from "@/utils/performance-sheet";
import { Card, Input, Select, Text, VirtualTable } from "@/components";
import MemoryStatus from "@/components/ui/memory-status";
import { getStatusColors } from "@/utils/performance-helpers";
import { ANGLES } from "../../constants/performance";
import {
  mapControlsLevelToFeedControls,
  getFeedModelOptionsForControlsLevel,
  getAmpOptionsForControlsLevel,
  getMotorOptionsForControlsLevel,
  shouldShowAdvancedTorqueCalculations,
} from "@/utils/feed-controls-mapping";

// Feed angle options based on standard angles
const FEED_ANGLE_OPTIONS = [
  { value: "180", label: "180°" },
  { value: "240", label: "240°" },
  { value: "120", label: "120°" },
  { value: "90", label: "90°" },
  { value: "60", label: "60°" },
];

// Type for table row data
interface TableRowData {
  length?: number;
  rms_torque_fa1?: number;
  rms_torque_fa2?: number;
  spm_at_fa1?: number;
  fpm_fa1?: number;
  index_time_fa1?: number;
  spm_at_fa2?: number;
  fpm_fa2?: number;
  index_time_fa2?: number;
}

export interface FeedProps {
  data: PerformanceData;
  isEditing: boolean;
}

const Feed: React.FC<FeedProps> = ({ data, isEditing }) => {
  const { id: performanceSheetId } = useParams();

  // Use the performance data service
  const dataService = usePerformanceDataService(data, performanceSheetId, isEditing);
  const { state, handleFieldChange, updateField } = dataService;
  const { localData, fieldErrors, isDirty, lastSaved, isLoading, error } = state;

  const successColor = 'var(--color-success)';
  const errorColor = 'var(--color-error)';

  // Use utility function to calculate all status colors at once
  const statusColors = getStatusColors({
    matchCheck: data.feed?.feed?.matchCheck,
    peakTorqueCheck: data.feed?.feed?.torque?.peakCheck,
    rmsTorqueFA1Check: data.feed?.feed?.torque?.rms?.feedAngle1Check,
    rmsTorqueFA2Check: data.feed?.feed?.torque?.rms?.feedAngle2Check,
    accelerationCheck: data.feed?.feed?.torque?.accelerationCheck,
    feedCheck: data.feed?.feed?.feedCheck
  }, successColor, errorColor);

  // Determine feed type based on current data
  const feedType = useMemo(() => {
    const isPullThruBool = localData.feed?.feed?.pullThru?.isPullThru === "true";
    if (isPullThruBool) {
      return "sigma-5-pull-thru";
    }
    if (localData.common?.equipment?.feed?.model?.includes("CPRF")) {
      return "sigma-5";
    }
    if (localData.common?.equipment?.feed?.model?.includes("AB") || localData.common?.equipment?.feed?.model?.includes("Allen")) {
      return "allen-bradley";
    }
    return "sigma-5"; // default
  }, [localData.common?.equipment?.feed?.model, localData.feed?.feed?.pullThru?.isPullThru]);

  // Get feed controls mapping based on controls level
  const feedControlsMapping = useMemo(() => {
    const controlsLevel = localData.common?.equipment?.feed?.controlsLevel || "";
    return mapControlsLevelToFeedControls(controlsLevel);
  }, [localData.common?.equipment?.feed?.controlsLevel]);

  // Get appropriate options based on controls level
  const feedModelOptions = useMemo(() => {
    const controlsLevel = localData.common?.equipment?.feed?.controlsLevel || "";
    return getFeedModelOptionsForControlsLevel(controlsLevel);
  }, [localData.common?.equipment?.feed?.controlsLevel]);

  const ampOptions = useMemo(() => {
    const controlsLevel = localData.common?.equipment?.feed?.controlsLevel || "";
    return getAmpOptionsForControlsLevel(controlsLevel);
  }, [localData.common?.equipment?.feed?.controlsLevel]);

  const motorOptions = useMemo(() => {
    const controlsLevel = localData.common?.equipment?.feed?.controlsLevel || "";
    return getMotorOptionsForControlsLevel(controlsLevel);
  }, [localData.common?.equipment?.feed?.controlsLevel]);

  const showAdvancedTorque = useMemo(() => {
    const controlsLevel = localData.common?.equipment?.feed?.controlsLevel || "";
    return shouldShowAdvancedTorqueCalculations(controlsLevel);
  }, [localData.common?.equipment?.feed?.controlsLevel]);

  // Auto-update feed controls when controls level changes
  useEffect(() => {
    if (isEditing && localData.common?.equipment?.feed?.controlsLevel) {
      const currentControls = localData.common?.equipment?.feed?.controls;
      const expectedControls = feedControlsMapping.controls;

      if (currentControls !== expectedControls) {
        updateField("common.equipment.feed.controls", expectedControls);
      }
    }
  }, [localData.common?.equipment?.feed?.controlsLevel, feedControlsMapping.controls, isEditing, updateField]);

  // Handle feed type change
  const handleFeedTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFeedType = e.target.value;

    if (!isEditing) return;

    // Update relevant fields based on feed type
    updateField("feed.feed.pullThru.isPullThru", newFeedType === "sigma-5-pull-thru" ? "true" : "false");

    // Update model based on feed type
    if (newFeedType === "sigma-5" || newFeedType === "sigma-5-pull-thru") {
      updateField("feed.feed.model", "CPRF-S5");
    } else if (newFeedType === "allen-bradley") {
      updateField("feed.feed.model", "AB-CPRF");
    }
  }, [isEditing, updateField]);

  // Header section
  const headerSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Customer & Date
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

  // Feed configuration section
  const feedConfigSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">Feed Configuration</Text>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Select
          label="Feed Type"
          name="feed.feedType"
          value={feedType}
          onChange={handleFeedTypeChange}
          options={FEED_MODEL_OPTIONS}
          placeholder="Select feed type..."
          disabled={!isEditing}
        />
        <Select
          label="Application"
          name="feed.feed.application"
          value={localData.feed?.feed?.application || ""}
          onChange={handleFieldChange}
          options={PRESS_APPLICATION_OPTIONS}
          placeholder="Select application..."
          disabled={!isEditing}
        />
        <Select
          label="Model"
          name="common.equipment.feed.model"
          value={localData.common?.equipment?.feed?.model || ""}
          onChange={handleFieldChange}
          options={feedModelOptions}
          placeholder="Select model..."
          disabled={!isEditing}
        />
        <Input
          label="Feed Check"
          name="feed.feed.feedCheck"
          value={localData.feed?.feed?.feedCheck || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
          customBackgroundColor={statusColors.feedCheck}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select
          label="Machine Width"
          name="feed.feed.machineWidth"
          value={localData.feed?.feed?.machineWidth !== undefined ? String(localData.feed?.feed?.machineWidth) : ""}
          onChange={handleFieldChange}
          options={MACHINE_WIDTH_OPTIONS}
          placeholder="Select width..."
          disabled={!isEditing}
        />
        <Select
          label="Loop Pit"
          name="common.equipment.feed.loopPit"
          value={localData.common?.equipment?.feed?.loopPit || ""}
          onChange={handleFieldChange}
          options={YES_NO_OPTIONS}
          placeholder="Select..."
          disabled={!isEditing}
        />
        <Select
          label="Full Width Rolls"
          name="feed.feed.fullWidthRolls"
          value={localData.feed?.feed?.fullWidthRolls || ""}
          onChange={handleFieldChange}
          options={YES_NO_OPTIONS}
          placeholder="Select..."
          disabled={!isEditing}
        />
      </div>

      {/* Controls Level and Feed Controls Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-muted rounded-md">
        <div>
          <Text as="h4" className="mb-2 font-medium">Controls Configuration</Text>
          <div className="space-y-2">
            <Input
              label="Controls Level"
              name="common.equipment.feed.controlsLevel"
              value={localData.common?.equipment?.feed?.controlsLevel || ""}
              onChange={handleFieldChange}
              disabled={true}
              className="bg-gray-100"
              placeholder="Set from Material Specs page"
            />
            <Input
              label="Feed Controls"
              name="common.equipment.feed.controls"
              value={localData.common?.equipment?.feed?.controls || feedControlsMapping.controls}
              onChange={handleFieldChange}
              disabled={true}
              className="bg-gray-100"
              customBackgroundColor={feedControlsMapping.feedType === "allen-bradley" ? "rgba(59, 130, 246, 0.1)" : "rgba(34, 197, 94, 0.1)"}
            />
          </div>
        </div>
        <div>
          <Text as="h4" className="mb-2 font-medium">Configuration Info</Text>
          <div className="space-y-1 text-sm text-gray-600">
            <div>Feed Type: <span className="font-medium">{feedControlsMapping.feedType}</span></div>
            <div>Control Level: <span className="font-medium">{localData.common?.equipment?.feed?.controlsLevel || "Not set"}</span></div>
            <div>Advanced Features: <span className="font-medium">{showAdvancedTorque ? "Enabled" : "Basic"}</span></div>
          </div>
        </div>
      </div>
    </Card>
  ), [feedType, localData, handleFieldChange, handleFeedTypeChange, isEditing, feedModelOptions, statusColors, feedControlsMapping, showAdvancedTorque]);

  // Material information section
  const materialInfoSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h4" className="mb-4 text-lg font-medium">Material Information</Text>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Input
          label="Width"
          name="common.material.coilWidth"
          type="number"
          value={localData.common?.material?.coilWidth?.toString() || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Thickness"
          name="common.material.materialThickness"
          type="number"
          value={localData.common?.material?.materialThickness?.toString() || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Press Bed Length"
          name="feed.press.bedLength"
          type="number"
          value={localData.common?.press?.bedLength?.toString() || ""}
          disabled={true}
          className="bg-muted"
        />
        <Input
          label="Density"
          name="common.material.materialDensity"
          type="number"
          value={localData.common?.material?.materialDensity?.toString() || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Mat'l In Loop"
          name="feed.feed.materialInLoop"
          type="number"
          value={localData.feed?.feed?.materialInLoop?.toString() || ""}
          disabled={true}
          className="bg-muted"
        />
      </div>
    </Card>
  ), [localData, handleFieldChange, isEditing]);

  // Sigma 5 fields
  const sigma5Fields = useMemo(() => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Motor"
          name="feed.feed.motor"
          value={localData.feed?.feed?.motor || ""}
          onChange={handleFieldChange}
          options={motorOptions}
          placeholder="Select motor..."
          disabled={!isEditing}
        />
        <Select
          label="AMP"
          name="feed.feed.amp"
          value={localData.feed?.feed?.amp || ""}
          onChange={handleFieldChange}
          options={ampOptions}
          placeholder="Select amp..."
          disabled={!isEditing}
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Select
          label="STR Max Speed (ft/min)"
          name="feed.feed.strMaxSpeed"
          value={localData.feed?.feed?.strMaxSpeed?.toString() || ""}
          onChange={handleFieldChange}
          options={STR_FEED_RATE_OPTIONS}
          placeholder="Select speed..."
          disabled={!isEditing}
        />
        <Input
          label="Friction in Die (lbs)"
          name="feed.feed.frictionInDie"
          type="number"
          value={localData.feed?.feed?.frictionInDie?.toString() || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Acceleration Rate (ft/sec²)"
          name="feed.feed.accelerationRate"
          type="number"
          value={localData.feed?.feed?.accelerationRate?.toString() || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Default Accel (ft/sec²)"
          name="feed.feed.defaultAcceleration"
          type="number"
          value={localData.feed?.feed?.defaultAcceleration?.toString() || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
      </div>

      <div className="grid grid-cols-5 gap-4">
        <Input
          label="Max Motor RPM"
          name="feed.feed.maxMotorRPM"
          type="number"
          value={localData.feed?.feed?.maxMotorRPM?.toString() || ""}
          disabled={true}
          className="bg-muted"
        />
        <Input
          label="Motor Inertia (lbs-in-sec²)"
          name="feed.feed.motorInertia"
          type="number"
          value={localData.feed?.feed?.motorInertia?.toString() || ""}
          disabled={true}
          className="bg-muted"
        />
        <Input
          label="Max Velocity (ft/min)"
          name="common.equipment.feed.maxVelocity"
          type="number"
          value={localData.common?.equipment?.feed?.maximumVelocity?.toString() || ""}
          disabled={true}
          className="bg-muted"
        />
        <Input
          label="Settle Time (sec)"
          name="feed.feed.settleTime"
          type="number"
          value={localData.feed?.feed?.settleTime?.toString() || ""}
          disabled={true}
          className="bg-muted"
        />
        <Input
          label="Ratio"
          name="feed.feed.ratio"
          type="number"
          value={localData.feed?.feed?.ratio?.toString() || ""}
          disabled={true}
          className="bg-muted"
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Input
          label="Chart Minimum Length (in)"
          name="feed.feed.chartMinLength"
          type="number"
          value={localData.feed?.feed?.chartMinLength?.toString() || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Length Increment (in)"
          name="feed.feed.lengthIncrement"
          type="number"
          value={localData.feed?.feed?.lengthIncrement?.toString() || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Select
          label="Feed Angle 1 (Deg)"
          name="feed.feed.feedAngle1"
          value={localData.feed?.feed?.feedAngle1?.toString() || ""}
          onChange={handleFieldChange}
          options={FEED_ANGLE_OPTIONS}
          placeholder="Select angle..."
          disabled={!isEditing}
        />
        <Select
          label="Feed Angle 2 (Deg)"
          name="feed.feed.feedAngle2"
          value={localData.feed?.feed?.feedAngle2?.toString() || ""}
          onChange={handleFieldChange}
          options={FEED_ANGLE_OPTIONS}
          placeholder="Select angle..."
          disabled={!isEditing}
        />
      </div>

      {/* Basic Torque Calculations */}
      <div className="grid grid-cols-4 gap-4">
        <Input
          label="ReGen (Watts)"
          name="feed.feed.regen"
          type="number"
          value={localData.feed?.feed?.regen?.toString() || ""}
          disabled={true}
          className="bg-muted"
        />
        <Input
          label="Motor Peak Torque (lbs-in)"
          name="feed.feed.torque.motorPeak"
          type="number"
          value={localData.feed?.feed?.torque?.motorPeak?.toString() || ""}
          disabled={true}
          className="bg-muted"
        />
        <Input
          label="Motor RMS Torque (lbs-in)"
          name="feed.feed.torque.rms.motor"
          type="number"
          value={localData.feed?.feed?.torque?.rms?.motor?.toString() || ""}
          disabled={true}
          className="bg-muted"
        />
        <Input
          label="Frictional Torque (lbs-in)"
          name="feed.feed.torque.frictional"
          type="number"
          value={localData.feed?.feed?.torque?.frictional?.toString() || ""}
          disabled={true}
          className="bg-muted"
        />
      </div>

      {/* Advanced Torque Calculations - shown only for advanced controls */}
      {showAdvancedTorque && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded">
            <Text as="h4" className="mb-2 font-medium text-blue-800">Advanced Torque Analysis</Text>
            <div className="grid grid-cols-4 gap-4">
              <Input
                label="Loop Torque (lbs-in)"
                name="feed.feed.torque.loop"
                type="number"
                value={localData.feed?.feed?.torque?.loop?.toString() || ""}
                disabled={true}
                className="bg-muted"
              />
              <Input
                label="Settle Torque (lbs-in)"
                name="feed.feed.torque.settle"
                type="number"
                value={localData.feed?.feed?.torque?.settle?.toString() || ""}
                disabled={true}
                className="bg-muted"
              />
              <Input
                label="REF. Inertia (lbs-in-sec²)"
                name="feed.feed.reflInertia"
                type="number"
                value={localData.feed?.feed?.reflInertia?.toString() || ""}
                disabled={true}
                className="bg-muted"
              />
              <Input
                label="MATCH"
                name="feed.feed.match"
                type="number"
                value={localData.feed?.feed?.match?.toString() || ""}
                disabled={true}
                customBackgroundColor={statusColors.matchCheck}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Peak Torque (lbs-in)"
              name="feed.feed.torque.peak"
              type="number"
              value={localData.feed?.feed?.torque?.peak?.toString() || ""}
              disabled={true}
              customBackgroundColor={statusColors.peakTorqueCheck}
            />
            <Input
              label="RMS Torque (FA1) (lbs-in)"
              name="feed.feed.torque.rms.feedAngle1"
              type="number"
              value={localData.feed?.feed?.torque?.rms?.feedAngle1?.toString() || ""}
              disabled={true}
              customBackgroundColor={statusColors.rmsTorqueFA1Check}
            />
            <Input
              label="RMS Torque (FA2) (lbs-in)"
              name="feed.feed.torque.rms.feedAngle2"
              type="number"
              value={localData.feed?.feed?.torque?.rms?.feedAngle2?.toString() || ""}
              disabled={true}
              customBackgroundColor={statusColors.rmsTorqueFA2Check}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Acceleration Torque (lbs-in)"
              name="feed.feed.torque.acceleration"
              type="number"
              value={localData.feed?.feed?.torque?.acceleration?.toString() || ""}
              disabled={true}
              customBackgroundColor={statusColors.accelerationCheck}
            />
          </div>
        </div>
      )}

      {/* Basic torque display for non-advanced controls */}
      {!showAdvancedTorque && (
        <div className="grid grid-cols-4 gap-4">
          <Input
            label="MATCH"
            name="feed.feed.match"
            type="number"
            value={localData.feed?.feed?.match?.toString() || ""}
            disabled={true}
            customBackgroundColor={statusColors.matchCheck}
          />
          <Input
            label="Peak Torque (lbs-in)"
            name="feed.feed.torque.peak"
            type="number"
            value={localData.feed?.feed?.torque?.peak?.toString() || ""}
            disabled={true}
            customBackgroundColor={statusColors.peakTorqueCheck}
          />
          <Input
            label="RMS Torque (FA1) (lbs-in)"
            name="feed.feed.torque.rms.feedAngle1"
            type="number"
            value={localData.feed?.feed?.torque?.rms?.feedAngle1?.toString() || ""}
            disabled={true}
            customBackgroundColor={statusColors.rmsTorqueFA1Check}
          />
          <Input
            label="Acceleration Torque (lbs-in)"
            name="feed.feed.torque.acceleration"
            type="number"
            value={localData.feed?.feed?.torque?.acceleration?.toString() || ""}
            disabled={true}
            customBackgroundColor={statusColors.accelerationCheck}
          />
        </div>
      )}
    </div>
  ), [localData, handleFieldChange, isEditing, motorOptions, ampOptions, showAdvancedTorque, statusColors]);

  // Pull-through fields
  const pullThruFields = useMemo(() => (
    <div className="space-y-4">
      {sigma5Fields}

      <Card className="mt-4 p-4">
        <Text as="h4" className="text-lg font-semibold mb-4">Pull-Through Configuration</Text>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Center Distance (in)"
            name="feed.feed.pullThru.centerDistance"
            type="number"
            value={localData.feed?.feed?.pullThru?.centerDistance?.toString() || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
          <Input
            label="Yield Strength (psi)"
            name="feed.feed.pullThru.yieldStrength"
            type="number"
            value={localData.feed?.feed?.pullThru?.yieldStrength?.toString() || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
          <Input
            label="K-Constant"
            name="feed.feed.pullThru.kConst"
            type="number"
            value={localData.feed?.feed?.pullThru?.kConst?.toString() || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
          <Select
            label="Straightener Pinch Rolls"
            name="feed.feed.pullThru.pinchRolls"
            value={localData.feed?.feed?.pullThru?.pinchRolls?.toString() || ""}
            onChange={handleFieldChange}
            options={STRAIGHTENER_ROLLS_OPTIONS}
            placeholder="Select rolls..."
            disabled={!isEditing}
          />
        </div>
      </Card>
    </div>
  ), [sigma5Fields, localData, handleFieldChange, isEditing]);

  // Allen Bradley fields
  const allenBradleyFields = useMemo(() => (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 p-4 rounded">
        <Text as="h4" className="mb-2 font-medium text-blue-800">Allen Bradley MPL Feed System</Text>
        <Text className="text-sm text-blue-700 mb-4">
          Advanced servo-driven feed system with precision control and monitoring capabilities.
        </Text>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <Select
            label="Allen Bradley Motor"
            name="feed.feed.motor"
            value={localData.feed?.feed?.motor || ""}
            onChange={handleFieldChange}
            options={motorOptions}
            placeholder="Select motor..."
            disabled={!isEditing}
          />
          <Select
            label="Allen Bradley AMP/Drive"
            name="feed.feed.amp"
            value={localData.feed?.feed?.amp || ""}
            onChange={handleFieldChange}
            options={ampOptions}
            placeholder="Select amp/drive..."
            disabled={!isEditing}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Select
            label="STR Max Speed (ft/min)"
            name="feed.feed.strMaxSpeed"
            value={localData.feed?.feed?.strMaxSpeed?.toString() || ""}
            onChange={handleFieldChange}
            options={STR_FEED_RATE_OPTIONS}
            placeholder="Select speed..."
            disabled={!isEditing}
            className="bg-white"
          />
          <Input
            label="Acceleration Rate (ft/sec²)"
            name="feed.feed.accelerationRate"
            type="number"
            value={localData.feed?.feed?.accelerationRate?.toString() || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
            className="bg-white"
          />
          <Input
            label="Default Accel (ft/sec²)"
            name="feed.feed.defaultAcceleration"
            type="number"
            value={localData.feed?.feed?.defaultAcceleration?.toString() || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
            className="bg-white"
          />
        </div>
      </div>

      {/* Standard fields that apply to Allen Bradley */}
      <div className="grid grid-cols-4 gap-4">
        <Input
          label="Friction in Die (lbs)"
          name="feed.feed.frictionInDie"
          type="number"
          value={localData.feed?.feed?.frictionInDie?.toString() || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Chart Minimum Length (in)"
          name="feed.feed.chartMinLength"
          type="number"
          value={localData.feed?.feed?.chartMinLength?.toString() || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Length Increment (in)"
          name="feed.feed.lengthIncrement"
          type="number"
          value={localData.feed?.feed?.lengthIncrement?.toString() || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Select
          label="Feed Angle 1 (Deg)"
          name="feed.feed.feedAngle1"
          value={localData.feed?.feed?.feedAngle1?.toString() || ""}
          onChange={handleFieldChange}
          options={FEED_ANGLE_OPTIONS}
          placeholder="Select angle..."
          disabled={!isEditing}
        />
      </div>

      {/* Allen Bradley specific calculated fields */}
      <div className="bg-gray-50 border border-gray-200 p-4 rounded">
        <Text as="h4" className="mb-2 font-medium text-gray-800">Calculated Performance</Text>
        <div className="grid grid-cols-4 gap-4">
          <Input
            label="Peak Torque (lbs-in)"
            name="feed.feed.torque.peak"
            type="number"
            value={localData.feed?.feed?.torque?.peak?.toString() || ""}
            disabled={true}
            className="bg-muted"
            customBackgroundColor={statusColors.peakTorqueCheck}
          />
          <Input
            label="RMS Torque (lbs-in)"
            name="feed.feed.torque.rms.motor"
            type="number"
            value={localData.feed?.feed?.torque?.rms?.motor?.toString() || ""}
            disabled={true}
            className="bg-muted"
          />
          <Input
            label="Max Velocity (ft/min)"
            name="common.equipment.feed.maxVelocity"
            type="number"
            value={localData.common?.equipment?.feed?.maximumVelocity?.toString() || ""}
            disabled={true}
            className="bg-muted"
          />
          <Input
            label="Feed Check"
            name="feed.feed.feedCheck"
            value={localData.feed?.feed?.feedCheck || ""}
            disabled={true}
            className="bg-muted"
            customBackgroundColor={statusColors.feedCheck}
          />
        </div>
      </div>

      {/* Advanced Allen Bradley features if enabled */}
      {showAdvancedTorque && (
        <div className="bg-green-50 border border-green-200 p-4 rounded">
          <Text as="h4" className="mb-2 font-medium text-green-800">Advanced Allen Bradley Features</Text>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Text className="text-sm font-medium">Motion Control</Text>
              <ul className="text-xs text-green-700 space-y-1">
                <li>• Integrated Safety (SIL 3)</li>
                <li>• Cam Profile Programming</li>
                <li>• Electronic Gearing</li>
              </ul>
            </div>
            <div className="space-y-2">
              <Text className="text-sm font-medium">Diagnostics</Text>
              <ul className="text-xs text-green-700 space-y-1">
                <li>• Real-time Monitoring</li>
                <li>• Predictive Maintenance</li>
                <li>• Load Analysis</li>
              </ul>
            </div>
            <div className="space-y-2">
              <Text className="text-sm font-medium">Integration</Text>
              <ul className="text-xs text-green-700 space-y-1">
                <li>• EtherNet/IP Communication</li>
                <li>• HMI Interface</li>
                <li>• Data Logging</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  ), [localData, handleFieldChange, isEditing, motorOptions, ampOptions, showAdvancedTorque, statusColors]);

  // Feed specifications section
  const feedSpecsSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h4" className="mb-4 text-lg font-medium">Feed Specifications</Text>

      {feedControlsMapping.showSigma5Fields && sigma5Fields}
      {feedType === "sigma-5-pull-thru" && pullThruFields}
      {feedControlsMapping.showAllenBradleyFields && allenBradleyFields}

      {!feedControlsMapping.showSigma5Fields && !feedControlsMapping.showAllenBradleyFields && (
        <div className="bg-gray-50 border border-gray-200 p-4 rounded text-center">
          <Text className="text-gray-600">
            Please select a Controls Level in the Material Specs page to configure feed specifications.
          </Text>
        </div>
      )}
    </Card>
  ), [feedControlsMapping, feedType, sigma5Fields, pullThruFields, allenBradleyFields]);

  // Feed length table section
  const feedLengthTableSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h4" className="mb-4 text-lg font-medium">Feed Length & Speed Settings</Text>

      <div className="grid grid-cols-3 gap-6">
        <div>
          <Text as="h4" className="font-medium mb-2">Average</Text>
          <div className="space-y-2">
            <Input
              label="Length"
              name="common.feedRates.average.length"
              type="number"
              value={localData.common?.feedRates?.average?.length?.toString() || ""}
              onChange={handleFieldChange}
              disabled={!isEditing}
            />
            <Input
              label="SPM"
              name="common.feedRates.average.spm"
              type="number"
              value={localData.common?.feedRates?.average?.spm?.toString() || ""}
              onChange={handleFieldChange}
              disabled={!isEditing}
            />
            <Input
              label="FPM"
              name="common.feedRates.average.fpm"
              type="number"
              value={localData.common?.feedRates?.average?.fpm?.toString() || ""}
              disabled={true}
              className="bg-muted"
            />
          </div>
        </div>

        <div>
          <Text as="h4" className="font-medium mb-2">Maximum</Text>
          <div className="space-y-2">
            <Input
              label="Length"
              name="common.feedRates.max.length"
              type="number"
              value={localData.common?.feedRates?.max?.length?.toString() || ""}
              onChange={handleFieldChange}
              disabled={!isEditing}
            />
            <Input
              label="SPM"
              name="common.feedRates.max.spm"
              type="number"
              value={localData.common?.feedRates?.max?.spm?.toString() || ""}
              onChange={handleFieldChange}
              disabled={!isEditing}
            />
            <Input
              label="FPM"
              name="common.feedRates.max.fpm"
              type="number"
              value={localData.common?.feedRates?.max?.fpm?.toString() || ""}
              disabled={true}
              className="bg-muted"
            />
          </div>
        </div>

        <div>
          <Text as="h4" className="font-medium mb-2">Minimum</Text>
          <div className="space-y-2">
            <Input
              label="Length"
              name="common.feedRates.min.length"
              type="number"
              value={localData.common?.feedRates?.min?.length?.toString() || ""}
              onChange={handleFieldChange}
              disabled={!isEditing}
            />
            <Input
              label="SPM"
              name="common.feedRates.min.spm"
              type="number"
              value={localData.common?.feedRates?.min?.spm?.toString() || ""}
              onChange={handleFieldChange}
              disabled={!isEditing}
            />
            <Input
              label="FPM"
              name="common.feedRates.min.fpm"
              type="number"
              value={localData.common?.feedRates?.min?.fpm?.toString() || ""}
              disabled={true}
              className="bg-muted"
            />
          </div>
        </div>
      </div>
    </Card>
  ), [localData, handleFieldChange, isEditing]);

  // Performance results table section with memory optimization
  const performanceResultsSection = useMemo(() => {
    const tableData = localData.feed?.feed?.tableValues || [];


    const initLength = tableData[0]?.length || 0;
    const lengthRows = [initLength, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 68, 72, 76, 80, 84, 88, 92];

    // Skip memory optimization for now to fix the hooks error
    const optimizedLengthRows = lengthRows;

    // Prepare data for VirtualTable
    const virtualTableData = optimizedLengthRows.map((length) => {
      const rowData = tableData.find((row: TableRowData) => row.length === length);
      return {
        id: length,
        length: rowData?.length || length,
        spm_at_fa1: rowData?.spm_at_fa1 || "#N/A",
        fpm_fa1: rowData?.fpm_fa1 || "#N/A",
        spm_at_fa2: rowData?.spm_at_fa2 || "#N/A",
        fpm_fa2: rowData?.fpm_fa2 || "#N/A",
      };
    });

    const columns = [
      {
        key: 'length',
        header: 'Length',
        className: 'text-center text-black dark:text-white',
        headerClassName: 'bg-muted !text-black dark:!text-white border border-border',
        render: (value: any) => <span className="text-black dark:text-white">{value}</span>
      },
      {
        key: 'spm_at_fa1',
        header: `SPM @ ${ANGLES.FEED_ANGLE_180}°`,
        className: 'text-center text-black dark:text-white',
        headerClassName: 'bg-muted !text-black dark:!text-white border border-border',
        render: (value: any) => <span className="text-black dark:text-white">{value}</span>
      },
      {
        key: 'fpm_fa1',
        header: 'FPM',
        className: 'text-center text-black dark:text-white',
        headerClassName: 'bg-muted !text-black dark:!text-white border border-border',
        render: (value: any) => <span className="text-black dark:text-white">{value}</span>
      },
      {
        key: 'spm_at_fa2',
        header: `SPM @ ${ANGLES.FEED_ANGLE_240}°`,
        className: 'text-center text-black dark:text-white',
        headerClassName: 'bg-muted !text-black dark:!text-white border border-border',
        render: (value: any) => <span className="text-black dark:text-white">{value}</span>
      },
      {
        key: 'fpm_fa2',
        header: 'FPM',
        className: 'text-center text-black dark:text-white',
        headerClassName: 'bg-muted !text-black dark:!text-white border border-border',
        render: (value: any) => <span className="text-black dark:text-white">{value}</span>
      },
    ];

    return (
      <Card className="mb-4 p-4">
        <Text as="h4" className="mb-4 text-lg font-medium">Performance Results</Text>
        <VirtualTable
          data={virtualTableData}
          columns={columns}
          rowHeight={40}
          height={400}
          className="border border-border bg-muted"
          headerClassName="bg-muted !text-black dark:!text-white"
          rowClassName="bg-muted border-b border-border"
        />
      </Card>
    );
  }, [localData]);

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
          <span className="text-red-800">
            Error: {error}
          </span>
        </div>
      )}

      {/* Form sections */}
      {headerSection}
      {feedConfigSection}
      {materialInfoSection}
      {feedSpecsSection}
      {feedLengthTableSection}
      {performanceResultsSection}
    </div>
  );
};

export default Feed;
