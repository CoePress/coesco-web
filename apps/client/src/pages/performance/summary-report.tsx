import { useState, useEffect, useRef } from "react";
import { PerformanceData } from "@/contexts/performance.context";
import Card from "@/components/common/card";
import Text from "@/components/common/text";
import Input from "@/components/common/input";
import Checkbox from "@/components/common/checkbox";
import { useUpdateEntity } from "@/hooks/_base/use-update-entity";
import { useParams } from "react-router-dom";
import { useGetEntity } from "@/hooks/_base/use-get-entity";

export interface SummaryReportProps {
  data: PerformanceData;
  isEditing: boolean;
}

const SummaryReport: React.FC<SummaryReportProps> = ({ data, isEditing }) => {
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

  // Helper for checkboxes (convert string/boolean to boolean)
  const boolVal = (val: any) => val === true || val === "true" || val === "Yes";

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEditing) return;
    
    const { name, value, type, checked } = e.target;
    const actualValue = type === "checkbox" ? checked : value;

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
        current[parts[parts.length - 1]] = type === "checkbox" ? (actualValue ? "true" : "false") : actualValue;
      } else {
        // Handle legacy field names that map to nested structure
        const fieldMappings: { [key: string]: any } = {
          customer: { path: "customer", value: actualValue },
          date: { path: "dates.date", value: actualValue },
          reelModel: { path: "reel.model", value: actualValue },
          reelWidth: { path: "reel.width", value: actualValue },
          backplateDiameter: { path: "reel.backplate.diameter", value: actualValue },
          reelMotorization: { path: "reel.motorization.isMotorized", value: actualValue },
          singleOrDoubleEnded: { path: "reel.style", value: actualValue },
          airClutch: { path: "reel.threadingDrive.airClutch", value: actualValue },
          hydThreadingDrive: { path: "reel.threadingDrive.hydThreadingDrive", value: actualValue },
          holdDownAssy: { path: "reel.holddown.assy", value: actualValue },
          holdDownCylinder: { path: "reel.holddown.cylinder", value: actualValue },
          brakeModel: { path: "reel.dragBrake.model", value: actualValue },
          brakeQuantity: { path: "reel.dragBrake.quantity", value: actualValue },
          driveHorsepower: { path: "reel.motorization.driveHorsepower", value: actualValue },
          speed: { path: "reel.motorization.speed", value: actualValue },
          accelRate: { path: "reel.motorization.accelRate", value: actualValue },
          regenReqd: { path: "reel.motorization.regenRequired", value: actualValue },
          straightenerModel: { path: "straightener.model", value: actualValue },
          straighteningRolls: { path: "straightener.rolls.straighteningRolls", value: actualValue },
          backupRolls: { path: "straightener.rolls.backupRolls", value: actualValue },
          payoff: { path: "straightener.payoff", value: actualValue },
          straightenerWidth: { path: "straightener.width", value: actualValue },
          feedRate: { path: "straightener.feedRate", value: actualValue },
          acceleration: { path: "straightener.acceleration", value: actualValue },
          horsepower: { path: "straightener.horsepower", value: actualValue },
          application: { path: "feed.application", value: actualValue },
          model: { path: "feed.model", value: actualValue },
          machineWidth: { path: "feed.machineWidth", value: actualValue },
          loopPit: { path: "loopPit", value: actualValue },
          fullWidthRolls: { path: "feed.fullWidthRolls", value: actualValue },
          feedAngle1: { path: "feed.feedAngle1", value: actualValue },
          feedAngle2: { path: "feed.feedAngle2", value: actualValue },
          pressBedLength: { path: "press.bedLength", value: actualValue },
          maximumVelocity: { path: "feed.maximumVelocity", value: actualValue },
          acceleration2: { path: "feed.acceleration", value: actualValue },
          ratio: { path: "feed.ratio", value: actualValue },
          pullThruStraightenerRolls: { path: "feed.pullThru.straightenerRolls", value: actualValue },
          pullThruPinchRolls: { path: "feed.pullThru.pinchRolls", value: actualValue },
          feedDirection: { path: "feed.direction", value: actualValue },
          controlsLevel: { path: "feed.controlsLevel", value: actualValue },
          typeOfLine: { path: "feed.typeOfLine", value: actualValue },
          passline: { path: "feed.passline", value: actualValue },
          lightGauge: { path: "feed.lightGuageNonMarking", value: actualValue ? "true" : "false" },
          nonMarking: { path: "feed.nonMarking", value: actualValue ? "true" : "false" },
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
          updatedData[name] = type === "checkbox" ? (actualValue ? "true" : "false") : actualValue;
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
          
          current[parts[parts.length - 1]] = type === "checkbox" ? (actualValue ? "true" : "false") : actualValue;
        } else {
          // Handle legacy field mappings
          const fieldMappings: { [key: string]: any } = {
            customer: { path: "customer", value: actualValue },
            date: { path: "dates.date", value: actualValue },
            reelModel: { path: "reel.model", value: actualValue },
            reelWidth: { path: "reel.width", value: actualValue },
            backplateDiameter: { path: "reel.backplate.diameter", value: actualValue },
            reelMotorization: { path: "reel.motorization.isMotorized", value: actualValue },
            singleOrDoubleEnded: { path: "reel.style", value: actualValue },
            airClutch: { path: "reel.threadingDrive.airClutch", value: actualValue },
            hydThreadingDrive: { path: "reel.threadingDrive.hydThreadingDrive", value: actualValue },
            holdDownAssy: { path: "reel.holddown.assy", value: actualValue },
            holdDownCylinder: { path: "reel.holddown.cylinder", value: actualValue },
            brakeModel: { path: "reel.dragBrake.model", value: actualValue },
            brakeQuantity: { path: "reel.dragBrake.quantity", value: actualValue },
            driveHorsepower: { path: "reel.motorization.driveHorsepower", value: actualValue },
            speed: { path: "reel.motorization.speed", value: actualValue },
            accelRate: { path: "reel.motorization.accelRate", value: actualValue },
            regenReqd: { path: "reel.motorization.regenRequired", value: actualValue },
            straightenerModel: { path: "straightener.model", value: actualValue },
            straighteningRolls: { path: "straightener.rolls.straighteningRolls", value: actualValue },
            backupRolls: { path: "straightener.rolls.backupRolls", value: actualValue },
            payoff: { path: "straightener.payoff", value: actualValue },
            straightenerWidth: { path: "straightener.width", value: actualValue },
            feedRate: { path: "straightener.feedRate", value: actualValue },
            acceleration: { path: "straightener.acceleration", value: actualValue },
            horsepower: { path: "straightener.horsepower", value: actualValue },
            application: { path: "feed.application", value: actualValue },
            model: { path: "feed.model", value: actualValue },
            machineWidth: { path: "feed.machineWidth", value: actualValue },
            loopPit: { path: "loopPit", value: actualValue },
            fullWidthRolls: { path: "feed.fullWidthRolls", value: actualValue },
            feedAngle1: { path: "feed.feedAngle1", value: actualValue },
            feedAngle2: { path: "feed.feedAngle2", value: actualValue },
            pressBedLength: { path: "press.bedLength", value: actualValue },
            maximumVelocity: { path: "feed.maximumVelocity", value: actualValue },
            acceleration2: { path: "feed.acceleration", value: actualValue },
            ratio: { path: "feed.ratio", value: actualValue },
            pullThruStraightenerRolls: { path: "feed.pullThru.straightenerRolls", value: actualValue },
            pullThruPinchRolls: { path: "feed.pullThru.pinchRolls", value: actualValue },
            feedDirection: { path: "feed.direction", value: actualValue },
            controlsLevel: { path: "feed.controlsLevel", value: actualValue },
            typeOfLine: { path: "feed.typeOfLine", value: actualValue },
            passline: { path: "feed.passline", value: actualValue },
            lightGauge: { path: "feed.lightGuageNonMarking", value: actualValue ? "true" : "false" },
            nonMarking: { path: "feed.nonMarking", value: actualValue ? "true" : "false" },
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
            updatedData[name] = type === "checkbox" ? (actualValue ? "true" : "false") : actualValue;
          }
        }

        console.log("Updating with complete data structure:", updatedData);

        // Send to backend (this will also trigger calculations)
        const response = await updateEntity(performanceSheetId, { data: updatedData });
        
        console.log("Backend response:", response);
        
        // Handle updated values directly from the backend response
        if (response && response.data) {
          console.log("Updating summary values from backend response");
          
          setLocalData(prevData => ({
            ...prevData,
            // Update all sections that might have been modified
            customer: response.data.customer || prevData.customer,
            dates: {
              ...prevData.dates,
              date: response.data.dates?.date || prevData.dates?.date,
            },
            reel: {
              ...prevData.reel,
              model: response.data.reel?.model || prevData.reel?.model,
              width: response.data.reel?.width || prevData.reel?.width,
              backplate: {
                ...prevData.reel?.backplate,
                diameter: response.data.reel?.backplate?.diameter || prevData.reel?.backplate?.diameter,
              },
              motorization: {
                ...prevData.reel?.motorization,
                isMotorized: response.data.reel?.motorization?.isMotorized || prevData.reel?.motorization?.isMotorized,
                driveHorsepower: response.data.reel?.motorization?.driveHorsepower || prevData.reel?.motorization?.driveHorsepower,
                speed: response.data.reel?.motorization?.speed || prevData.reel?.motorization?.speed,
                accelRate: response.data.reel?.motorization?.accelRate || prevData.reel?.motorization?.accelRate,
                regenRequired: response.data.reel?.motorization?.regenRequired || prevData.reel?.motorization?.regenRequired,
              },
              style: response.data.reel?.style || prevData.reel?.style,
              threadingDrive: {
                ...prevData.reel?.threadingDrive,
                airClutch: response.data.reel?.threadingDrive?.airClutch || prevData.reel?.threadingDrive?.airClutch,
                hydThreadingDrive: response.data.reel?.threadingDrive?.hydThreadingDrive || prevData.reel?.threadingDrive?.hydThreadingDrive,
              },
              holddown: {
                ...prevData.reel?.holddown,
                assy: response.data.reel?.holddown?.assy || prevData.reel?.holddown?.assy,
                cylinder: response.data.reel?.holddown?.cylinder || prevData.reel?.holddown?.cylinder,
              },
              dragBrake: {
                ...prevData.reel?.dragBrake,
                model: response.data.reel?.dragBrake?.model || prevData.reel?.dragBrake?.model,
                quantity: response.data.reel?.dragBrake?.quantity || prevData.reel?.dragBrake?.quantity,
              },
            },
            straightener: {
              ...prevData.straightener,
              model: response.data.straightener?.model || prevData.straightener?.model,
              payoff: response.data.straightener?.payoff || prevData.straightener?.payoff,
              width: response.data.straightener?.width || prevData.straightener?.width,
              feedRate: response.data.straightener?.feedRate || prevData.straightener?.feedRate,
              acceleration: response.data.straightener?.acceleration || prevData.straightener?.acceleration,
              horsepower: response.data.straightener?.horsepower || prevData.straightener?.horsepower,
              rolls: {
                ...prevData.straightener?.rolls,
                straighteningRolls: response.data.straightener?.rolls?.straighteningRolls || prevData.straightener?.rolls?.straighteningRolls,
                backupRolls: response.data.straightener?.rolls?.backupRolls || prevData.straightener?.rolls?.backupRolls,
              },
            },
            feed: {
              ...prevData.feed,
              application: response.data.feed?.application || prevData.feed?.application,
              model: response.data.feed?.model || prevData.feed?.model,
              machineWidth: response.data.feed?.machineWidth || prevData.feed?.machineWidth,
              fullWidthRolls: response.data.feed?.fullWidthRolls || prevData.feed?.fullWidthRolls,
              feedAngle1: response.data.feed?.feedAngle1 || prevData.feed?.feedAngle1,
              feedAngle2: response.data.feed?.feedAngle2 || prevData.feed?.feedAngle2,
              maximumVelocity: response.data.feed?.maximumVelocity || prevData.feed?.maximumVelocity,
              acceleration: response.data.feed?.acceleration || prevData.feed?.acceleration,
              ratio: response.data.feed?.ratio || prevData.feed?.ratio,
              direction: response.data.feed?.direction || prevData.feed?.direction,
              controlsLevel: response.data.feed?.controlsLevel || prevData.feed?.controlsLevel,
              typeOfLine: response.data.feed?.typeOfLine || prevData.feed?.typeOfLine,
              passline: response.data.feed?.passline || prevData.feed?.passline,
              lightGuageNonMarking: response.data.feed?.lightGuageNonMarking || prevData.feed?.lightGuageNonMarking,
              nonMarking: response.data.feed?.nonMarking || prevData.feed?.nonMarking,
              pullThru: {
                ...prevData.feed?.pullThru,
                straightenerRolls: response.data.feed?.pullThru?.straightenerRolls || prevData.feed?.pullThru?.straightenerRolls,
                pinchRolls: response.data.feed?.pullThru?.pinchRolls || prevData.feed?.pullThru?.pinchRolls,
              },
            },
            press: {
              ...prevData.press,
              bedLength: response.data.press?.bedLength || prevData.press?.bedLength,
            },
            loopPit: response.data.loopPit || prevData.loopPit,
          }));
          
          console.log("Updated summary values:", {
            customer: response.data.customer,
            reelModel: response.data.reel?.model,
            straightenerModel: response.data.straightener?.model,
            feedApplication: response.data.feed?.application,
          });
        }

      } catch (error) {
        console.error('Error updating field:', error);
        setLocalData(data);
      }
    }, 500);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full flex flex-1 flex-col p-2 pb-6 gap-2">
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

      <Card className="mb-0 p-4">
        <Text
          as="h3"
          className="mb-4 text-lg font-medium">
          Customer & Date
        </Text>
        <div className="grid grid-cols-2 gap-6">
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
        </div>
      </Card>

      {/* Reel Section */}
      <Card className="mb-0 p-4">
        <Text
          as="h3"
          className="mb-4 text-lg font-medium">
          Reel
        </Text>
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Reel Model"
            name="reelModel"
            value={localData.reel?.model || ""}
            onChange={handleChange}
          />
          <Input
            label="Reel Width"
            name="reelWidth"
            value={localData.reel?.width || ""}
            onChange={handleChange}
          />
          <Input
            label="Backplate Diameter"
            name="backplateDiameter"
            value={localData.reel?.backplate?.diameter || ""}
            onChange={handleChange}
          />
          <Input
            label="Reel Motorization"
            name="reelMotorization"
            value={localData.reel?.motorization?.isMotorized || ""}
            onChange={handleChange}
          />
          <Input
            label="Single or Double Ended"
            name="singleOrDoubleEnded"
            value={localData.reel?.style || ""}
            onChange={handleChange}
          />
        </div>
      </Card>

      {/* Threading Drive Section */}
      <Card className="mb-0 p-4">
        <Text
          as="h3"
          className="mb-4 text-lg font-medium">
          Threading Drive
        </Text>
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Air Clutch"
            name="airClutch"
            value={localData.reel?.threadingDrive?.airClutch || ""}
            onChange={handleChange}
          />
          <Input
            label="Hyd. Threading Drive"
            name="hydThreadingDrive"
            value={localData.reel?.threadingDrive?.hydThreadingDrive || ""}
            onChange={handleChange}
          />
        </div>
      </Card>

      {/* Hold Down Section */}
      <Card className="mb-0 p-4">
        <Text
          as="h3"
          className="mb-4 text-lg font-medium">
          Hold Down
        </Text>
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Hold Down Assy"
            name="holdDownAssy"
            value={localData.reel?.holddown?.assy || ""}
            onChange={handleChange}
          />
          <Input
            label="Hold Down Cylinder"
            name="holdDownCylinder"
            value={localData.reel?.holddown?.cylinder || ""}
            onChange={handleChange}
          />
        </div>
      </Card>

      {/* Drag Brake Section */}
      <Card className="mb-0 p-4">
        <Text
          as="h3"
          className="mb-4 text-lg font-medium">
          Drag Brake
        </Text>
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Brake Model"
            name="brakeModel"
            value={localData.reel?.dragBrake?.model || ""}
            onChange={handleChange}
          />
          <Input
            label="Brake Quantity"
            name="brakeQuantity"
            value={localData.reel?.dragBrake?.quantity || ""}
            onChange={handleChange}
          />
        </div>
      </Card>

      {/* Motorized Reel Section */}
      <Card className="mb-0 p-4">
        <Text
          as="h3"
          className="mb-4 text-lg font-medium">
          Motorized Reel
        </Text>
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Drive Horsepower"
            name="driveHorsepower"
            value={localData.reel?.motorization?.driveHorsepower || ""}
            onChange={handleChange}
          />
          <Input
            label="Speed (ft/min)"
            name="speed"
            value={localData.reel?.motorization?.speed || ""}
            onChange={handleChange}
          />
          <Input
            label="Accel Rate (ft/sec^2)"
            name="accelRate"
            value={localData.reel?.motorization?.accelRate || ""}
            onChange={handleChange}
          />
          <Input
            label="Regen Req'd"
            name="regenReqd"
            value={localData.reel?.motorization?.regenRequired || ""}
            onChange={handleChange}
          />
        </div>
      </Card>

      {/* Powered Straightener Section */}
      <Card className="mb-0 p-4">
        <Text
          as="h3"
          className="mb-4 text-lg font-medium">
          Powered Straightener
        </Text>
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Straightener Model"
            name="straightenerModel"
            value={localData.straightener?.model || ""}
            onChange={handleChange}
          />
          <Input
            label="Straightening Rolls"
            name="straighteningRolls"
            value={localData.straightener?.rolls?.straighteningRolls || ""}
            onChange={handleChange}
          />
          <Input
            label="Backup Rolls"
            name="backupRolls"
            value={localData.straightener?.rolls?.backupRolls || ""}
            onChange={handleChange}
          />
          <Input
            label="Payoff"
            name="payoff"
            value={localData.straightener?.payoff || ""}
            onChange={handleChange}
          />
          <Input
            label="Str. Width (in)"
            name="straightenerWidth"
            value={localData.straightener?.width || ""}
            onChange={handleChange}
          />
          <Input
            label="Feed Rate (ft/min)"
            name="feedRate"
            value={localData.straightener?.feedRate || ""}
            onChange={handleChange}
          />
          <Input
            label="Acceleration (ft/sec)"
            name="acceleration"
            value={localData.straightener?.acceleration || ""}
            onChange={handleChange}
          />
          <Input
            label="Horsepower (HP)"
            name="horsepower"
            value={localData.straightener?.horsepower || ""}
            onChange={handleChange}
          />
        </div>
      </Card>

      {/* Sigma 5 Feed Section */}
      <Card className="mb-0 p-4">
        <Text
          as="h3"
          className="mb-4 text-lg font-medium">
          Sigma 5 Feed
        </Text>
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Application"
            name="application"
            value={localData.feed?.application || ""}
            onChange={handleChange}
          />
          <Input
            label="Model"
            name="model"
            value={localData.feed?.model || ""}
            onChange={handleChange}
          />
          <Input
            label="Machine Width"
            name="machineWidth"
            value={localData.feed?.machineWidth || ""}
            onChange={handleChange}
          />
          <Input
            label="Loop Pit"
            name="loopPit"
            value={localData.loopPit || ""}
            onChange={handleChange}
          />
          <Input
            label="Full Width Rolls"
            name="fullWidthRolls"
            value={localData.feed?.fullWidthRolls || ""}
            onChange={handleChange}
          />
          <Input
            label="Feed Angle 1"
            name="feedAngle1"
            value={localData.feed?.feedAngle1 || ""}
            onChange={handleChange}
          />
          <Input
            label="Feed Angle 2"
            name="feedAngle2"
            value={localData.feed?.feedAngle2 || ""}
            onChange={handleChange}
          />
          <Input
            label="Press Bed Length"
            name="pressBedLength"
            value={localData.press?.bedLength || ""}
            onChange={handleChange}
          />
          <Input
            label="Maximum Velocity ft/min"
            name="maximumVelocity"
            value={localData.feed?.maximumVelocity || ""}
            onChange={handleChange}
          />
          <Input
            label="Acceleration (ft/sec^2)"
            name="acceleration2"
            value={localData.feed?.acceleration || ""}
            onChange={handleChange}
          />
          <Input
            label="Ratio"
            name="ratio"
            value={localData.feed?.ratio || ""}
            onChange={handleChange}
          />
          <Input
            label="Pull Thru Straightener Rolls"
            name="pullThruStraightenerRolls"
            value={localData.feed?.pullThru?.straightenerRolls || ""}
            onChange={handleChange}
          />
          <Input
            label="Pull Thru Pinch Rolls"
            name="pullThruPinchRolls"
            value={localData.feed?.pullThru?.pinchRolls || ""}
            onChange={handleChange}
          />
          <Input
            label="Feed Direction"
            name="feedDirection"
            value={localData.feed?.direction || ""}
            onChange={handleChange}
          />
          <Input
            label="Controls Level"
            name="controlsLevel"
            value={localData.feed?.controlsLevel || ""}
            onChange={handleChange}
          />
          <Input
            label="Type of line"
            name="typeOfLine"
            value={localData.feed?.typeOfLine || ""}
            onChange={handleChange}
          />
          <Input
            label="Passline"
            name="passline"
            value={localData.feed?.passline || ""}
            onChange={handleChange}
          />
          <Checkbox
            label="Light Gauge Non-Marking"
            name="lightGauge"
            checked={boolVal(localData.feed?.lightGuageNonMarking)}
            onChange={handleChange}
          />
          <Checkbox
            label="Non-Marking"
            name="nonMarking"
            checked={boolVal(localData.feed?.nonMarking)}
            onChange={handleChange}
          />
        </div>
      </Card>
    </div>
  );
};

export default SummaryReport;