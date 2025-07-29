import Card from "@/components/common/card";
import Input from "@/components/common/input";
import Text from "@/components/common/text";
import {useEffect } from "react";
import Select from "@/components/common/select";
import {
  MATERIAL_TYPE_OPTIONS,
  REEL_WIDTTH_OPTIONS,
  REEL_MODEL_OPTIONS,
  BACKPLATE_DIAMETER_OPTIONS,
  HYDRAULIC_THREADING_DRIVE_OPTIONS,
  HOLD_DOWN_ASSY_OPTIONS,
  HOLD_DOWN_CYLINDER_OPTIONS,
  BRAKE_MODEL_OPTIONS,
  BRAKE_QUANTITY_OPTIONS,
} from "@/utils/select-options";
import { PerformanceData } from "@/contexts/performance.context";

export interface TDDBHDProps {
  data: PerformanceData;
  isEditing: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
}

const TDDBHD: React.FC<TDDBHDProps> = ({ data, isEditing, onChange }) => {

  useEffect(() => {
    
  }, [onChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!isEditing) return;
    
    const { name, value, type } = e.target;
    
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
      current[rest[rest.length - 1]] = type === "number" ? (value === "" ? "" : value) : value;
      
      onChange(updateObj);
    } else {
      // Handle top-level fields
      onChange({
        target: {
          name,
          value,
        } as HTMLInputElement | HTMLSelectElement
      } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>);
    }
  };

  return (
    <div className="w-full flex flex-1 flex-col p-2 gap-2">
      {/* Customer and Date Info */}
      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Customer & Date
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Customer"
            name="customer"
            value={data.customer || ""}
            onChange={handleChange}
          />
          <Input
            label="Date"
            name="dates.date"
            type="date"
            value={data.dates?.date || ""}
            onChange={handleChange}
          />
        </div>
      </Card>
      
      {/* Reel & Material Specs */}
      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Reel & Material Specs
        </Text>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <Select
            label="Reel Model"
            name="reel.model"
            value={data.reel?.model !== undefined 
                && data.reel?.model !== null ? String(data.reel.model) : ""}
            onChange={handleChange}
            options={REEL_MODEL_OPTIONS.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
          />
          <Select
            label="Reel Width"
            name="reel.width"
            value={data.reel?.width !== undefined 
                && data.reel?.width !== null ? String(data.reel.width) : ""}
            onChange={handleChange}
            options={REEL_WIDTTH_OPTIONS.map((opt) => ({
              value: opt.value,
              label: opt.Label,
            }))}
          />
          <Select
            label="Backplate Diameter"
            name="reel.backplate.diameter"
            value={data.reel?.backplate?.diameter !== undefined 
                && data.reel?.backplate?.diameter !== null ? String(data.reel.backplate.diameter) : ""}
            onChange={handleChange}
            options={BACKPLATE_DIAMETER_OPTIONS.map((opt) => ({
              value: opt.value,
              label: opt.Label,
            }))}
          />
          <Select
            label="Material Type"
            name="material.materialType"
            value={data.material?.materialType || ""}
            onChange={handleChange}
            options={MATERIAL_TYPE_OPTIONS}
          />
          <Input
            label="Material Width (in)"
            name="material.coilWidth"
            value={data.material?.coilWidth || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Material Thickness (in)"
            name="material.materialThickness"
            value={data.material?.materialThickness || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Material Yield Strength (psi)"
            name="material.maxYieldStrength"
            value={data.material?.maxYieldStrength || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Air Pressure Available (psi)"
            name="reel.airPressureAvailable"
            value={data.reel?.airPressureAvailable || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Required Decel. Rate (ft/sec²)"
            name="reel.requiredDecelRate"
            value={data.reel?.requiredDecelRate || ""}
            onChange={handleChange}
            type="number"
          />
        </div>
        
        {/* Coil, Brake & Other Specs */}
        <Card className="mb-4 p-4">
          <Text as="h3" className="mb-4 text-lg font-medium">
            Coil, Brake & Other Specs
          </Text>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Input
              label="Coil Weight (lbs)"
              name="coil.maxCoilWeight"
              value={data.coil?.maxCoilWeight || ""}
              onChange={handleChange}
              type="number"
            />
            <Input
              label="Coil O.D. (in)"
              name="coil.maxCoilOD"
              value={data.coil?.maxCoilOD || ""}
              onChange={handleChange}
              type="number"
            />
            <Input
              label="Disp. (Reel) Mtr."
              name="reel.dispReelMtr"
              value={data.reel?.dispReelMtr || ""}
              onChange={handleChange}
            />
            <Input
              label="Web Tension (psi)"
              name="reel.webTension.psi"
              value={data.reel?.webTension?.psi || ""}
              onChange={handleChange}
              type="number"
            />
            <Input
              label="Web Tension (lbs)"
              name="reel.webTension.lbs"
              value={data.reel?.webTension?.lbs || ""}
              onChange={handleChange}
              type="number"
            />
            <Input
              label="Brake Pad Diameter (in)"
              name="reel.brakePadDiameter"
              value={data.reel?.brakePadDiameter || ""}
              onChange={handleChange}
              type="number"
            />
            <Input
              label="Cylinder Bore (in)"
              name="reel.cylinderBore"
              value={data.reel?.cylinderBore || ""}
              onChange={handleChange}
              type="number"
            />
            <Input
              label="Coefficient of Friction"
              name="reel.coefficientOfFriction"
              value={data.reel?.coefficientOfFriction || ""}
              onChange={handleChange}
              type="number"
            />
          </div>
        </Card>
        
        {/* Threading Drive and Hold Down */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Card className="p-4">
            <Text as="h3" className="mb-4 text-lg font-medium">
              Threading Drive
            </Text>
            <div className="space-y-4">
              <Input
                label="Air Clutch"
                name="reel.threadingDrive.airClutch"
                value={data.reel?.threadingDrive?.airClutch || ""}
                onChange={handleChange}
              />
              <Select
                label="Hyd. Threading Drive"
                name="reel.threadingDrive.hydThreadingDrive"
                value={data.reel?.threadingDrive?.hydThreadingDrive || ""}
                onChange={handleChange}
                options={HYDRAULIC_THREADING_DRIVE_OPTIONS}
              />
              <Input
                label="Torque At Mandrel (in. lbs.)"
                name="reel.torque.atMandrel"
                value={data.reel?.torque?.atMandrel || ""}
                onChange={handleChange}
                type="number"
              />
              <Input
                label="Rewind Torque Req. (in. lbs.)"
                name="reel.torque.rewindRequired"
                value={data.reel?.torque?.rewindRequired || ""}
                onChange={handleChange}
                type="number"
              />
            </div>
          </Card>
          
          <Card className="p-4">
            <Text as="h3" className="mb-4 text-lg font-medium">
              Hold Down
            </Text>
            <div className="space-y-4">
              <Select
                label="Hold Down Assy"
                name="reel.holddown.assy"
                value={data.reel?.holddown?.assy || ""}
                onChange={handleChange}
                options={HOLD_DOWN_ASSY_OPTIONS}
              />
              <Input
                label="Holddown Pressure (psi)"
                name="reel.holddown.cylinderPressure"
                value={data.reel?.holddown?.cylinderPressure || ""}
                onChange={handleChange}
                type="number"
              />
              <Input
                label="Hold Down Force Required (lbs)"
                name="reel.holddown.force.required"
                value={data.reel?.holddown?.force?.required || ""}
                onChange={handleChange}
                type="number"
              />
              <Input
                label="Hold Down Force Available (lbs)"
                name="reel.holddown.force.available"
                value={data.reel?.holddown?.force?.available || ""}
                onChange={handleChange}
                type="number"
              />
              <Input
                label="Min. Material Width (in)"
                name="reel.minMaterialWidth"
                value={data.reel?.minMaterialWidth || ""}
                onChange={handleChange}
                type="number"
              />
            </div>
          </Card>
        </div>
        
        {/* Cylinder and Drag Brake */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Card className="p-4">
            <Text as="h3" className="mb-4 text-lg font-medium">
              Cylinder
            </Text>
            <div className="space-y-4">
              <Select
                label="Type"
                name="reel.holddown.cylinderType"
                value={data.reel?.holddown?.cylinder || ""}
                onChange={handleChange}
                options={HOLD_DOWN_CYLINDER_OPTIONS}
              />
              <Input
                label="Pressure (psi)"
                name="reel.holddown.cylinderPressure"
                value={data.reel?.holddown?.cylinderPressure || ""}
                onChange={handleChange}
                type="number"
              />
            </div>
          </Card>
          
          <Card className="p-4">
            <Text as="h3" className="mb-4 text-lg font-medium">
              Drag Brake
            </Text>
            <div className="space-y-4">
              <Select
                label="Brake Model"
                name="reel.dragBrake.model"
                value={data.reel?.dragBrake?.model || ""}
                onChange={handleChange}
                options={BRAKE_MODEL_OPTIONS}
              />
              <Select
                label="Brake Quantity"
                name="reel.dragBrake.quantity"
                value={data.reel?.dragBrake?.quantity !== undefined 
                    && data.reel?.dragBrake?.quantity !== null ? String(data.reel.dragBrake.quantity) : ""}
                onChange={handleChange}
                options={BRAKE_QUANTITY_OPTIONS}
              />
              <Input
                label="Torque Required (in. lbs.)"
                name="reel.torque.required"
                value={data.reel?.torque?.required || ""}
                onChange={handleChange}
                type="number"
              />
              <Input
                label="Failsafe - Single Stage (psi air req.)"
                name="reel.dragBrake.psiAirRequired"
                value={data.reel?.dragBrake?.psiAirRequired || ""}
                onChange={handleChange}
                type="number"
              />
              <Input
                label="Failsafe Holding Force (in. lbs.)"
                name="reel.dragBrake.holdingForce"
                value={data.reel?.dragBrake?.holdingForce || ""}
                onChange={handleChange}
                type="number"
              />
            </div>
          </Card>
        </div>
      </Card>
      
      {/* Status Messages */}
    </div>
  );
};

export default TDDBHD;