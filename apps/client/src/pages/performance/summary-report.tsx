import { usePerformanceSheet } from '@/contexts/performance.context';
import Card from '@/components/common/card';
import Text from '@/components/common/text';
import Input from '@/components/common/input';
import Checkbox from '@/components/common/checkbox';
import Select from '@/components/common/select';

export default function SummaryReport() {
  const { performanceSheet, updatePerformanceSheet } = usePerformanceSheet();

  // Helper for checkboxes (convert string/boolean to boolean)
  const boolVal = (val: any) => val === true || val === 'true' || val === 'Yes';

  return (
    <div className="w-full flex flex-1 flex-col p-2 pb-6 gap-2">
      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">Reference Information</Text>
        <Input label="Reference" name="referenceNumber" value={performanceSheet.referenceNumber || ''} onChange={e => updatePerformanceSheet({ referenceNumber: e.target.value })} />
      </Card>
      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">Customer & Date</Text>
        <div className="grid grid-cols-2 gap-6">
          <Input label="Customer" name="customer" value={performanceSheet.customer || ''} onChange={e => updatePerformanceSheet({ customer: e.target.value })} />
          <Input label="Date" name="date" type="date" value={performanceSheet.date || ''} onChange={e => updatePerformanceSheet({ date: e.target.value })} />
        </div>
      </Card>

      {/* Reel Section */}
      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">Reel</Text>
        <div className="grid grid-cols-2 gap-2">
          <Input label="Reel Model" name="reelModel" value={performanceSheet.reelModel || ''} onChange={e => updatePerformanceSheet({ reelModel: e.target.value })} />
          <Input label="Reel Width" name="reelWidth" value={performanceSheet.reelWidth || ''} onChange={e => updatePerformanceSheet({ reelWidth: e.target.value })} />
          <Input label="Backplate Diameter" name="backplateDiameter" value={performanceSheet.backplateDiameter || ''} onChange={e => updatePerformanceSheet({ backplateDiameter: e.target.value })} />
          <Input label="Reel Motorization" name="reelMotorization" value={performanceSheet.reelMotorization || ''} onChange={e => updatePerformanceSheet({ reelMotorization: e.target.value })} />
          <Input label="Single or Double Ended" name="singleOrDoubleEnded" value={performanceSheet.singleOrDoubleEnded || ''} onChange={e => updatePerformanceSheet({ singleOrDoubleEnded: e.target.value })} />
        </div>
      </Card>

      {/* Threading Drive Section */}
      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">Threading Drive</Text>
        <div className="grid grid-cols-2 gap-2">
          <Input label="Air Clutch" name="airClutch" value={performanceSheet.airClutch || ''} onChange={e => updatePerformanceSheet({ airClutch: e.target.value })} />
          <Input label="Hyd. Threading Drive" name="hydThreadingDrive" value={performanceSheet.hydThreadingDrive || ''} onChange={e => updatePerformanceSheet({ hydThreadingDrive: e.target.value })} />
        </div>
      </Card>

      {/* Hold Down Section */}
      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">Hold Down</Text>
        <div className="grid grid-cols-2 gap-2">
          <Input label="Hold Down Assy" name="holdDownAssy" value={performanceSheet.holdDownAssy || ''} onChange={e => updatePerformanceSheet({ holdDownAssy: e.target.value })} />
          <Input label="Hold Down Cylinder" name="holdDownCylinder" value={performanceSheet.holdDownCylinder || ''} onChange={e => updatePerformanceSheet({ holdDownCylinder: e.target.value })} />
        </div>
      </Card>

      {/* Drag Brake Section */}
      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">Drag Brake</Text>
        <div className="grid grid-cols-2 gap-2">
          <Input label="Brake Model" name="brakeModel" value={performanceSheet.brakeModel || ''} onChange={e => updatePerformanceSheet({ brakeModel: e.target.value })} />
          <Input label="Brake Quantity" name="brakeQuantity" value={performanceSheet.brakeQuantity || ''} onChange={e => updatePerformanceSheet({ brakeQuantity: e.target.value })} />
        </div>
      </Card>

      {/* Motorized Reel Section */}
      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">Motorized Reel</Text>
        <div className="grid grid-cols-2 gap-2">
          <Input label="Drive Horsepower" name="driveHorsepower" value={performanceSheet.driveHorsepower || ''} onChange={e => updatePerformanceSheet({ driveHorsepower: e.target.value })} />
          <Input label="Speed (ft/min)" name="speed" value={performanceSheet.speed || ''} onChange={e => updatePerformanceSheet({ speed: e.target.value })} />
          <Input label="Accel Rate (ft/sec^2)" name="accelRate" value={performanceSheet.accelRate || ''} onChange={e => updatePerformanceSheet({ accelRate: e.target.value })} />
          <Input label="Regen Req'd" name="regenReqd" value={performanceSheet.regenReqd || ''} onChange={e => updatePerformanceSheet({ regenReqd: e.target.value })} />
        </div>
      </Card>

      {/* Powered Straightener Section */}
      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">Powered Straightener</Text>
        <div className="grid grid-cols-2 gap-2">
          <Input label="Straightener Model" name="straightenerModel" value={performanceSheet.straightenerModel || ''} onChange={e => updatePerformanceSheet({ straightenerModel: e.target.value })} />
          <Input label="Straightening Rolls" name="straighteningRolls" value={performanceSheet.straighteningRolls || ''} onChange={e => updatePerformanceSheet({ straighteningRolls: e.target.value })} />
          <Input label="Backup Rolls" name="backupRolls" value={performanceSheet.backupRolls || ''} onChange={e => updatePerformanceSheet({ backupRolls: e.target.value })} />
          <Input label="Payoff" name="payoff" value={performanceSheet.payoff || ''} onChange={e => updatePerformanceSheet({ payoff: e.target.value })} />
          <Input label="Str. Width (in)" name="straightenerWidth" value={performanceSheet.straightenerWidth || ''} onChange={e => updatePerformanceSheet({ straightenerWidth: e.target.value })} />
          <Input label="Feed Rate (ft/min)" name="feedRate" value={performanceSheet.feedRate || ''} onChange={e => updatePerformanceSheet({ feedRate: e.target.value })} />
          <Input label="Acceleration (ft/sec)" name="acceleration" value={performanceSheet.acceleration || ''} onChange={e => updatePerformanceSheet({ acceleration: e.target.value })} />
          <Input label="Horsepower (HP)" name="horsepower" value={performanceSheet.horsepower || ''} onChange={e => updatePerformanceSheet({ horsepower: e.target.value })} />
        </div>
      </Card>

      {/* Sigma 5 Feed Section */}
      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">Sigma 5 Feed</Text>
        <div className="grid grid-cols-2 gap-2">
          <Input label="Application" name="application" value={performanceSheet.application || ''} onChange={e => updatePerformanceSheet({ application: e.target.value })} />
          <Input label="Model" name="model" value={performanceSheet.model || ''} onChange={e => updatePerformanceSheet({ model: e.target.value })} />
          <Input label="Machine Width" name="machineWidth" value={performanceSheet.machineWidth || ''} onChange={e => updatePerformanceSheet({ machineWidth: e.target.value })} />
          <Input label="Loop Pit" name="loopPit" value={performanceSheet.loopPit || ''} onChange={e => updatePerformanceSheet({ loopPit: e.target.value })} />
          <Input label="Full Width Rolls" name="fullWidthRolls" value={performanceSheet.fullWidthRolls || ''} onChange={e => updatePerformanceSheet({ fullWidthRolls: e.target.value })} />
          <Input label="Feed Angle 1" name="feedAngle1" value={performanceSheet.feedAngle1 || ''} onChange={e => updatePerformanceSheet({ feedAngle1: e.target.value })} />
          <Input label="Feed Angle 2" name="feedAngle2" value={performanceSheet.feedAngle2 || ''} onChange={e => updatePerformanceSheet({ feedAngle2: e.target.value })} />
          <Input label="Press Bed Length" name="pressBedLength" value={performanceSheet.pressBedLength || ''} onChange={e => updatePerformanceSheet({ pressBedLength: e.target.value })} />
          <Input label="Maximum Velocity ft/min" name="maximumVelocity" value={performanceSheet.maximumVelocity || ''} onChange={e => updatePerformanceSheet({ maximumVelocity: e.target.value })} />
          <Input label="Acceleration (ft/sec^2)" name="acceleration2" value={performanceSheet.acceleration2 || ''} onChange={e => updatePerformanceSheet({ acceleration2: e.target.value })} />
          <Input label="Ratio" name="ratio" value={performanceSheet.ratio || ''} onChange={e => updatePerformanceSheet({ ratio: e.target.value })} />
          <Input label="Pull Thru Straightener Rolls" name="pullThruStraightenerRolls" value={performanceSheet.pullThruStraightenerRolls || ''} onChange={e => updatePerformanceSheet({ pullThruStraightenerRolls: e.target.value })} />
          <Input label="Pull Thru Pinch Rolls" name="pullThruPinchRolls" value={performanceSheet.pullThruPinchRolls || ''} onChange={e => updatePerformanceSheet({ pullThruPinchRolls: e.target.value })} />
          <Input label="Feed Direction" name="feedDirection" value={performanceSheet.feedDirection || ''} onChange={e => updatePerformanceSheet({ feedDirection: e.target.value })} />
          <Input label="Controls Level" name="controlsLevel" value={performanceSheet.controlsLevel || ''} onChange={e => updatePerformanceSheet({ controlsLevel: e.target.value })} />
          <Input label="Type of line" name="typeOfLine" value={performanceSheet.typeOfLine || ''} onChange={e => updatePerformanceSheet({ typeOfLine: e.target.value })} />
          <Input label="Passline" name="passline" value={performanceSheet.passline || ''} onChange={e => updatePerformanceSheet({ passline: e.target.value })} />
          <Checkbox label="Light Gauge Non-Marking" name="lightGauge" checked={boolVal(performanceSheet.lightGauge)} onChange={e => updatePerformanceSheet({ lightGauge: e.target.checked })} />
          <Checkbox label="Non-Marking" name="nonMarking" checked={boolVal(performanceSheet.nonMarking)} onChange={e => updatePerformanceSheet({ nonMarking: e.target.checked })} />
        </div>
      </Card>
    </div>
  );
} 