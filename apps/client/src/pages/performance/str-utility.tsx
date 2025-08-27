import { useMemo } from "react";
import { useParams } from "react-router-dom";
import Card from "@/components/common/card";
import Input from "@/components/common/input";
import Select from "@/components/common/select";
import Text from "@/components/common/text";
import { PerformanceData } from "@/contexts/performance.context";
import { 
  STR_MODEL_OPTIONS,
  STR_WIDTH_OPTIONS,
  PAYOFF_OPTIONS,
  MATERIAL_TYPE_OPTIONS,
  YES_NO_OPTIONS,
  STR_HORSEPOWER_OPTIONS,
  STR_FEED_RATE_OPTIONS,
} from "@/utils/select-options";
import { usePerformanceDataService } from "@/utils/performance-service";

export interface StrUtilityProps {
  data: PerformanceData;
  isEditing: boolean;
}

const StrUtility: React.FC<StrUtilityProps> = ({ data, isEditing }) => {
  const { id: performanceSheetId } = useParams();
  
  // Use the performance data service
  const dataService = usePerformanceDataService(data, performanceSheetId, isEditing);
  const { state, handleFieldChange, getFieldValue, hasFieldError, getFieldError } = dataService;
  const { localData, fieldErrors, isDirty, lastSaved, isLoading, error } = state;

  // Checks
  const requiredForceCheck = data.strUtility?.straightener?.required?.jackForceCheck === "OK" ? "var(--color-success)" : "var(--color-error)";
  const pinchRollCheck = data.strUtility?.straightener?.required?.pinchRollCheck === "OK" ? "var(--color-success)" : "var(--color-error)";
  const strRollCheck = data.strUtility?.straightener?.required?.strRollCheck === "OK" ? "var(--color-success)" : "var(--color-error)";
  const horsepowerCheck = data.strUtility?.straightener?.required?.horsepowerCheck === "OK" ? "var(--color-success)" : "var(--color-error)";
  const backupRollsCheck = data.strUtility?.straightener?.required?.backupRollsCheck === "OK" ? "var(--color-success)" : "var(--color-warning)";
  const fpmCheck = data.strUtility?.straightener?.required?.fpmCheck === "OK" ? "var(--color-success)" : "var(--color-error)";
  const yieldMet = data.reelDrive?.reel?.reelDriveOK === "OK" ? "var(--color-success)" : "var(--color-error)";
  const feedRateCheck = data.strUtility?.straightener?.required?.feedRateCheck === "OK" ? "var(--color-success)" : "var(--color-error)";  

  // Status calculation functions
  const statusCalculations = useMemo(() => {
    const getJackForceStatus = () => {
      const required = Number(localData.strUtility?.straightener?.required?.force || 0);
      const available = Number(localData.strUtility?.straightener?.jackForceAvailable || 0);
      return {
        status: required <= available ? "JACK FORCE OK" : "JACK FORCE INSUFFICIENT",
        isOk: required <= available
      };
    };

    const getPinchGearStatus = () => {
      const requiredTorque = Number(localData.strUtility?.straightener?.rolls?.pinch?.requiredGearTorque || 0);
      const ratedTorque = Number(localData.strUtility?.straightener?.rolls?.pinch?.ratedTorque || 0);
      return {
        status: requiredTorque <= ratedTorque ? "PINCH GEAR OK" : "PINCH GEAR INSUFFICIENT",
        isOk: requiredTorque <= ratedTorque
      };
    };

    const getStrGearStatus = () => {
      const requiredTorque = Number(localData.strUtility?.straightener?.rolls?.straightener?.requiredGearTorque || 0);
      const ratedTorque = Number(localData.strUtility?.straightener?.rolls?.straightener?.ratedTorque || 0);
      return {
        status: requiredTorque <= ratedTorque ? "STR GEAR OK" : "STR GEAR INSUFFICIENT",
        isOk: requiredTorque <= ratedTorque
      };
    };

    const getHpStatus = () => {
      const required = Number(localData.strUtility?.straightener?.required?.horsepower || 0);
      const available = Number(localData.strUtility?.straightener?.horsepower || 0);
      return {
        status: required <= available ? "HP SUFFICIENT" : "HP INSUFFICIENT",
        isOk: required <= available
      };
    };

    const getFpmStatus = () => {
      const feedRate = Number(localData.strUtility?.straightener?.feedRate || 0);
      return {
        status: feedRate > 0 ? "FPM SUFFICIENT" : "FPM INSUFFICIENT",
        isOk: feedRate > 0
      };
    };

    return {
      jackForce: getJackForceStatus(),
      pinchGear: getPinchGearStatus(),
      strGear: getStrGearStatus(),
      hp: getHpStatus(),
      fpm: getFpmStatus()
    };
  }, [localData]);

  // Header Information Section
  const headerSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Straightener Selection Utility
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

  // Straightener Specifications Section
  const straightenerSpecsSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Straightener Specifications
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Select
          label="Payoff"
          name="strUtility.straightener.payoff"
          value={localData.strUtility?.straightener?.payoff || ""}
          onChange={handleFieldChange}
          options={PAYOFF_OPTIONS}
          disabled={!isEditing}
        />
        <Select
          label="Str. Model"
          name="common.equipment.straightener.model"
          value={localData.common?.equipment?.straightener?.model || ""}
          onChange={handleFieldChange}
          options={STR_MODEL_OPTIONS}
          disabled={!isEditing}
        />
        <Select
          label="Str. Width (in.)"
          name="common.equipment.straightener.width"
          value={String(localData.common?.equipment?.straightener?.width ?? "")}
          onChange={handleFieldChange}
          options={STR_WIDTH_OPTIONS}
          disabled={!isEditing}
        />
        <Input
          label="No. of Str. Rolls"
          name="common.equipment.straightener.rolls.numberOfRolls"
          type="number"
          value={localData.common?.equipment?.straightener?.numberOfRolls?.toString() || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData, handleFieldChange, isEditing]);

  // Coil Information Section
  const coilInfoSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Coil Information
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Input
          label="Coil Wt. Capacity (lbs)"
          name="strUtility.coil.maxCoilWeight"
          type="number"
          value={localData.strUtility?.coil?.weight?.toString() || ""}
          onChange={handleFieldChange}
          error={getFieldError("strUtility.coil.maxCoilWeight")}
          disabled={!isEditing}
        />
        <Input
          label="Coil ID. (in)"
          name="common.coil.coilID"
          type="number"
          value={localData.common?.coil?.coilID?.toString() || ""}
          onChange={handleFieldChange}
          error={getFieldError("common.coil.coilID")}
          disabled={!isEditing}
        />
        <Input
          label="Coil Width (in)"
          name="common.material.coilWidth"
          type="number"
          value={localData.common?.material?.coilWidth?.toString() || ""}
          onChange={handleFieldChange}
          error={getFieldError("common.material.coilWidth")}
          disabled={!isEditing}
        />
        <Input
          label="Thickness (in)"
          name="common.material.materialThickness"
          type="number"
          value={localData.common?.material?.materialThickness?.toString() || ""}
          onChange={handleFieldChange}
          error={getFieldError("material.materialThickness")}
          disabled={!isEditing}
        />
        <Input
          label="Yield Strength (psi)"
          name="common.material.maxYieldStrength"
          type="number"
          value={localData.common?.material?.maxYieldStrength?.toString() || ""}
          onChange={handleFieldChange}
          error={getFieldError("material.maxYieldStrength")}
          disabled={!isEditing}
        />
        <Select
          label="Material"
          name="common.material.materialType"
          value={localData.common?.material?.materialType || ""}
          onChange={handleFieldChange}
          options={MATERIAL_TYPE_OPTIONS}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData, fieldErrors, handleFieldChange, getFieldError, isEditing]);

  // Operating Parameters Section
  const operatingParamsSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Operating Parameters
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Select
          label="Horse Power (HP)"
          name="strUtility.straightener.horsepower"
          value={String(localData.strUtility?.straightener?.horsepower ?? "")}
          onChange={handleFieldChange}
          options={STR_HORSEPOWER_OPTIONS}
          disabled={!isEditing}
        />
        <Input
          label="Acceleration (ft/sec²)"
          name="strUtility.straightener.acceleration"
          type="number"
          value={localData.strUtility?.straightener?.acceleration?.toString() || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Select
          label="Feed Rate (ft/min)"
          name="strUtility.straightener.feedRate"
          value={String(localData.strUtility?.straightener?.feedRate ?? "")}
          onChange={handleFieldChange}
          options={STR_FEED_RATE_OPTIONS}
          disabled={!isEditing}
        />
        <Select
          label="Auto. Brake Compen."
          name="strUtility.straightener.autoBrakeCompensation"
          value={localData.strUtility?.straightener?.autoBrakeCompensation || ""}
          onChange={handleFieldChange}
          options={YES_NO_OPTIONS}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData, handleFieldChange, isEditing]);

  // Physical Parameters Section
  const physicalParamsSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Physical Parameters
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Input
          label="Str. Roll Dia. (in)"
          name="strUtility.straightener.rolls.straightener.diameter"
          type="number"
          value={localData.strUtility?.straightener?.rolls?.straightener?.diameter?.toString() || ""}
          onChange={handleFieldChange}
          error={getFieldError("strUtility.straightener.rolls.straightener.diameter")}
          disabled={!isEditing}
        />
        <Input
          label="Pinch Roll Dia. (in)"
          name="strUtility.straightener.rolls.pinch.diameter"
          type="number"
          value={localData.strUtility?.straightener?.rolls?.pinch?.diameter?.toString() || ""}
          onChange={handleFieldChange}
          error={getFieldError("strUtility.straightener.rolls.pinch.diameter")}
          disabled={!isEditing}
        />
        <Input
          label="Center Dist. (in)"
          name="strUtility.straightener.centerDistance"
          type="number"
          value={localData.strUtility?.straightener?.centerDistance?.toString() || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Jack Force Avail. (lbs)"
          name="strUtility.straightener.jackForceAvailable"
          type="number"
          value={localData.strUtility?.straightener?.jackForceAvailable?.toString() || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Max. Roll Depth (in)"
          name="strUtility.straightener.rolls.depth.withoutMaterial"
          type="number"
          value={localData.strUtility?.straightener?.rolls?.depth?.withoutMaterial?.toString() || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Modulus (psi)"
          name="strUtility.straightener.modulus"
          type="number"
          value={localData.strUtility?.straightener?.modulus?.toString() || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData, fieldErrors, handleFieldChange, getFieldError, isEditing]);

  // Gears Data Section
  const gearsDataSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Gears Data
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Text as="h4" className="mb-3 text-md font-medium">
            Pinch Roll Gear
          </Text>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="# teeth"
              name="strUtility.straightener.gear.pinchRoll.numberOfTeeth"
              type="number"
              value={localData.strUtility?.straightener?.gear?.pinchRoll?.numberOfTeeth?.toString() || ""}
              onChange={handleFieldChange}
              disabled={!isEditing}
            />
            <Input
              label="DP"
              name="strUtility.straightener.gear.pinchRoll.dp"
              type="number"
              value={localData.strUtility?.straightener?.gear?.pinchRoll?.dp?.toString() || ""}
              onChange={handleFieldChange}
              disabled={!isEditing}
            />
          </div>
        </div>
        <div>
          <Text as="h4" className="mb-3 text-md font-medium">
            Str. Roll Gear
          </Text>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="# teeth"
              name="strUtility.straightener.gear.straightenerRoll.numberOfTeeth"
              type="number"
              value={localData.strUtility?.straightener?.gear?.straightenerRoll?.numberOfTeeth?.toString() || ""}
              onChange={handleFieldChange}
              disabled={!isEditing}
            />
            <Input
              label="DP"
              name="strUtility.straightener.gear.straightenerRoll.dp"
              type="number"
              value={localData.strUtility?.straightener?.gear?.straightenerRoll?.dp?.toString() || ""}
              onChange={handleFieldChange}
              disabled={!isEditing}
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Input
          label="Face Width (in)"
          name="strUtility.straightener.gear.faceWidth"
          type="number"
          value={localData.strUtility?.straightener?.gear?.faceWidth?.toString() || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
        <Input
          label="Cont. Angle (degree)"
          name="strUtility.straightener.gear.contAngle"
          type="number"
          value={localData.strUtility?.straightener?.gear?.contAngle?.toString() || ""}
          onChange={handleFieldChange}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData, handleFieldChange, isEditing]);

  // Calculations Results Section
  const calculationsSection = useMemo(() => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      {/* Force Calculations */}
      <Card className="p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Force Calculations
        </Text>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Required Force (lbs)"
              name="strUtility.straightener.required.force"
              value={localData.strUtility?.straightener?.required?.force?.toString() || ""}
              disabled={true}
            />
            <Input
              label="Rated Force (lbs)"
              name="strUtility.straightener.jackForceAvailable"
              value={localData.strUtility?.straightener?.jackForceAvailable?.toString() || ""}
              disabled={true}
              className="bg-gray-50"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Pinch Roll Req. Torque"
              name="strUtility.straightener.rolls.pinch.requiredGearTorque"
              value={localData.strUtility?.straightener?.rolls?.pinch?.requiredGearTorque?.toString() || ""}
              disabled={true}
              className="bg-gray-50"
            />
            <Input
              label="Pinch Roll Rated Torque"
              name="strUtility.straightener.rolls.pinch.ratedTorque"
              value={localData.strUtility?.straightener?.rolls?.pinch?.ratedTorque?.toString() || ""}
              disabled={true}
              className="bg-gray-50"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Str. Roll Req. Torque"
              name="strUtility.straightener.rolls.straightener.requiredGearTorque"
              value={localData.strUtility?.straightener?.rolls?.straightener?.requiredGearTorque?.toString() || ""}
              disabled={true}
              className="bg-gray-50"
            />
            <Input
              label="Str. Roll Rated Torque"
              name="strUtility.straightener.rolls.straightener.ratedTorque"
              value={localData.strUtility?.straightener?.rolls?.straightener?.ratedTorque?.toString() || ""}
              disabled={true}
              className="bg-gray-50"
            />
          </div>
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Horse Power Required (HP)"
              name="strUtility.straightener.required.horsepower"
              value={localData.strUtility?.straightener?.required?.horsepower?.toString() || ""}
              disabled={true}
              className="bg-gray-50"
            />
          </div>
        </div>
      </Card>

      {/* Additional Calculations */}
      <Card className="p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Additional Calculations
        </Text>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Actual Coil Wt. (lbs)"
              name="strUtility.straightener.actualCoilWeight"
              value={localData.strUtility?.straightener?.actualCoilWeight?.toString() || ""}
              disabled={true}
              className="bg-gray-50"
            />
            <Input
              label="Coil OD. (in)"
              name="strUtility.straightener.coilOD"
              value={localData.strUtility?.straightener?.coilOD?.toString() || ""}
              disabled={true}
              className="bg-gray-50"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Str. Torque (in lbs)"
              name="strUtility.straightener.torque.straightener"
              value={localData.strUtility?.straightener?.torque?.straightener?.toString() || ""}
              disabled={true}
              className="bg-gray-50"
            />
            <Input
              label="Accel. Torque (in lbs)"
              name="strUtility.straightener.torque.acceleration"
              value={localData.strUtility?.straightener?.torque?.acceleration?.toString() || ""}
              disabled={true}
              className="bg-gray-50"
            />
            <Input
              label="Brake Torque (in lbs)"
              name="strUtility.straightener.torque.brake"
              value={localData.strUtility?.straightener?.torque?.brake?.toString() || ""}
              disabled={true}
              className="bg-gray-50"
            />
          </div>
        </div>
      </Card>
    </div>
  ), [localData]);

  // Status Indicators Section
  const statusSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Status & Recommendations
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className={`p-3 rounded text-center font-medium ${
          statusCalculations.jackForce.isOk ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
        }`}>
          <Text className="text-sm">{statusCalculations.jackForce.status}</Text>
          <Text className="text-xs mt-1">Back Up Rolls Recommended</Text>
        </div>
        <div className={`p-3 rounded text-center font-medium ${
          statusCalculations.pinchGear.isOk ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
        }`}>
          <Text className="text-sm">{statusCalculations.pinchGear.status}</Text>
        </div>
        <div className={`p-3 rounded text-center font-medium ${
          statusCalculations.strGear.isOk ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
        }`}>
          <Text className="text-sm">{statusCalculations.strGear.status}</Text>
        </div>
        <div className={`p-3 rounded text-center font-medium ${
          statusCalculations.hp.isOk ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
        }`}>
          <Text className="text-sm">{statusCalculations.hp.status}</Text>
        </div>
        <div className={`p-3 rounded text-center font-medium ${
          statusCalculations.fpm.isOk ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
        }`}>
          <Text className="text-sm">{statusCalculations.fpm.status}</Text>
        </div>
        <div className={`p-3 rounded text-center font-medium ${
          Object.values(statusCalculations).every(calc => calc.isOk) ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          <Text className="text-sm">
            {Object.values(statusCalculations).every(calc => calc.isOk) ? "All Str. Utility OK" : "Review Required"}
          </Text>
        </div>
      </div>
    </Card>
  ), [statusCalculations]);

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
      {straightenerSpecsSection}
      {coilInfoSection}
      {operatingParamsSection}
      {physicalParamsSection}
      {gearsDataSection}
      {calculationsSection}
      {statusSection}
    </div>
  );
};

export default StrUtility;