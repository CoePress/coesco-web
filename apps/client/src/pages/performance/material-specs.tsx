import { useEffect } from "react";
import Input from "@/components/common/input";
import Select from "@/components/common/select";
import Checkbox from "@/components/common/checkbox";
import Text from "@/components/common/text";
import { Card } from "@/components";
import {
  FEED_DIRECTION_OPTIONS,
  CONTROLS_LEVEL_OPTIONS,
  TYPE_OF_LINE_OPTIONS,
  PASSLINE_OPTIONS,
  ROLL_TYPE_OPTIONS,
  REEL_BACKPLATE_OPTIONS,
  REEL_STYLE_OPTIONS,
  MATERIAL_TYPE_OPTIONS,
} from "@/utils/select-options";
import { PerformanceData } from "@/contexts/performance.context";

function hasAllRequiredFields(materialData: any, coilData: any) {
  return (
    materialData?.materialType &&
    materialData?.materialThickness &&
    materialData?.maxYieldStrength &&
    materialData?.coilWidth &&
    coilData?.maxCoilWeight &&
    coilData?.coilID
  );
}

export interface MaterialSpecsProps {
  data: PerformanceData;
  isEditing: boolean;
  onChange: (update: Partial<PerformanceData>) => void;
}

const MaterialSpecs: React.FC<MaterialSpecsProps> = ({ data, isEditing, onChange }) => {
  // Get coil width boundaries from the nested structure
  const coilWidthMin = Number(data.coil?.minCoilWidth) || undefined;
  const coilWidthMax = Number(data.coil?.maxCoilWidth) || undefined;

  useEffect(() => {
    
  }, [onChange]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (!isEditing) return;

    const { name, value, type } = e.target;
    const checked = type === "checkbox" && "checked" in e.target ? (e.target as HTMLInputElement).checked : undefined;
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
        referenceNumber: {
          referenceNumber: value,
        },
        customer: {
          customer: value,
        },
        date: {
          dates: {
            ...data.dates,
            date: value,
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
        feedControls: {
          feed: {
            ...data.feed,
            controls: value,
          },
        },
        passline: {
          feed: {
            ...data.feed,
            passline: value,
          },
        },
        typeOfRoll: {
          straightener: {
            ...data.straightener,
            rolls: {
              ...data.straightener?.rolls,
              typeOfRoll: value,
            },
          },
        },
        reelBackplate: {
          reel: {
            ...data.reel,
            backplate: {
              ...data.reel?.backplate,
              type: value,
            },
          },
        },
        reelStyle: {
          reel: {
            ...data.reel,
            style: value,
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

    // Trigger calculation if all required fields are present
    setTimeout(() => {
      if (hasAllRequiredFields(data.material, data.coil)) {
        triggerCalculation();
      }
    }, 500);
  };

  const triggerCalculation = async () => {
    const material = data.material;
    const coil = data.coil;

    if (!hasAllRequiredFields(material, coil)) return;

    const payload = {
      material_type: material?.materialType || "",
      material_thickness: Number(material?.materialThickness || 0),
      yield_strength: Number(material?.maxYieldStrength || 0),
      material_width: Number(material?.coilWidth || 0),
      coil_weight_max: Number(coil?.maxCoilWeight || 0),
      coil_id: Number(coil?.coilID || 0),
    };

    // Guard: Only send if all required fields are present and valid
    const allValid =
      typeof payload.material_type === "string" &&
      payload.material_type.trim() !== "" &&
      typeof payload.material_thickness === "number" &&
      !isNaN(payload.material_thickness) &&
      payload.material_thickness > 0 &&
      typeof payload.yield_strength === "number" &&
      !isNaN(payload.yield_strength) &&
      payload.yield_strength > 0 &&
      typeof payload.material_width === "number" &&
      !isNaN(payload.material_width) &&
      payload.material_width > 0 &&
      typeof payload.coil_weight_max === "number" &&
      !isNaN(payload.coil_weight_max) &&
      payload.coil_weight_max > 0 &&
      typeof payload.coil_id === "number" &&
      !isNaN(payload.coil_id) &&
      payload.coil_id > 0;

    if (!allValid) return;
  };

  return (
    <div className="w-full flex flex-1 flex-col p-2 gap-2">
      {/* Customer and Date Card */}
      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
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

      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Material Specifications
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Coil Width (in)"
            name="material.coilWidth"
            value={data.material?.coilWidth || ""}
            onChange={handleChange}
            type="number"
            min={coilWidthMin}
            max={coilWidthMax}
          />
          <Input
            label="Coil Weight (Max)"
            name="coil.maxCoilWeight"
            value={data.coil?.maxCoilWeight || ""}
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
          <Select
            label="Material Type"
            name="material.materialType"
            value={data.material?.materialType || ""}
            onChange={handleChange}
            options={MATERIAL_TYPE_OPTIONS}
          />
          <Input
            label="Yield Strength (psi)"
            name="material.maxYieldStrength"
            value={data.material?.maxYieldStrength || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Material Tensile (psi)"
            name="material.maxTensileStrength"
            value={data.material?.maxTensileStrength || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Coil I.D."
            name="coil.coilID"
            value={data.coil?.coilID || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Coil O.D."
            name="coil.maxCoilOD"
            value={data.coil?.maxCoilOD || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Min Bend Radius (in)"
            name="material.minBendRadius"
            value={data.material?.minBendRadius || ""}
            onChange={handleChange}
            type="number"
            readOnly
          />
          <Input
            label="Min Loop Length (ft)"
            name="material.minLoopLength"
            value={data.material?.minLoopLength || ""}
            onChange={handleChange}
            type="number"
            readOnly
          />
          <Input
            label="Coil O.D. Calculated"
            name="material.calculatedCoilOD"
            value={data.material?.calculatedCoilOD || ""}
            onChange={handleChange}
            type="number"
            readOnly
          />
        </div>
      </Card>

      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Other Specifications
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4">
          <Select
            label="Select Feed Direction"
            name="feedDirection"
            value={data.feed?.direction || ""}
            onChange={handleChange}
            options={FEED_DIRECTION_OPTIONS}
          />
          <Select
            label="Select Controls Level"
            name="controlsLevel"
            value={data.feed?.controlsLevel || ""}
            onChange={handleChange}
            options={CONTROLS_LEVEL_OPTIONS}
          />
          <Select
            label="Type of Line"
            name="typeOfLine"
            value={data.feed?.typeOfLine || ""}
            onChange={handleChange}
            options={TYPE_OF_LINE_OPTIONS}
          />
          <Input
            label="Feed Controls"
            name="feedControls"
            type="text"
            value={data.feed?.controls || ""}
            onChange={handleChange}
            disabled
          />
          <Select
            label="Passline"
            name="passline"
            value={data.feed?.passline || ""}
            onChange={handleChange}
            options={PASSLINE_OPTIONS}
          />
          <Select
            label="Select Roll"
            name="typeOfRoll"
            value={data.straightener?.rolls?.typeOfRoll || ""}
            onChange={handleChange}
            options={ROLL_TYPE_OPTIONS}
          />
          <Select
            label="Reel Backplate"
            name="reelBackplate"
            value={data.reel?.backplate?.type || ""}
            onChange={handleChange}
            options={REEL_BACKPLATE_OPTIONS}
          />
          <Select
            label="Reel Style"
            name="reelStyle"
            value={data.reel?.style || ""}
            onChange={handleChange}
            options={REEL_STYLE_OPTIONS}
          />
          <Checkbox
            label="Light Gauge Non-Marking"
            name="lightGauge"
            checked={data.feed?.lightGuageNonMarking === "true"}
            onChange={handleChange}
          />
          <Checkbox
            label="Non-Marking"
            name="nonMarking"
            checked={data.feed?.nonMarking === "true"}
            onChange={handleChange}
          />
        </div>
      </Card>
    </div>
  );
};

export default MaterialSpecs;