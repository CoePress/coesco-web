import { useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  MATERIAL_TYPE_OPTIONS,
  REEL_WIDTH_OPTIONS,
  REEL_MODEL_OPTIONS,
  BACKPLATE_DIAMETER_OPTIONS,
  HYDRAULIC_THREADING_DRIVE_OPTIONS,
  HOLD_DOWN_ASSY_OPTIONS,
  HOLD_DOWN_CYLINDER_OPTIONS,
  BRAKE_MODEL_OPTIONS,
  BRAKE_QUANTITY_OPTIONS,
  usePerformanceDataService,
} from "@/utils/performance-sheet";
import { PerformanceData } from "@/contexts/performance.context";
import { Card, Input, Select, Text } from "@/components";
import Checkbox from "@/components/_old/checkbox";

export interface TDDBHDProps {
  data: PerformanceData;
  isEditing: boolean;
}

const TDDBHD: React.FC<TDDBHDProps> = ({ data, isEditing }) => {
  const { id: performanceSheetId } = useParams();
  const textColor = "var(--color-text)"
  
  const dataService = usePerformanceDataService(data, performanceSheetId, isEditing);
  const { state, handleFieldChange, getFieldValue, hasFieldError, getFieldError } = dataService;
  const { localData, fieldErrors, isDirty, lastSaved, isLoading, error } = state;

  const successColor = 'var(--color-success)';
  const errorColor = 'var(--color-error)';

  // Checks
  let minMaterialWidthCheck = data.tddbhd?.reel?.checks?.minMaterialWidthCheck === "PASS" ? successColor : errorColor;
  let airPressureCheck = data.tddbhd?.reel?.checks?.airPressureCheck === "PASS" ? successColor : errorColor;
  let rewindTorqueCheck = data.tddbhd?.reel?.checks?.rewindTorqueCheck === "PASS" ? successColor : errorColor;
  let holdDownForceCheck = data.tddbhd?.reel?.checks?.holdDownForceCheck === "PASS" ? successColor : errorColor;
  let brakePressCheck = data.tddbhd?.reel?.checks?.brakePressCheck === "PASS" ? successColor : errorColor;
  let torqueRequiredCheck = data.tddbhd?.reel?.checks?.torqueRequiredCheck === "PASS" ? successColor : errorColor;
  let tddbhdCheck = data.tddbhd?.reel?.checks?.tddbhdCheck === "OK" ? successColor : errorColor;

  // Customer and Date Section
  const customerDateSection = useMemo(() => (
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

  // Reel & Material Specs Section
  const reelMaterialSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Reel & Material Specs
      </Text>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <Select
          label="Reel Model"
          name="common.equipment.reel.model"
          value={localData.common?.equipment?.reel?.model?.toString() || ""}
          onChange={handleFieldChange}
          options={REEL_MODEL_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
          disabled={!isEditing}
        />
        <Select
          label="Reel Width"
          name="common.equipment.reel.width"
          value={localData.common?.equipment?.reel?.width?.toString() || ""}
          onChange={handleFieldChange}
          options={REEL_WIDTH_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.Label,
          }))}
          disabled={!isEditing}
        />
        <Select
          label="Backplate Diameter"
          name="common.equipment.reel.backplate.diameter"
          value={localData.common?.equipment?.reel?.backplate?.diameter?.toString() || ""}
          onChange={handleFieldChange}
          options={BACKPLATE_DIAMETER_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.Label,
          }))}
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
          label="Material Width (in)"
          name="common.material.coilWidth"
          value={localData.common?.material?.coilWidth?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          error={getFieldError("common.material.coilWidth")}
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
        <Input
          label="Material Yield Strength (psi)"
          name="common.material.maxYieldStrength"
          value={localData.common?.material?.maxYieldStrength?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          error={getFieldError("common.material.maxYieldStrength")}
          disabled={!isEditing}
        />
        <Input
          label="Air Pressure Available (psi)"
          name="tddbhd.reel.airPressureAvailable"
          value={localData.tddbhd?.reel?.airPressureAvailable?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          error={getFieldError("tddbhd.reel.airPressureAvailable")}
          disabled={!isEditing}
          style={{ backgroundColor: airPressureCheck, color: textColor }}
        />
        <Input
          label="Required Decel. Rate (ft/sec²)"
          name="tddbhd.reel.requiredDecelRate"
          value={localData.tddbhd?.reel?.requiredDecelRate?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData, handleFieldChange, getFieldError, isEditing]);

  // Coil, Brake & Other Specs Section
  const coilBrakeSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Coil, Brake & Other Specs
      </Text>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Input
          label="Coil Weight (lbs)"
          name="tddbhd.coil.coilWeight"
          value={localData.tddbhd?.coil?.coilWeight?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          error={getFieldError("tddbhd.coil.coilWeight")}
          disabled={!isEditing}
        />
        <Input
          label="Coil O.D. (in)"
          name="common.coil.maxCoilOD"
          value={localData.common?.coil?.maxCoilOD?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="Disp. (Reel) Mtr."
          name="tddbhd.reel.dispReelMtr"
          value={localData.tddbhd?.reel?.dispReelMtr?.toString() || ""}
          type="text"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="Web Tension (psi)"
          name="tddbhd.reel.webTension.psi"
          value={localData.tddbhd?.reel?.webTension?.psi?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="Web Tension (lbs)"
          name="tddbhd.reel.webTension.lbs"
          value={localData.tddbhd?.reel?.webTension?.lbs?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="Brake Pad Diameter (in)"
          name="tddbhd.reel.brakePadDiameter"
          value={localData.tddbhd?.reel?.brakePadDiameter?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="Cylinder Bore (in)"
          name="tddbhd.reel.cylinderBore"
          value={localData.tddbhd?.reel?.cylinderBore?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="Coefficient of Friction"
          name="tddbhd.reel.coefficientOfFriction"
          value={localData.tddbhd?.reel?.coefficientOfFriction?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
      </div>
    </Card>
  ), [localData, handleFieldChange, getFieldError, isEditing]);

  // Threading Drive Section
  const threadingDriveSection = useMemo(() => (
    <Card className="p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Threading Drive
      </Text>
      <div className="space-y-4">
        <Input
          label="Air Clutch"
          name="tddbhd.reel.threadingDrive.airClutch"
          value={localData.tddbhd?.reel?.threadingDrive?.airClutch || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Select
          label="Hyd. Threading Drive"
          name="tddbhd.reel.threadingDrive.hydThreadingDrive"
          value={localData.tddbhd?.reel?.threadingDrive?.hydThreadingDrive || ""}
          onChange={handleFieldChange}
          options={HYDRAULIC_THREADING_DRIVE_OPTIONS}
          disabled={!isEditing}
        />
        <Input
          label="Torque At Mandrel (in. lbs.)"
          name="tddbhd.reel.torque.atMandrel"
          value={localData.tddbhd?.reel?.torque?.atMandrel?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="Rewind Torque Req. (in. lbs.)"
          name="tddbhd.reel.torque.rewindRequired"
          value={localData.tddbhd?.reel?.torque?.rewindRequired?.toString() || ""}
          type="number"
          style={{ backgroundColor: rewindTorqueCheck, color: textColor }}
          disabled={true}
        />
        <Input
          label="Passed"
          name="tddbhd.reel.checks.tddbhdCheck"
          value={localData.tddbhd?.reel?.checks?.tddbhdCheck || "NOT OK"}
          style={{ backgroundColor: tddbhdCheck, color: textColor }}
          disabled={true}
        />
      </div>
    </Card>
  ), [localData, handleFieldChange, isEditing]);

  // Hold Down Section
  const holdDownSection = useMemo(() => (
    <Card className="p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Hold Down
      </Text>
      <div className="space-y-4">
        <Select
          label="Hold Down Assy"
          name="tddbhd.reel.holddown.assy"
          value={localData.tddbhd?.reel?.holddown?.assy || ""}
          onChange={handleFieldChange}
          options={HOLD_DOWN_ASSY_OPTIONS}
          disabled={!isEditing}
        />
        <Input
          label="Holddown Pressure (psi)"
          name="tddbhd.reel.holddown.cylinderPressure"
          value={localData.tddbhd?.reel?.holddown?.cylinderPressure?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="Hold Down Force Required (lbs)"
          name="tddbhd.reel.holddown.force.required"
          value={localData.tddbhd?.reel?.holddown?.force?.required?.toString() || ""}
          type="number"
          disabled={true}
          style={{ backgroundColor: holdDownForceCheck, color: textColor }}
        />
        <Input
          label="Hold Down Force Available (lbs)"
          name="tddbhd.reel.holddown.force.available"
          value={localData.tddbhd?.reel?.holddown?.force?.available?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="Min. Material Width (in)"
          name="tddbhd.reel.minMaterialWidth"
          value={localData.tddbhd?.reel?.minMaterialWidth?.toString() || ""}
          type="number"
          disabled={true}
          style={{ backgroundColor: minMaterialWidthCheck, color: textColor }}
        />
        <Checkbox
          label="Confirmed Min Width OK"
          name="tddbhd.reel.confirmedMinWidth"
          checked={Boolean(localData.tddbhd?.reel?.confirmedMinWidth || false)}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData, handleFieldChange, isEditing]);

  // Drag Brake Section
  const dragBrakeSection = useMemo(() => (
    <Card className="p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Drag Brake
      </Text>
      <div className="space-y-4">
        <Select
          label="Brake Model"
          name="tddbhd.reel.dragBrake.model"
          value={localData.tddbhd?.reel?.dragBrake?.model || ""}
          onChange={handleFieldChange}
          options={BRAKE_MODEL_OPTIONS}
          disabled={!isEditing}
        />
        <Select
          label="Brake Quantity"
          name="tddbhd.reel.dragBrake.quantity"
          value={localData.tddbhd?.reel?.dragBrake?.quantity?.toString() || ""}
          onChange={handleFieldChange}
          options={BRAKE_QUANTITY_OPTIONS}
          disabled={!isEditing}
        />
        <Input
          label="Torque Required (in. lbs.)"
          name="tddbhd.reel.torque.required"
          value={localData.tddbhd?.reel?.torque?.required?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="Failsafe - Single Stage (psi air req.)"
          name="tddbhd.reel.dragBrake.psiAirRequired"
          value={localData.tddbhd?.reel?.dragBrake?.psiAirRequired?.toString() || ""}
          type="number"
          disabled={true}
          style={{ backgroundColor: brakePressCheck, color: textColor }}
        />
        <Input
          label="Failsafe Holding Force (in. lbs.)"
          name="tddbhd.reel.dragBrake.holdingForce"
          value={localData.tddbhd?.reel?.dragBrake?.holdingForce?.toString() || ""}
          type="number"
          disabled={true}
          style={{ backgroundColor: torqueRequiredCheck, color: textColor }}
        />
      </div>
    </Card>
  ), [localData, handleFieldChange, isEditing]);

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
      {reelMaterialSection}
      {coilBrakeSection}
      
      {/* Threading Drive and Hold Down */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {threadingDriveSection}
        {holdDownSection}
        {dragBrakeSection}
      </div>
    </div>
  );
};

export default TDDBHD;