import { usePerformanceSheet } from "@/contexts/performance.context";
import Card from "@/components/common/card";
import Text from "@/components/common/text";
import Input from "@/components/common/input";
import Checkbox from "@/components/common/checkbox";

const SummaryReport = () => {
  const { performanceData, updatePerformanceData } = usePerformanceSheet();

  // Helper for checkboxes (convert string/boolean to boolean)
  const boolVal = (val: any) => val === true || val === "true" || val === "Yes";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const sectionData = performanceData[section as keyof typeof performanceData];
      current[section] = { ...(typeof sectionData === "object" && sectionData !== null ? sectionData : {}) };
      current = current[section];
      
      // Handle deeper nesting
      for (let i = 0; i < rest.length - 1; i++) {
        current[rest[i]] = { ...current[rest[i]] };
        current = current[rest[i]];
      }
      
      // Set the final value
      current[rest[rest.length - 1]] = type === "checkbox" ? (actualValue ? "true" : "false") : actualValue;
      
      updatePerformanceData(updateObj);
    } else {
      // Handle legacy field names that map to nested structure
      const fieldMappings: { [key: string]: any } = {
        customer: {
          customer: value,
        },
        date: {
          dates: {
            ...performanceData.dates,
            date: value,
          },
        },
        reelModel: {
          reel: {
            ...performanceData.reel,
            model: value,
          },
        },
        reelWidth: {
          reel: {
            ...performanceData.reel,
            width: value,
          },
        },
        backplateDiameter: {
          reel: {
            ...performanceData.reel,
            backplate: {
              ...performanceData.reel?.backplate,
              diameter: value,
            },
          },
        },
        reelMotorization: {
          reel: {
            ...performanceData.reel,
            motorization: {
              ...performanceData.reel?.motorization,
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
            ...performanceData.reel,
            threadingDrive: {
              ...performanceData.reel?.threadingDrive,
              airClutch: value,
            },
          },
        },
        hydThreadingDrive: {
          reel: {
            ...performanceData.reel,
            threadingDrive: {
              ...performanceData.reel?.threadingDrive,
              hydThreadingDrive: value,
            },
          },
        },
        holdDownAssy: {
          reel: {
            ...performanceData.reel,
            holddown: {
              ...performanceData.reel?.holddown,
              assy: value,
            },
          },
        },
        holdDownCylinder: {
          reel: {
            ...performanceData.reel,
            holddown: {
              ...performanceData.reel?.holddown,
              cylinder: value,
            },
          },
        },
        brakeModel: {
          reel: {
            ...performanceData.reel,
            dragBrake: {
              ...performanceData.reel?.dragBrake,
              model: value,
            },
          },
        },
        brakeQuantity: {
          reel: {
            ...performanceData.reel,
            dragBrake: {
              ...performanceData.reel?.dragBrake,
              quantity: value,
            },
          },
        },
        driveHorsepower: {
          reel: {
            ...performanceData.reel,
            motorization: {
              ...performanceData.reel?.motorization,
              driveHorsepower: value,
            },
          },
        },
        speed: {
          reel: {
            ...performanceData.reel,
            motorization: {
              ...performanceData.reel?.motorization,
              speed: value,
            },
          },
        },
        accelRate: {
          reel: {
            ...performanceData.reel,
            motorization: {
              ...performanceData.reel?.motorization,
              accelRate: value,
            },
          },
        },
        regenReqd: {
          reel: {
            ...performanceData.reel,
            motorization: {
              ...performanceData.reel?.motorization,
              regenRequired: value,
            },
          },
        },
        straightenerModel: {
          straightener: {
            ...performanceData.straightener,
            model: value,
          },
        },
        straighteningRolls: {
          straightener: {
            ...performanceData.straightener,
            rolls: {
              ...performanceData.straightener?.rolls,
              straighteningRolls: value,
            },
          },
        },
        backupRolls: {
          straightener: {
            ...performanceData.straightener,
            rolls: {
              ...performanceData.straightener?.rolls,
              backupRolls: value,
            },
          },
        },
        payoff: {
          straightener: {
            ...performanceData.straightener,
            payoff: value,
          },
        },
        straightenerWidth: {
          straightener: {
            ...performanceData.straightener,
            width: value,
          },
        },
        feedRate: {
          straightener: {
            ...performanceData.straightener,
            feedRate: value,
          },
        },
        acceleration: {
          straightener: {
            ...performanceData.straightener,
            acceleration: value,
          },
        },
        horsepower: {
          straightener: {
            ...performanceData.straightener,
            horsepower: value,
          },
        },
        application: {
          feed: {
            ...performanceData.feed,
            application: value,
          },
        },
        model: {
          feed: {
            ...performanceData.feed,
            model: value,
          },
        },
        machineWidth: {
          feed: {
            ...performanceData.feed,
            machineWidth: value,
          },
        },
        loopPit: {
          loopPit: value,
        },
        fullWidthRolls: {
          feed: {
            ...performanceData.feed,
            fullWidthRolls: value,
          },
        },
        feedAngle1: {
          feed: {
            ...performanceData.feed,
            feedAngle1: value,
          },
        },
        feedAngle2: {
          feed: {
            ...performanceData.feed,
            feedAngle2: value,
          },
        },
        pressBedLength: {
          press: {
            ...performanceData.press,
            bedLength: value,
          },
        },
        maximumVelocity: {
          feed: {
            ...performanceData.feed,
            maximumVelocity: value,
          },
        },
        acceleration2: {
          feed: {
            ...performanceData.feed,
            acceleration: value,
          },
        },
        ratio: {
          feed: {
            ...performanceData.feed,
            ratio: value,
          },
        },
        pullThruStraightenerRolls: {
          feed: {
            ...performanceData.feed,
            pullThru: {
              ...performanceData.feed?.pullThru,
              straightenerRolls: value,
            },
          },
        },
        pullThruPinchRolls: {
          feed: {
            ...performanceData.feed,
            pullThru: {
              ...performanceData.feed?.pullThru,
              pinchRolls: value,
            },
          },
        },
        feedDirection: {
          feed: {
            ...performanceData.feed,
            direction: value,
          },
        },
        controlsLevel: {
          feed: {
            ...performanceData.feed,
            controlsLevel: value,
          },
        },
        typeOfLine: {
          feed: {
            ...performanceData.feed,
            typeOfLine: value,
          },
        },
        passline: {
          feed: {
            ...performanceData.feed,
            passline: value,
          },
        },
        lightGauge: {
          feed: {
            ...performanceData.feed,
            lightGuageNonMarking: actualValue ? "true" : "false",
          },
        },
        nonMarking: {
          feed: {
            ...performanceData.feed,
            nonMarking: actualValue ? "true" : "false",
          },
        },
      };

      if (fieldMappings[name]) {
        updatePerformanceData(fieldMappings[name]);
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
            value={performanceData.customer || ""}
            onChange={handleChange}
          />
          <Input
            label="Date"
            name="date"
            type="date"
            value={performanceData.dates?.date || ""}
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
            value={performanceData.reel?.model || ""}
            onChange={handleChange}
          />
          <Input
            label="Reel Width"
            name="reelWidth"
            value={performanceData.reel?.width || ""}
            onChange={handleChange}
          />
          <Input
            label="Backplate Diameter"
            name="backplateDiameter"
            value={performanceData.reel?.backplate?.diameter || ""}
            onChange={handleChange}
          />
          <Input
            label="Reel Motorization"
            name="reelMotorization"
            value={performanceData.reel?.motorization?.isMotorized || ""}
            onChange={handleChange}
          />
          <Input
            label="Single or Double Ended"
            name="singleOrDoubleEnded"
            value={performanceData.reel?.style || ""}
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
            value={performanceData.reel?.threadingDrive?.airClutch || ""}
            onChange={handleChange}
          />
          <Input
            label="Hyd. Threading Drive"
            name="hydThreadingDrive"
            value={performanceData.reel?.threadingDrive?.hydThreadingDrive || ""}
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
            value={performanceData.reel?.holddown?.assy || ""}
            onChange={handleChange}
          />
          <Input
            label="Hold Down Cylinder"
            name="holdDownCylinder"
            value={performanceData.reel?.holddown?.cylinder || ""}
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
            value={performanceData.reel?.dragBrake?.model || ""}
            onChange={handleChange}
          />
          <Input
            label="Brake Quantity"
            name="brakeQuantity"
            value={performanceData.reel?.dragBrake?.quantity || ""}
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
            value={performanceData.reel?.motorization?.driveHorsepower || ""}
            onChange={handleChange}
          />
          <Input
            label="Speed (ft/min)"
            name="speed"
            value={performanceData.reel?.motorization?.speed || ""}
            onChange={handleChange}
          />
          <Input
            label="Accel Rate (ft/sec^2)"
            name="accelRate"
            value={performanceData.reel?.motorization?.accelRate || ""}
            onChange={handleChange}
          />
          <Input
            label="Regen Req'd"
            name="regenReqd"
            value={performanceData.reel?.motorization?.regenRequired || ""}
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
            value={performanceData.straightener?.model || ""}
            onChange={handleChange}
          />
          <Input
            label="Straightening Rolls"
            name="straighteningRolls"
            value={performanceData.straightener?.rolls?.straighteningRolls || ""}
            onChange={handleChange}
          />
          <Input
            label="Backup Rolls"
            name="backupRolls"
            value={performanceData.straightener?.rolls?.backupRolls || ""}
            onChange={handleChange}
          />
          <Input
            label="Payoff"
            name="payoff"
            value={performanceData.straightener?.payoff || ""}
            onChange={handleChange}
          />
          <Input
            label="Str. Width (in)"
            name="straightenerWidth"
            value={performanceData.straightener?.width || ""}
            onChange={handleChange}
          />
          <Input
            label="Feed Rate (ft/min)"
            name="feedRate"
            value={performanceData.straightener?.feedRate || ""}
            onChange={handleChange}
          />
          <Input
            label="Acceleration (ft/sec)"
            name="acceleration"
            value={performanceData.straightener?.acceleration || ""}
            onChange={handleChange}
          />
          <Input
            label="Horsepower (HP)"
            name="horsepower"
            value={performanceData.straightener?.horsepower || ""}
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
            value={performanceData.feed?.application || ""}
            onChange={handleChange}
          />
          <Input
            label="Model"
            name="model"
            value={performanceData.feed?.model || ""}
            onChange={handleChange}
          />
          <Input
            label="Machine Width"
            name="machineWidth"
            value={performanceData.feed?.machineWidth || ""}
            onChange={handleChange}
          />
          <Input
            label="Loop Pit"
            name="loopPit"
            value={performanceData.loopPit || ""}
            onChange={handleChange}
          />
          <Input
            label="Full Width Rolls"
            name="fullWidthRolls"
            value={performanceData.feed?.fullWidthRolls || ""}
            onChange={handleChange}
          />
          <Input
            label="Feed Angle 1"
            name="feedAngle1"
            value={performanceData.feed?.feedAngle1 || ""}
            onChange={handleChange}
          />
          <Input
            label="Feed Angle 2"
            name="feedAngle2"
            value={performanceData.feed?.feedAngle2 || ""}
            onChange={handleChange}
          />
          <Input
            label="Press Bed Length"
            name="pressBedLength"
            value={performanceData.press?.bedLength || ""}
            onChange={handleChange}
          />
          <Input
            label="Maximum Velocity ft/min"
            name="maximumVelocity"
            value={performanceData.feed?.maximumVelocity || ""}
            onChange={handleChange}
          />
          <Input
            label="Acceleration (ft/sec^2)"
            name="acceleration2"
            value={performanceData.feed?.acceleration || ""}
            onChange={handleChange}
          />
          <Input
            label="Ratio"
            name="ratio"
            value={performanceData.feed?.ratio || ""}
            onChange={handleChange}
          />
          <Input
            label="Pull Thru Straightener Rolls"
            name="pullThruStraightenerRolls"
            value={performanceData.feed?.pullThru?.straightenerRolls || ""}
            onChange={handleChange}
          />
          <Input
            label="Pull Thru Pinch Rolls"
            name="pullThruPinchRolls"
            value={performanceData.feed?.pullThru?.pinchRolls || ""}
            onChange={handleChange}
          />
          <Input
            label="Feed Direction"
            name="feedDirection"
            value={performanceData.feed?.direction || ""}
            onChange={handleChange}
          />
          <Input
            label="Controls Level"
            name="controlsLevel"
            value={performanceData.feed?.controlsLevel || ""}
            onChange={handleChange}
          />
          <Input
            label="Type of line"
            name="typeOfLine"
            value={performanceData.feed?.typeOfLine || ""}
            onChange={handleChange}
          />
          <Input
            label="Passline"
            name="passline"
            value={performanceData.feed?.passline || ""}
            onChange={handleChange}
          />
          <Checkbox
            label="Light Gauge Non-Marking"
            name="lightGauge"
            checked={boolVal(performanceData.feed?.lightGuageNonMarking)}
            onChange={handleChange}
          />
          <Checkbox
            label="Non-Marking"
            name="nonMarking"
            checked={boolVal(performanceData.feed?.nonMarking)}
            onChange={handleChange}
          />
        </div>
      </Card>
    </div>
  );
};

export default SummaryReport;