import { useMemo } from "react";
import { useParams } from "react-router-dom";
import Card from "@/components/common/card";
import Input from "@/components/common/input";
import Select from "@/components/common/select";
import Text from "@/components/common/text";
import { PerformanceData } from "@/contexts/performance.context";
import { 
  REEL_MODEL_OPTIONS,
  REEL_HORSEPOWER_OPTIONS,
} from "@/utils/select-options";
import { usePerformanceDataService } from "@/utils/performance-service";

export interface ReelDriveProps {
  data: PerformanceData;
  isEditing: boolean;
}

const ReelDrive: React.FC<ReelDriveProps> = ({ data, isEditing }) => {
  const { id: performanceSheetId } = useParams();
  
  // Use the performance data service
  const dataService = usePerformanceDataService(data, performanceSheetId, isEditing);
  const { state, handleFieldChange, getFieldValue, hasFieldError, getFieldError } = dataService;
  const { localData, fieldErrors, isDirty, lastSaved, isLoading, error } = state;

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

  // Model & HP section
  const modelHpSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Model & HP
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Reel Model"
          name="common.equipment.reel.model"
          value={localData.common?.equipment?.reel?.model !== undefined && localData.common?.equipment?.reel?.model !== null ? String(localData.common?.equipment?.reel.model) : ""}
          onChange={handleFieldChange}
          options={REEL_MODEL_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
          disabled={!isEditing}
        />
        <Select
          label="HP"
          name="common.equipment.reel.horsepower"
          value={localData.common?.equipment?.reel?.horsepower !== undefined && localData.common?.equipment?.reel?.horsepower !== null ? String(localData.common?.equipment?.reel.horsepower) : ""}
          onChange={handleFieldChange}
          options={REEL_HORSEPOWER_OPTIONS.map((opt) => ({
            value: String(opt.value),
            label: opt.label,
          }))}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData, handleFieldChange, isEditing]);

  // Reel section
  const reelSection = useMemo(() => (
    <Card className="p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Reel
      </Text>
      <div className="space-y-3">
        <Input
          label="SIZE"
          name="reelDrive.reel.size"
          value={localData.reelDrive?.reel?.size?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="MAX WIDTH"
          name="common.equipment.reel.width"
          value={localData.common?.equipment?.reel?.width?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="BRG. DIST."
          name="reelDrive.reel.bearing.distance"
          value={localData.reelDrive?.reel?.bearing?.distance?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="F. BRG. DIA."
          name="reelDrive.reel.bearing.diameter.front"
          value={localData.reelDrive?.reel?.bearing?.diameter?.front?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="R. BRG. DIA."
          name="reelDrive.reel.bearing.diameter.rear"
          value={localData.reelDrive?.reel?.bearing?.diameter?.rear?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData, handleFieldChange, isEditing]);

  // Mandrel section
  const mandrelSection = useMemo(() => (
    <Card className="p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Mandrel
      </Text>
      <div className="space-y-3">
        <Input
          label="DIAMETER"
          name="reelDrive.reel.mandrel.diameter"
          value={localData.reelDrive?.reel?.mandrel?.diameter?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="LENGTH"
          name="reelDrive.reel.mandrel.length"
          value={localData.reelDrive?.reel?.mandrel?.length?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="MAX RPM"
          name="reelDrive.reel.mandrel.maxRPM"
          value={localData.reelDrive?.reel?.mandrel?.maxRPM?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="RPM FULL"
          name="reelDrive.reel.mandrel.RpmFull"
          value={localData.reelDrive?.reel?.mandrel?.RpmFull?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="WEIGHT"
          name="reelDrive.reel.mandrel.weight"
          value={localData.reelDrive?.reel?.mandrel?.weight?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="INERTIA"
          name="reelDrive.reel.mandrel.inertia"
          value={localData.reelDrive?.reel?.mandrel?.inertia?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="REFL. INERT."
          name="reelDrive.reel.mandrel.reflInertia"
          value={localData.reelDrive?.reel?.mandrel?.reflInertia?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
      </div>
    </Card>
  ), [localData, handleFieldChange, isEditing]);

  // Backplate section
  const backplateSection = useMemo(() => (
    <Card className="p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Backplate
      </Text>
      <div className="space-y-3">
        <Input
          label="DIAMETER"
          name="common.equipment.reel.backplate.diameter"
          value={localData.common?.equipment?.reel?.backplate?.diameter?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="THICKNESS"
          name="reelDrive.reel.backplate.thickness"
          value={localData.reelDrive?.reel?.backplate?.thickness?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="WEIGHT"
          name="reelDrive.reel.backplate.weight"
          value={localData.reelDrive?.reel?.backplate?.weight?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="INERTIA"
          name="reelDrive.reel.backplate.inertia"
          value={localData.reelDrive?.reel?.backplate?.inertia?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="REFL. INERT."
          name="reelDrive.reel.backplate.reflInertia"
          value={localData.reelDrive?.reel?.backplate?.reflInertia?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
      </div>
    </Card>
  ), [localData, handleFieldChange, isEditing]);

  // Coil section
  const coilSection = useMemo(() => (
    <Card className="p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Coil
      </Text>
      <div className="space-y-3">
        <Input
          label="DENSITY"
          name="reelDrive.coil.density"
          value={localData.reelDrive?.coil?.density?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="O.D."
          name="common.coil.maxCoilOD"
          value={localData.common?.coil?.maxCoilOD?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="I.D."
          name="common.coil.coilID"
          value={localData.common?.coil?.coilID?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="WIDTH"
          name="common.material.coilWidth"
          value={localData.common?.material?.coilWidth?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="WEIGHT"
          name="common.coil.maxCoilWeight"
          value={localData.common?.coil?.maxCoilWeight?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="INERTIA"
          name="reelDrive.coil.inertia"
          value={localData.reelDrive?.coil?.inertia?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="REFL. INERT."
          name="reelDrive.coil.reflInertia"
          value={localData.reelDrive?.coil?.reflInertia?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
      </div>
    </Card>
  ), [localData, handleFieldChange, isEditing]);

  // Reducer section
  const reducerSection = useMemo(() => (
    <Card className="p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Reducer
      </Text>
      <div className="space-y-3">
        <Input
          label="RATIO"
          name="reelDrive.reel.reducer.ratio"
          value={localData.reelDrive?.reel?.reducer?.ratio?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="EFFICIENCY"
          name="reelDrive.reel.reducer.efficiency"
          value={localData.reelDrive?.reel?.reducer?.efficiency?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="DRIVING"
          name="reelDrive.reel.reducer.driving"
          value={localData.reelDrive?.reel?.reducer?.driving?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="BACKDRIVING"
          name="reelDrive.reel.reducer.backdriving"
          value={localData.reelDrive?.reel?.reducer?.backdriving?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="INERTIA"
          name="reelDrive.reel.reducer.inertia"
          value={localData.reelDrive?.reel?.reducer?.inertia?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="REFL. INERT."
          name="reelDrive.reel.reducer.reflInertia"
          value={localData.reelDrive?.reel?.reducer?.reflInertia?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
      </div>
    </Card>
  ), [localData, handleFieldChange, isEditing]);

  // Chain section
  const chainSection = useMemo(() => (
    <Card className="p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Chain
      </Text>
      <div className="space-y-3">
        <Input
          label="RATIO"
          name="reelDrive.reel.chain.ratio"
          value={localData.reelDrive?.reel?.chain?.ratio?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="SPRK. O.D."
          name="reelDrive.reel.chain.sprktOD"
          value={localData.reelDrive?.reel?.chain?.sprktOD?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="SPRK. THK."
          name="reelDrive.reel.chain.sprktThickness"
          value={localData.reelDrive?.reel?.chain?.sprktThickness?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="WEIGHT"
          name="reelDrive.reel.chain.weight"
          value={localData.reelDrive?.reel?.chain?.weight?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="INERTIA"
          name="reelDrive.reel.chain.inertia"
          value={localData.reelDrive?.reel?.chain?.inertia?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="REFL. INERT."
          name="reelDrive.reel.chain.reflInertia"
          value={localData.reelDrive?.reel?.chain?.reflInertia?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
      </div>
    </Card>
  ), [localData, handleFieldChange, isEditing]);

  // Total section
  const totalSection = useMemo(() => (
    <Card className="p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Total
      </Text>
      <div className="space-y-3">
        <Input
          label="RATIO"
          name="reelDrive.reel.ratio"
          value={localData.reelDrive?.reel?.ratio?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="TOTAL REFL. INERTIA EMPTY"
          name="reelDrive.reel.totalReflInertia.empty"
          value={localData.reelDrive?.reel?.totalReflInertia?.empty?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="TOTAL REFL. INERTIA FULL"
          name="reelDrive.reel.totalReflInertia.full"
          value={localData.reelDrive?.reel?.totalReflInertia?.full?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
      </div>
    </Card>
  ), [localData]);

  // Motor section
  const motorSection = useMemo(() => (
    <Card className="p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Motor
      </Text>
      <div className="space-y-3">
        <Input
          label="HP"
          name="common.equipment.reel.horsepower"
          value={localData.common?.equipment?.reel?.horsepower?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="INERTIA"
          name="reelDrive.reel.motor.inertia"
          value={localData.reelDrive?.reel?.motor?.inertia?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="BASE RPM"
          name="reelDrive.reel.motor.rpm.base"
          value={localData.reelDrive?.reel?.motor?.rpm?.base?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="RPM FULL"
          name="reelDrive.reel.motor.rpm.full"
          value={localData.reelDrive?.reel?.motor?.rpm?.full?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
      </div>
    </Card>
  ), [localData, handleFieldChange, isEditing]);

  // Friction section
  const frictionSection = useMemo(() => (
    <Card className="p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Friction
      </Text>
      <div className="space-y-3">
        <Input
          label="R. BRG. MAND."
          name="reelDrive.reel.friction.bearing.mandrel.rear"
          value={localData.reelDrive?.reel?.friction?.bearing?.mandrel?.rear?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="F. BRG. MAND."
          name="reelDrive.reel.friction.bearing.mandrel.front"
          value={localData.reelDrive?.reel?.friction?.bearing?.mandrel?.front?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="F. BRG. COIL"
          name="reelDrive.reel.friction.bearing.coil.front"
          value={localData.reelDrive?.reel?.friction?.bearing?.coil?.front?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="TOTAL EMPTY"
          name="reelDrive.reel.friction.bearing.total.empty"
          value={localData.reelDrive?.reel?.friction?.bearing?.total?.empty?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="TOTAL FULL"
          name="reelDrive.reel.friction.bearing.total.full"
          value={localData.reelDrive?.reel?.friction?.bearing?.total?.full?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="REFL. EMPTY"
          name="reelDrive.reel.friction.bearing.refl.empty"
          value={localData.reelDrive?.reel?.friction?.bearing?.refl?.empty?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="REFL. FULL"
          name="reelDrive.reel.friction.bearing.refl.full"
          value={localData.reelDrive?.reel?.friction?.bearing?.refl?.full?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
      </div>
    </Card>
  ), [localData]);

  // Speed & Acceleration section
  const speedAccelSection = useMemo(() => (
    <Card className="p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Speed & Acceleration
      </Text>
      <div className="space-y-3">
        <Input
          label="SPEED"
          name="reelDrive.reel.speed"
          value={localData.reelDrive?.reel?.speed?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="ACCEL RATE"
          name="reelDrive.reel.motorization.accelRate"
          value={localData.reelDrive?.reel?.motorization?.accelRate?.toString() || ""}
          onChange={handleFieldChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="ACCEL TIME"
          name="reelDrive.reel.accelerationTime"
          value={localData.reelDrive?.reel?.accelerationTime?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
      </div>
    </Card>
  ), [localData, handleFieldChange, isEditing]);

  // Torque section
  const torqueSection = useMemo(() => (
    <Card className="p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Torque
      </Text>
      <div className="space-y-3">
        <Input
          label="EMPTY"
          name="reelDrive.reel.torque.empty.torque"
          value={localData.reelDrive?.reel?.torque?.empty?.torque?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="FULL"
          name="reelDrive.reel.torque.full.torque"
          value={localData.reelDrive?.reel?.torque?.full?.torque?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
      </div>
    </Card>
  ), [localData]);

  // HP Req'd section
  const hpReqdSection = useMemo(() => (
    <Card className="p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        HP Req'd
      </Text>
      <div className="space-y-3">
        <Input
          label="EMPTY"
          name="reelDrive.reel.torque.empty.horsepowerRequired"
          value={localData.reelDrive?.reel?.torque?.empty?.horsepowerRequired?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="FULL"
          name="reelDrive.reel.torque.full.horsepowerRequired"
          value={localData.reelDrive?.reel?.torque?.full?.horsepowerRequired?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">OK:</label>
          <span className={`px-2 py-1 rounded text-sm font-semibold ${
            (localData.reelDrive?.reel?.torque?.empty?.horsepowerCheck && localData.reelDrive?.reel?.torque?.full?.horsepowerCheck) 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {(localData.reelDrive?.reel?.torque?.empty?.horsepowerCheck && localData.reelDrive?.reel?.torque?.full?.horsepowerCheck) ? "OK" : "NOT OK"}
          </span>
        </div>
      </div>
    </Card>
  ), [localData]);

  // Regen section
  const regenSection = useMemo(() => (
    <Card className="p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Regen
      </Text>
      <div className="space-y-3">
        <Input
          label="EMPTY"
          name="reelDrive.reel.torque.empty.regen"
          value={localData.reelDrive?.reel?.torque?.empty?.regen?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="FULL"
          name="reelDrive.reel.torque.full.regen"
          value={localData.reelDrive?.reel?.torque?.full?.regen?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Regen:</label>
          <span className={`px-2 py-1 rounded text-sm font-semibold ${
            (localData.reelDrive?.reel?.torque?.empty?.regen || localData.reelDrive?.reel?.torque?.full?.regen) 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {(localData.reelDrive?.reel?.torque?.empty?.regen || localData.reelDrive?.reel?.torque?.full?.regen) ? "YES" : "NO"}
          </span>
        </div>
      </div>
    </Card>
  ), [localData]);

  // Notes section
  const notesSection = useMemo(() => (
    <Card className="p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Notes
      </Text>
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">USE PULLOFF:</label>
          <span className={`px-2 py-1 rounded text-sm font-semibold ${
            localData.reelDrive?.reel?.reelDriveOK 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {localData.reelDrive?.reel?.reelDriveOK ? "NO" : "YES"}
          </span>
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
      {headerSection}
      {modelHpSection}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {reelSection}
        {mandrelSection}
        {backplateSection}
        {coilSection}
        {reducerSection}
        {chainSection}
        {totalSection}
        {motorSection}
        {frictionSection}
        {speedAccelSection}
        {torqueSection}
        {hpReqdSection}
        {regenSection}
        {notesSection}
      </div>
    </div>
  );
};

export default ReelDrive;