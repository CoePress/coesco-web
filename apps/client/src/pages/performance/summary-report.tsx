import { PerformanceData } from "@/contexts/performance.context";
import Card from "@/components/common/card";
import Text from "@/components/common/text";
import Input from "@/components/common/input";
import Checkbox from "@/components/common/checkbox";

export interface SummaryReportProps {
  data: PerformanceData;
  isEditing: boolean;
  onChange: (updates: Partial<PerformanceData>) => void;
}

const SummaryReport: React.FC<SummaryReportProps> = ({ data, isEditing, onChange }) => {

  // Helper for checkboxes (convert string/boolean to boolean)
  const boolVal = (val: any) => val === true || val === "true" || val === "Yes";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEditing) return;
    
    const { name, value, type, checked } = e.target;
    const actualValue = type === "checkbox" ? checked : value;

    // Handle nested field updates based on field name pattern
    if (name.includes(".")) {
      const parts = name.split(".");
      const [section, ...rest] = parts;
      
      // Build the nested update object
      let updateObj: any = {};
      let current = updateObj;
      
      // Navigate to the correct nested level
      const sectionData = data[section as keyof typeof data];
      current[section] = { ...(typeof sectionData === "object" && sectionData !== null ? sectionData : {}) };
      current = current[section];
      
      // Handle deeper nesting
      for (let i = 0; i < rest.length - 1; i++) {
        current[rest[i]] = { ...current[rest[i]] };
        current = current[rest[i]];
      }
      
      // Set the final value
      current[rest[rest.length - 1]] = type === "checkbox" ? (actualValue ? "true" : "false") : actualValue;
      
      onChange(updateObj);
    } else {
      // Handle legacy field names that map to nested structure
      const fieldMappings: { [key: string]: any } = {
        customer: {
          customer: value,
        },
        date: {
          dates: {
            ...data.dates,
            date: value,
          },
        },
        reelModel: {
          reel: {
            ...data.reel,
            model: value,
          },
        },
        reelWidth: {
          reel: {
            ...data.reel,
            width: value,
          },
        },
        backplateDiameter: {
          reel: {
            ...data.reel,
            backplate: {
              ...data.reel?.backplate,
              diameter: value,
            },
          },
        },
        reelMotorization: {
          reel: {
            ...data.reel,
            motorization: {
              ...data.reel?.motorization,
              isMotorized: value,
            },
          },
        },
        singleOrDoubleEnded: {
          // This could be stored as a general field or in reel
          singleOrDoubleEnded: value,
        },
        airClutch: {
          reel: {
            ...data.reel,
            threadingDrive: {
              ...data.reel?.threadingDrive,
              airClutch: value,
            },
          },
        },
        hydThreadingDrive: {
          reel: {
            ...data.reel,
            threadingDrive: {
              ...data.reel?.threadingDrive,
              hydThreadingDrive: value,
            },
          },
        },
        holdDownAssy: {
          reel: {
            ...data.reel,
            holddown: {
              ...data.reel?.holddown,
              assy: value,
            },
          },
        },
        holdDownCylinder: {
          reel: {
            ...data.reel,
            holddown: {
              ...data.reel?.holddown,
              cylinder: value,
            },
          },
        },
        brakeModel: {
          reel: {
            ...data.reel,
            dragBrake: {
              ...data.reel?.dragBrake,
              model: value,
            },
          },
        },
        brakeQuantity: {
          reel: {
            ...data.reel,
            dragBrake: {
              ...data.reel?.dragBrake,
              quantity: value,
            },
          },
        },
        driveHorsepower: {
          reel: {
            ...data.reel,
            motorization: {
              ...data.reel?.motorization,
              driveHorsepower: value,
            },
          },
        },
        speed: {
          reel: {
            ...data.reel,
            motorization: {
              ...data.reel?.motorization,
              speed: value,
            },
          },
        },
        accelRate: {
          reel: {
            ...data.reel,
            motorization: {
              ...data.reel?.motorization,
              accelRate: value,
            },
          },
        },
        regenReqd: {
          reel: {
            ...data.reel,
            motorization: {
              ...data.reel?.motorization,
              regenRequired: value,
            },
          },
        },
        straightenerModel: {
          straightener: {
            ...data.straightener,
            model: value,
          },
        },
        straighteningRolls: {
          straightener: {
            ...data.straightener,
            rolls: {
              ...data.straightener?.rolls,
              straighteningRolls: value,
            },
          },
        },
        backupRolls: {
          straightener: {
            ...data.straightener,
            rolls: {
              ...data.straightener?.rolls,
              backupRolls: value,
            },
          },
        },
        payoff: {
          straightener: {
            ...data.straightener,
            payoff: value,
          },
        },
        straightenerWidth: {
          straightener: {
            ...data.straightener,
            width: value,
          },
        },
        feedRate: {
          straightener: {
            ...data.straightener,
            feedRate: value,
          },
        },
        acceleration: {
          straightener: {
            ...data.straightener,
            acceleration: value,
          },
        },
        horsepower: {
          straightener: {
            ...data.straightener,
            horsepower: value,
          },
        },
        application: {
          feed: {
            ...data.feed,
            application: value,
          },
        },
        model: {
          feed: {
            ...data.feed,
            model: value,
          },
        },
        machineWidth: {
          feed: {
            ...data.feed,
            machineWidth: value,
          },
        },
        loopPit: {
          loopPit: value,
        },
        fullWidthRolls: {
          feed: {
            ...data.feed,
            fullWidthRolls: value,
          },
        },
        feedAngle1: {
          feed: {
            ...data.feed,
            feedAngle1: value,
          },
        },
        feedAngle2: {
          feed: {
            ...data.feed,
            feedAngle2: value,
          },
        },
        pressBedLength: {
          press: {
            ...data.press,
            bedLength: value,
          },
        },
        maximumVelocity: {
          feed: {
            ...data.feed,
            maximumVelocity: value,
          },
        },
        acceleration2: {
          feed: {
            ...data.feed,
            acceleration: value,
          },
        },
        ratio: {
          feed: {
            ...data.feed,
            ratio: value,
          },
        },
        pullThruStraightenerRolls: {
          feed: {
            ...data.feed,
            pullThru: {
              ...data.feed?.pullThru,
              straightenerRolls: value,
            },
          },
        },
        pullThruPinchRolls: {
          feed: {
            ...data.feed,
            pullThru: {
              ...data.feed?.pullThru,
              pinchRolls: value,
            },
          },
        },
        feedDirection: {
          feed: {
            ...data.feed,
            direction: value,
          },
        },
        controlsLevel: {
          feed: {
            ...data.feed,
            controlsLevel: value,
          },
        },
        typeOfLine: {
          feed: {
            ...data.feed,
            typeOfLine: value,
          },
        },
        passline: {
          feed: {
            ...data.feed,
            passline: value,
          },
        },
        lightGauge: {
          feed: {
            ...data.feed,
            lightGuageNonMarking: actualValue ? "true" : "false",
          },
        },
        nonMarking: {
          feed: {
            ...data.feed,
            nonMarking: actualValue ? "true" : "false",
          },
        },
      };

      if (fieldMappings[name]) {
        onChange(fieldMappings[name]);
      }
    }
  };

  return (
    <div className="w-full flex flex-1 flex-col p-2 pb-6 gap-2">
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
            value={data.customer || ""}
            onChange={handleChange}
          />
          <Input
            label="Date"
            name="date"
            type="date"
            value={data.dates?.date || ""}
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
            value={data.reel?.model || ""}
            onChange={handleChange}
          />
          <Input
            label="Reel Width"
            name="reelWidth"
            value={data.reel?.width || ""}
            onChange={handleChange}
          />
          <Input
            label="Backplate Diameter"
            name="backplateDiameter"
            value={data.reel?.backplate?.diameter || ""}
            onChange={handleChange}
          />
          <Input
            label="Reel Motorization"
            name="reelMotorization"
            value={data.reel?.motorization?.isMotorized || ""}
            onChange={handleChange}
          />
          <Input
            label="Single or Double Ended"
            name="singleOrDoubleEnded"
            value={data.reel?.style || ""}
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
            value={data.reel?.threadingDrive?.airClutch || ""}
            onChange={handleChange}
          />
          <Input
            label="Hyd. Threading Drive"
            name="hydThreadingDrive"
            value={data.reel?.threadingDrive?.hydThreadingDrive || ""}
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
            value={data.reel?.holddown?.assy || ""}
            onChange={handleChange}
          />
          <Input
            label="Hold Down Cylinder"
            name="holdDownCylinder"
            value={data.reel?.holddown?.cylinder || ""}
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
            value={data.reel?.dragBrake?.model || ""}
            onChange={handleChange}
          />
          <Input
            label="Brake Quantity"
            name="brakeQuantity"
            value={data.reel?.dragBrake?.quantity || ""}
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
            value={data.reel?.motorization?.driveHorsepower || ""}
            onChange={handleChange}
          />
          <Input
            label="Speed (ft/min)"
            name="speed"
            value={data.reel?.motorization?.speed || ""}
            onChange={handleChange}
          />
          <Input
            label="Accel Rate (ft/sec^2)"
            name="accelRate"
            value={data.reel?.motorization?.accelRate || ""}
            onChange={handleChange}
          />
          <Input
            label="Regen Req'd"
            name="regenReqd"
            value={data.reel?.motorization?.regenRequired || ""}
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
            value={data.straightener?.model || ""}
            onChange={handleChange}
          />
          <Input
            label="Straightening Rolls"
            name="straighteningRolls"
            value={data.straightener?.rolls?.straighteningRolls || ""}
            onChange={handleChange}
          />
          <Input
            label="Backup Rolls"
            name="backupRolls"
            value={data.straightener?.rolls?.backupRolls || ""}
            onChange={handleChange}
          />
          <Input
            label="Payoff"
            name="payoff"
            value={data.straightener?.payoff || ""}
            onChange={handleChange}
          />
          <Input
            label="Str. Width (in)"
            name="straightenerWidth"
            value={data.straightener?.width || ""}
            onChange={handleChange}
          />
          <Input
            label="Feed Rate (ft/min)"
            name="feedRate"
            value={data.straightener?.feedRate || ""}
            onChange={handleChange}
          />
          <Input
            label="Acceleration (ft/sec)"
            name="acceleration"
            value={data.straightener?.acceleration || ""}
            onChange={handleChange}
          />
          <Input
            label="Horsepower (HP)"
            name="horsepower"
            value={data.straightener?.horsepower || ""}
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
            value={data.feed?.application || ""}
            onChange={handleChange}
          />
          <Input
            label="Model"
            name="model"
            value={data.feed?.model || ""}
            onChange={handleChange}
          />
          <Input
            label="Machine Width"
            name="machineWidth"
            value={data.feed?.machineWidth || ""}
            onChange={handleChange}
          />
          <Input
            label="Loop Pit"
            name="loopPit"
            value={data.loopPit || ""}
            onChange={handleChange}
          />
          <Input
            label="Full Width Rolls"
            name="fullWidthRolls"
            value={data.feed?.fullWidthRolls || ""}
            onChange={handleChange}
          />
          <Input
            label="Feed Angle 1"
            name="feedAngle1"
            value={data.feed?.feedAngle1 || ""}
            onChange={handleChange}
          />
          <Input
            label="Feed Angle 2"
            name="feedAngle2"
            value={data.feed?.feedAngle2 || ""}
            onChange={handleChange}
          />
          <Input
            label="Press Bed Length"
            name="pressBedLength"
            value={data.press?.bedLength || ""}
            onChange={handleChange}
          />
          <Input
            label="Maximum Velocity ft/min"
            name="maximumVelocity"
            value={data.feed?.maximumVelocity || ""}
            onChange={handleChange}
          />
          <Input
            label="Acceleration (ft/sec^2)"
            name="acceleration2"
            value={data.feed?.acceleration || ""}
            onChange={handleChange}
          />
          <Input
            label="Ratio"
            name="ratio"
            value={data.feed?.ratio || ""}
            onChange={handleChange}
          />
          <Input
            label="Pull Thru Straightener Rolls"
            name="pullThruStraightenerRolls"
            value={data.feed?.pullThru?.straightenerRolls || ""}
            onChange={handleChange}
          />
          <Input
            label="Pull Thru Pinch Rolls"
            name="pullThruPinchRolls"
            value={data.feed?.pullThru?.pinchRolls || ""}
            onChange={handleChange}
          />
          <Input
            label="Feed Direction"
            name="feedDirection"
            value={data.feed?.direction || ""}
            onChange={handleChange}
          />
          <Input
            label="Controls Level"
            name="controlsLevel"
            value={data.feed?.controlsLevel || ""}
            onChange={handleChange}
          />
          <Input
            label="Type of line"
            name="typeOfLine"
            value={data.feed?.typeOfLine || ""}
            onChange={handleChange}
          />
          <Input
            label="Passline"
            name="passline"
            value={data.feed?.passline || ""}
            onChange={handleChange}
          />
          <Checkbox
            label="Light Gauge Non-Marking"
            name="lightGauge"
            checked={boolVal(data.feed?.lightGuageNonMarking)}
            onChange={handleChange}
          />
          <Checkbox
            label="Non-Marking"
            name="nonMarking"
            checked={boolVal(data.feed?.nonMarking)}
            onChange={handleChange}
          />
        </div>
      </Card>
    </div>
  );
};

export default SummaryReport;