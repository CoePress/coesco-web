import { useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { PerformanceData } from "@/contexts/performance.context";
import { usePerformanceDataService } from "@/utils/performance-sheet";
import { Card, Input, Text } from "@/components";
import Checkbox from "@/components/_old/checkbox";
import { ANGLES } from "../../constants/performance";

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

export interface SummaryReportProps {
  data: PerformanceData;
  isEditing: boolean;
}

const SummaryReport: React.FC<SummaryReportProps> = ({ data, isEditing }) => {
  const { id: performanceSheetId } = useParams();

  const dataService = usePerformanceDataService(data, performanceSheetId, isEditing);
  const { state, handleFieldChange } = dataService;
  const { localData, fieldErrors, isDirty, lastSaved, isLoading, error } = state;

  // Helper for checkboxes (convert string/boolean to boolean)
  const boolVal = useCallback((val: unknown) => val === true || val === "true" || val === "Yes", []);

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

  // Reel section
  const reelSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Reel
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Reel Model"
          name="common.equipment.reel.model"
          value={localData.common?.equipment?.reel?.model || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Reel Width"
          name="common.equipment.reel.width"
          value={localData.common?.equipment?.reel?.width || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Backplate Diameter"
          name="common.equipment.reel.backplate.diameter"
          value={localData.common?.equipment?.reel?.backplate?.diameter || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Reel Motorization"
          name="reelDrive.reel.motorization.isMotorized"
          value={localData.reelDrive?.reel?.motorization?.isMotorized || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Single or Double Ended"
          name="materialSpecs.reel.style"
          value={localData.materialSpecs?.reel?.style || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData, handleFieldChange, isEditing]);

  // Threading Drive section
  const threadingDriveSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Threading Drive
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Air Clutch"
          name="tddbhd.reel.threadingDrive.airClutch"
          value={localData.tddbhd?.reel?.threadingDrive?.airClutch || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Hyd. Threading Drive"
          name="tddbhd.reel.threadingDrive.hydThreadingDrive"
          value={localData.tddbhd?.reel?.threadingDrive?.hydThreadingDrive || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData, handleFieldChange, isEditing]);

  // Hold Down section
  const holdDownSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Hold Down
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Hold Down Assy"
          name="tddbhd.reel.holddown.assy"
          value={localData.tddbhd?.reel?.holddown?.assy || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Hold Down Cylinder"
          name="tddbhd.reel.holddown.cylinder"
          value={localData.tddbhd?.reel?.holddown?.cylinderPressure || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData, handleFieldChange, isEditing]);

  // Drag Brake section
  const dragBrakeSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Drag Brake
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Brake Model"
          name="tddbhd.reel.dragBrake.model"
          value={localData.tddbhd?.reel?.dragBrake?.model || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Brake Quantity"
          name="tddbhd.reel.dragBrake.quantity"
          value={localData.tddbhd?.reel?.dragBrake?.quantity || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData, handleFieldChange, isEditing]);

  // Motorized Reel section
  const motorizedReelSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Motorized Reel
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Drive Horsepower"
          name="reelDrive.reel.motorization.driveHorsepower"
          value={localData.reelDrive?.reel?.motorization?.driveHorsepower || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Speed (ft/min)"
          name="reelDrive.reel.motorization.speed"
          value={localData.reelDrive?.reel?.motorization?.speed || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Accel Rate (ft/sec²)"
          name="reelDrive.reel.motorization.accelRate"
          value={localData.reelDrive?.reel?.motorization?.accelRate || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Regen Req'd"
          name="reelDrive.reel.motorization.regenRequired"
          value={localData.reelDrive?.reel?.motorization?.regenRequired || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData, handleFieldChange, isEditing]);

  // Powered Straightener section
  const poweredStraightenerSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Powered Straightener
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Straightener Model"
          name="common.equipment.straightener.model"
          value={localData.common?.equipment?.straightener?.model || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Straightening Rolls"
          name="common.equipment.straightener.numberOfRolls"
          value={localData.common?.equipment?.straightener?.numberOfRolls?.toString() || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Payoff"
          name="strUtility.straightener.payoff"
          value={localData.strUtility?.straightener?.payoff || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Str. Width (in)"
          name="common.equipment.straightener.width"
          value={localData.common?.equipment?.straightener?.width || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Feed Rate (ft/min)"
          name="strUtility.straightener.feedRate"
          value={localData.strUtility?.straightener?.feedRate || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Acceleration (ft/sec)"
          name="strUtility.straightener.acceleration"
          value={localData.strUtility?.straightener?.acceleration || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Horsepower (HP)"
          name="strUtility.straightener.horsepower"
          value={localData.strUtility?.straightener?.horsepower || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData, handleFieldChange, isEditing]);

  // Sigma 5 Feed section
  const sigma5FeedSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Sigma 5 Feed
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Application"
          name="feed.feed.application"
          value={localData.feed?.feed?.application || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Model"
          name="feed.feed.model"
          value={localData.common?.equipment?.feed?.model || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Machine Width"
          name="feed.feed.machineWidth"
          value={localData.feed?.feed?.machineWidth || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Loop Pit"
          name="feed.feed.loopPit"
          value={localData.common?.equipment?.feed?.loopPit || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Full Width Rolls"
          name="feed.feed.fullWidthRolls"
          value={localData.feed?.feed?.fullWidthRolls || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Feed Angle 1"
          name="feed.feed.feedAngle1"
          value={localData.feed?.feed?.feedAngle1 || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Feed Angle 2"
          name="feed.feed.feedAngle2"
          value={localData.feed?.feed?.feedAngle2 || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Press Bed Length"
          name="feed.press.bedLength"
          value={localData.common?.press?.bedLength || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Maximum Velocity ft/min"
          name="feed.feed.maxVelocity"
          value={localData.common?.equipment?.feed?.maximumVelocity || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Acceleration (ft/sec²)"
          name="feed.feed.accelerationRate"
          value={localData.feed?.feed?.accelerationRate || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Ratio"
          name="feed.feed.ratio"
          value={localData.feed?.feed?.ratio || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Pull Thru Straightener Rolls"
          name="feed.feed.pullThru.straightenerRolls"
          value={localData.feed?.feed?.pullThru?.straightenerRolls || "N/A"}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Pull Thru Pinch Rolls"
          name="feed.feed.pullThru.pinchRolls"
          value={localData.feed?.feed?.pullThru?.pinchRolls || "N/A"}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Feed Direction"
          name="common.equipment.feed.direction"
          value={localData.common?.equipment?.feed?.direction || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Controls Level"
          name="common.equipment.feed.controlsLevel"
          value={localData.common?.equipment?.feed?.controlsLevel || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Type of line"
          name="common.equipment.feed.typeOfLine"
          value={localData.common?.equipment?.feed?.typeOfLine || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Passline"
          name="common.equipment.feed.passline"
          value={localData.common?.equipment?.feed?.passline || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
          <Checkbox
            label="Light Gauge Non-Marking"
            name="common.equipment.feed.lightGuageNonMarking"
            checked={boolVal(localData.common?.equipment?.feed?.lightGuageNonMarking)}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
          <Checkbox
            label="Non-Marking"
            name="common.equipment.feed.nonMarking"
            checked={boolVal(localData.common?.equipment?.feed?.nonMarking)}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
        </div>
      </div>
    </Card>
  ), [localData, boolVal, handleFieldChange, isEditing]);

  // Performance results table section
  const performanceResultsSection = useMemo(() => {
    const tableData = localData.feed?.feed?.tableValues || [];

    return (
      <Card className="mb-4 p-4">
        <Text as="h4" className="mb-4 text-lg font-medium">Performance Results</Text>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-border">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border p-2 text-black dark:text-white">Length</th>
                <th className="border border-border p-2 text-black dark:text-white">SPM @ {ANGLES.FEED_ANGLE_180}°</th>
                <th className="border border-border p-2 text-black dark:text-white">FPM</th>
                <th className="border border-border p-2 text-black dark:text-white">SPM @ {ANGLES.FEED_ANGLE_240}°</th>
                <th className="border border-border p-2 text-black dark:text-white">FPM</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((rowData: TableRowData, index: number) => (
                <tr key={index} className="bg-muted">
                  <td className="border border-border p-2 text-center text-black dark:text-white">
                    {typeof rowData.length === 'number' ? rowData.length.toFixed(4) : rowData.length || "#N/A"}
                  </td>
                  <td className="border border-border p-2 text-center text-black dark:text-white">
                    {rowData.spm_at_fa1 || "#N/A"}
                  </td>
                  <td className="border border-border p-2 text-center text-black dark:text-white">
                    {rowData.fpm_fa1 || "#N/A"}
                  </td>
                  <td className="border border-border p-2 text-center text-black dark:text-white">
                    {rowData.spm_at_fa2 || "#N/A"}
                  </td>
                  <td className="border border-border p-2 text-center text-black dark:text-white">
                    {rowData.fpm_fa2 || "#N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );
  }, [localData]);

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
    <div className="w-full flex flex-1 flex-col px-2 pb-6 gap-2">
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
      {reelSection}
      {threadingDriveSection}
      {holdDownSection}
      {dragBrakeSection}
      {motorizedReelSection}
      {poweredStraightenerSection}
      {sigma5FeedSection}
      {performanceResultsSection}
    </div>
  );
};

export default SummaryReport;
