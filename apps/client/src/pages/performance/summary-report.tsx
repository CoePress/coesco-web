import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { debounce } from "lodash";
import Card from "@/components/common/card";
import Text from "@/components/common/text";
import Input from "@/components/common/input";
import Checkbox from "@/components/common/checkbox";
import { PerformanceData } from "@/contexts/performance.context";
import { useUpdateEntity } from "@/hooks/_base/use-update-entity";
import { useGetEntity } from "@/hooks/_base/use-get-entity";

export interface SummaryReportProps {
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

const SummaryReport: React.FC<SummaryReportProps> = ({ data, isEditing }) => {
  const endpoint = `/performance/sheets`;
  const { loading, error } = useGetEntity(endpoint);
  const { updateEntity, loading: updateLoading, error: updateError } = useUpdateEntity(endpoint);
  const { id: performanceSheetId } = useParams();
  
  // Local state management
  const [localData, setLocalData] = useState<PerformanceData>(data);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Refs for cleanup and debouncing
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingChangesRef = useRef<Record<string, any>>({});

  // Sync with prop data on initial load only
  useEffect(() => {
    if (data && data.referenceNumber && !localData.referenceNumber) {
      setLocalData(data);
    }
  }, [data, localData.referenceNumber]);

  // Helper for checkboxes (convert string/boolean to boolean)
  const boolVal = useCallback((val: any) => val === true || val === "true" || val === "Yes", []);

  // Field mappings for legacy field names
  const fieldMappings = useMemo(() => ({
    customer: "rfq.customer",
    date: "rfq.dates.date",
    reelModel: "reel.model",
    reelWidth: "reel.width",
    backplateDiameter: "reel.backplate.diameter",
    reelMotorization: "reel.motorization.isMotorized",
    singleOrDoubleEnded: "reel.style",
    airClutch: "reel.threadingDrive.airClutch",
    hydThreadingDrive: "reel.threadingDrive.hydThreadingDrive",
    holdDownAssy: "reel.holddown.assy",
    holdDownCylinder: "reel.holddown.cylinder",
    brakeModel: "reel.dragBrake.model",
    brakeQuantity: "reel.dragBrake.quantity",
    driveHorsepower: "reel.motorization.driveHorsepower",
    speed: "reel.motorization.speed",
    accelRate: "reel.motorization.accelRate",
    regenReqd: "reel.motorization.regenRequired",
    straightenerModel: "straightener.model",
    straighteningRolls: "straightener.rolls.straighteningRolls",
    backupRolls: "straightener.rolls.backupRolls",
    payoff: "straightener.payoff",
    straightenerWidth: "straightener.width",
    feedRate: "straightener.feedRate",
    acceleration: "straightener.acceleration",
    horsepower: "straightener.horsepower",
    application: "feed.application",
    model: "feed.model",
    machineWidth: "feed.machineWidth",
    loopPit: "loopPit",
    fullWidthRolls: "feed.fullWidthRolls",
    feedAngle1: "feed.feedAngle1",
    feedAngle2: "feed.feedAngle2",
    pressBedLength: "press.bedLength",
    maximumVelocity: "feed.maximumVelocity",
    acceleration2: "feed.acceleration",
    ratio: "feed.ratio",
    pullThruStraightenerRolls: "feed.pullThru.straightenerRolls",
    pullThruPinchRolls: "feed.pullThru.pinchRolls",
    feedDirection: "feed.direction",
    controlsLevel: "feed.controlsLevel",
    typeOfLine: "feed.typeOfLine",
    passline: "feed.passline",
    lightGauge: "feed.lightGuageNonMarking",
    nonMarking: "feed.nonMarking",
  }), []);

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async (changes: Record<string, any>) => {
      if (!performanceSheetId || !isEditing) return;

      try {
        // Create a deep copy and apply all pending changes
        const updatedData = JSON.parse(JSON.stringify(localData));
        
        Object.entries(changes).forEach(([path, value]) => {
          setNestedValue(updatedData, path, value);
        });

        console.log("Saving Summary changes:", changes);
        
        const response = await updateEntity(performanceSheetId, { data: updatedData });
        
        // Handle any calculated values from backend
        if (response?.data) {
          console.log("Updating summary values from backend response");
          
          setLocalData(prevData => ({
            ...prevData,
            // Update all sections that might have been modified
            common: {
              ...prevData.common,
              customer: response.data.common?.customer || prevData.common?.customer,
              equipment: {
                ...prevData.common?.equipment,
                reel: {
                  ...prevData.common?.equipment?.reel,
                  model: response.data.reel?.model || prevData.common?.equipment?.reel?.model,
                  width: response.data.reel?.width || prevData.common?.equipment?.reel?.width,
                  backplate: {
                    ...prevData.common?.equipment?.reel?.backplate,
                    diameter: response.data.reel?.backplate?.diameter || prevData.common?.equipment?.reel?.backplate?.diameter,
                  },
                },
                straightener: {
                  model: response.data.straightener?.model || prevData.common?.equipment?.straightener?.model,
                  width: response.data.straightener?.width || prevData.common?.equipment?.straightener?.width,
                  numberOfRolls: response.data.straightener?.numberOfRolls || prevData.common?.equipment?.straightener?.numberOfRolls,
                },
                feed: {
                  ...prevData.common?.equipment?.feed,
                  maximumVelocity: response.data.feed?.maximumVelocity || prevData.feed?.feed?.maxVelocity,
                  direction: response.data.feed?.direction || prevData.common?.equipment?.feed?.direction,
                  controlsLevel: response.data.feed?.controlsLevel || prevData.common?.equipment?.feed?.controlsLevel,
                  typeOfLine: response.data.feed?.typeOfLine || prevData.common?.equipment?.feed?.typeOfLine,
                  passline: response.data.feed?.passline || prevData.common?.equipment?.feed?.passline,
                  lightGuageNonMarking: response.data.feed?.lightGuageNonMarking || prevData.common?.equipment?.feed?.lightGuageNonMarking,
                  nonMarking: response.data.feed?.nonMarking || prevData.common?.equipment?.feed?.nonMarking,
                }
              },
            },
            rfq: {
              ...prevData.rfq,
              dates: {
                ...prevData.rfq?.dates,
                date: response.data.rfq?.dates?.date || prevData.rfq?.dates?.date,
              },
            },
            materialSpecs: {
              ...prevData.materialSpecs,
              reel: {
                ...prevData.materialSpecs?.reel,
                style: response.data.reel?.style || prevData.materialSpecs?.reel?.style,
              }
            },
            reelDrive: {
              ...prevData.reelDrive,
              motorization: {
                ...prevData.reelDrive?.reel?.motorization,
                isMotorized: response.data.reel?.motorization?.isMotorized || prevData.reelDrive?.reel?.motorization?.isMotorized,
                driveHorsepower: response.data.reel?.motorization?.driveHorsepower || prevData.reelDrive?.reel?.motorization?.driveHorsepower,
                speed: response.data.reel?.motorization?.speed || prevData.reelDrive?.reel?.motorization?.speed,
                accelRate: response.data.reel?.motorization?.accelRate || prevData.reelDrive?.reel?.motorization?.accelRate,
                regenRequired: response.data.reel?.motorization?.regenRequired || prevData.reelDrive?.reel?.motorization?.regenRequired,
              },
            },
            tddbhd: {
              ...prevData.tddbhd,
              threadingDrive: {
                ...prevData.tddbhd?.reel?.threadingDrive,
                airClutch: response.data.reel?.threadingDrive?.airClutch || prevData.tddbhd?.reel?.threadingDrive?.airClutch,
                hydThreadingDrive: response.data.reel?.threadingDrive?.hydThreadingDrive || prevData.tddbhd?.reel?.threadingDrive?.hydThreadingDrive,
              },
              holddown: {
                ...prevData.tddbhd?.reel?.holddown,
                assy: response.data.reel?.holddown?.assy || prevData.tddbhd?.reel?.holddown?.assy,
                cylinder: response.data.reel?.holddown?.cylinder || prevData.tddbhd?.reel?.holddown?.cylinder,
              },
              dragBrake: {
                ...prevData.tddbhd?.reel?.dragBrake,
                model: response.data.reel?.dragBrake?.model || prevData.tddbhd?.reel?.dragBrake?.model,
                quantity: response.data.reel?.dragBrake?.quantity || prevData.tddbhd?.reel?.dragBrake?.quantity,
              },
            },
            straightener: {
              ...prevData.strUtility?.straightener,
              payoff: response.data.straightener?.payoff || prevData.strUtility?.straightener?.payoff,
              feedRate: response.data.straightener?.feedRate || prevData.strUtility?.straightener?.feedRate,
              acceleration: response.data.straightener?.acceleration || prevData.strUtility?.straightener?.acceleration,
              horsepower: response.data.straightener?.horsepower || prevData.strUtility?.straightener?.horsepower,
            },
            feed: {
              ...prevData.feed,
              application: response.data.feed?.application || prevData.feed?.feed?.application,
              model: response.data.feed?.model || prevData.feed?.feed?.model,
              machineWidth: response.data.feed?.machineWidth || prevData.feed?.feed?.machineWidth,
              fullWidthRolls: response.data.feed?.fullWidthRolls || prevData.feed?.feed?.fullWidthRolls,
              feedAngle1: response.data.feed?.feedAngle1 || prevData.feed?.feed?.feedAngle1,
              feedAngle2: response.data.feed?.feedAngle2 || prevData.feed?.feed?.feedAngle2,
              acceleration: response.data.feed?.acceleration || prevData.feed?.feed?.accelerationRate,
              ratio: response.data.feed?.ratio || prevData.feed?.feed?.ratio,
              loopPit: response.data.loopPit || prevData.feed?.feed?.loopPit,
              pullThru: {
                ...prevData.feed?.feed?.pullThru,
                straightenerRolls: response.data.feed?.pullThru?.straightenerRolls || prevData.feed?.feed?.pullThru?.straightenerRolls,
                pinchRolls: response.data.feed?.pullThru?.pinchRolls || prevData.feed?.feed?.pullThru?.pinchRolls,
              },
            },
            press: {
              ...prevData.feed?.press,
              bedLength: response.data.press?.bedLength || prevData.feed?.press?.bedLength,
            },
          }));
        }

        setLastSaved(new Date());
        setIsDirty(false);
        pendingChangesRef.current = {};
        
      } catch (error) {
        console.error('Error saving Summary:', error);
        setFieldErrors(prev => ({ 
          ...prev, 
          _general: 'Failed to save changes. Please try again.' 
        }));
      }
    }, 1000),
    [performanceSheetId, updateEntity, isEditing, localData]
  );

  // Optimized change handler
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEditing) return;

    const { name, value, type, checked } = e.target;
    const actualValue = type === "checkbox" ? checked : value;

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
      
      // Get the correct path from field mappings or use the name directly
      const fieldPath = fieldMappings[name as keyof typeof fieldMappings] || name;
      const processedValue = type === "checkbox" ? (actualValue ? "true" : "false") : actualValue;
      
      setNestedValue(newData, fieldPath, processedValue);
      
      return newData;
    });

    // Track pending changes
    const fieldPath = fieldMappings[name as keyof typeof fieldMappings] || name;
    const processedValue = type === "checkbox" ? (actualValue ? "true" : "false") : actualValue;
    pendingChangesRef.current[fieldPath] = processedValue;
    setIsDirty(true);

    // Debounce save
    debouncedSave(pendingChangesRef.current);
  }, [isEditing, fieldErrors, fieldMappings, debouncedSave]);

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
        Customer & Date
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Customer"
          name="customer"
          value={localData.common?.customer || ""}
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
  ), [localData, handleChange, isEditing]);

  // Reel section
  const reelSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Reel
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Reel Model"
          name="reelModel"
          value={localData.common?.equipment?.reel?.model || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Reel Width"
          name="reelWidth"
          value={localData.common?.equipment?.reel?.width || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Backplate Diameter"
          name="backplateDiameter"
          value={localData.common?.equipment?.reel?.backplate?.diameter || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Reel Motorization"
          name="reelMotorization"
          value={localData.reelDrive?.reel?.motorization?.isMotorized || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Single or Double Ended"
          name="singleOrDoubleEnded"
          value={localData.materialSpecs?.reel?.style || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData, handleChange, isEditing]);

  // Threading Drive section
  const threadingDriveSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Threading Drive
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Air Clutch"
          name="airClutch"
          value={localData.tddbhd?.reel?.threadingDrive?.airClutch || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Hyd. Threading Drive"
          name="hydThreadingDrive"
          value={localData.tddbhd?.reel?.threadingDrive?.hydThreadingDrive || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData, handleChange, isEditing]);

  // Hold Down section
  const holdDownSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Hold Down
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Hold Down Assy"
          name="holdDownAssy"
          value={localData.tddbhd?.reel?.holddown?.assy || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Hold Down Cylinder"
          name="holdDownCylinder"
          value={localData.tddbhd?.reel?.holddown?.cylinder || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData, handleChange, isEditing]);

  // Drag Brake section
  const dragBrakeSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Drag Brake
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Brake Model"
          name="brakeModel"
          value={localData.tddbhd?.reel?.dragBrake?.model || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Brake Quantity"
          name="brakeQuantity"
          value={localData.tddbhd?.reel?.dragBrake?.quantity || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData, handleChange, isEditing]);

  // Motorized Reel section
  const motorizedReelSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Motorized Reel
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Drive Horsepower"
          name="driveHorsepower"
          value={localData.reelDrive?.reel?.motorization?.driveHorsepower || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Speed (ft/min)"
          name="speed"
          value={localData.reelDrive?.reel?.motorization?.speed || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Accel Rate (ft/sec²)"
          name="accelRate"
          value={localData.reelDrive?.reel?.motorization?.accelRate || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Regen Req'd"
          name="regenReqd"
          value={localData.reelDrive?.reel?.motorization?.regenRequired || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData, handleChange, isEditing]);

  // Powered Straightener section
  const poweredStraightenerSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Powered Straightener
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Straightener Model"
          name="straightenerModel"
          value={localData.common?.equipment?.straightener?.model || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Straightening Rolls"
          name="straighteningRolls"
          value={localData.strUtility?.straightener?.rolls?.straighteningRolls || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Payoff"
          name="payoff"
          value={localData.strUtility?.straightener?.payoff || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Str. Width (in)"
          name="straightenerWidth"
          value={localData.common?.equipment?.straightener?.width || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Feed Rate (ft/min)"
          name="feedRate"
          value={localData.strUtility?.straightener?.feedRate || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Acceleration (ft/sec)"
          name="acceleration"
          value={localData.strUtility?.straightener?.acceleration || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Horsepower (HP)"
          name="horsepower"
          value={localData.strUtility?.straightener?.horsepower || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData, handleChange, isEditing]);

  // Sigma 5 Feed section
  const sigma5FeedSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Sigma 5 Feed
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Application"
          name="application"
          value={localData.feed?.feed?.application || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Model"
          name="model"
          value={localData.feed?.feed?.model || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Machine Width"
          name="machineWidth"
          value={localData.feed?.feed?.machineWidth || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Loop Pit"
          name="loopPit"
          value={localData.feed?.feed?.loopPit || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Full Width Rolls"
          name="fullWidthRolls"
          value={localData.feed?.feed?.fullWidthRolls || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Feed Angle 1"
          name="feedAngle1"
          value={localData.feed?.feed?.feedAngle1 || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Feed Angle 2"
          name="feedAngle2"
          value={localData.feed?.feed?.feedAngle2 || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Press Bed Length"
          name="pressBedLength"
          value={localData.feed?.press?.bedLength || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Maximum Velocity ft/min"
          name="maximumVelocity"
          value={localData.feed?.feed?.maxVelocity || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Acceleration (ft/sec²)"
          name="acceleration2"
          value={localData.feed?.feed?.accelerationRate || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Ratio"
          name="ratio"
          value={localData.feed?.feed?.ratio || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Pull Thru Straightener Rolls"
          name="pullThruStraightenerRolls"
          value={localData.feed?.feed?.pullThru?.straightenerRolls || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Pull Thru Pinch Rolls"
          name="pullThruPinchRolls"
          value={localData.feed?.feed?.pullThru?.pinchRolls || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Feed Direction"
          name="feedDirection"
          value={localData.common?.equipment?.feed?.direction || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Controls Level"
          name="controlsLevel"
          value={localData.common?.equipment?.feed?.controlsLevel || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Type of line"
          name="typeOfLine"
          value={localData.common?.equipment?.feed?.typeOfLine || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Passline"
          name="passline"
          value={localData.common?.equipment?.feed?.passline || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
          <Checkbox
            label="Light Gauge Non-Marking"
            name="lightGauge"
            checked={boolVal(localData.common?.equipment?.feed?.lightGuageNonMarking)}
            onChange={handleChange}
            disabled={!isEditing}
          />
          <Checkbox
            label="Non-Marking"
            name="nonMarking"
            checked={boolVal(localData.common?.equipment?.feed?.nonMarking)}
            onChange={handleChange}
            disabled={!isEditing}
          />
        </div>
      </div>
    </Card>
  ), [localData, boolVal, handleChange, isEditing]);

  // Status indicator component
  const StatusIndicator = () => {
    if (updateLoading) {
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
    <div className="w-full flex flex-1 flex-col p-2 pb-6 gap-2">
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
              {updateLoading ? "Saving changes..." : "Loading..."}
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
      {reelSection}
      {threadingDriveSection}
      {holdDownSection}
      {dragBrakeSection}
      {motorizedReelSection}
      {poweredStraightenerSection}
      {sigma5FeedSection}
    </div>
  );
};

export default SummaryReport;