import { useEffect } from "react";
import Input from "@/components/common/input";
import Select from "@/components/common/select";
import Checkbox from "@/components/common/checkbox";
import Text from "@/components/common/text";
import { Card } from "@/components";
import {
  useCreateMaterialSpecs,
  calculateMaterialSpecsVariant,
} from "@/hooks/performance/use-create-material-specs";
import { useGetMaterialSpecs } from "@/hooks/performance/use-get-material-specs";
import {
  usePerformanceSheet,
} from "@/contexts/performance.context";
import { 
  mapBackendToMaterialSpecs,
  mapBackendToTDDBHD,
  mapBackendToReelDrive 
} from "@/utils/universal-mapping";
import { useGetTDDBHD } from "@/hooks/performance/use-get-tddbhd";
import { useGetReelDrive } from "@/hooks/performance/use-get-reel-drive";
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

const MaterialSpecs = () => {
  const { 
    performanceData, 
    updatePerformanceData, 
  } = usePerformanceSheet();
  
  const { errors } = useCreateMaterialSpecs();
  const { fetchedMaterialSpecs } = useGetMaterialSpecs();
  const { getTDDBHD } = useGetTDDBHD();
  const { getReelDrive } = useGetReelDrive();

  // Get coil width boundaries from the nested structure
  const coilWidthMin = Number(performanceData.coil?.minCoilWidth) || undefined;
  const coilWidthMax = Number(performanceData.coil?.maxCoilWidth) || undefined;

  useEffect(() => {
    if (fetchedMaterialSpecs) {
      const data =
        typeof fetchedMaterialSpecs === "object" && "material_specs" in fetchedMaterialSpecs && fetchedMaterialSpecs.material_specs
          ? (fetchedMaterialSpecs as any).material_specs
          : fetchedMaterialSpecs;
      
      // Map backend Material Specs data to new nested structure using universal mapping
      const mappedData = mapBackendToMaterialSpecs(data, performanceData);
      updatePerformanceData(mappedData);
      
      // Fetch related data
      const refNum = mappedData.referenceNumber || performanceData.referenceNumber;
      if (refNum) {
        console.log("Fetching TDDBHD with refNum:", refNum);
        getTDDBHD(refNum).then((tddbhdData) => {
          console.log("TDDBHD backend data:", tddbhdData);
          if (tddbhdData) {
            // Map TDDBHD data to nested structure using universal mapping
            const tddbhdMappedData = mapBackendToTDDBHD(tddbhdData, performanceData);
            updatePerformanceData(tddbhdMappedData);
            console.log("TDDBHD data mapped:", tddbhdMappedData);
          }
        });

        console.log("Fetching Reel Drive with refNum:", refNum);
        getReelDrive(refNum).then((reelDriveData) => {
          console.log("Reel Drive backend data:", reelDriveData);
          if (reelDriveData) {
            // Map Reel Drive data to nested structure using universal mapping
            const reelDriveMappedData = mapBackendToReelDrive(reelDriveData, performanceData);
            updatePerformanceData(reelDriveMappedData);
            console.log("Reel Drive data mapped:", reelDriveMappedData);
          }
        });
      }
    }
  }, [fetchedMaterialSpecs, updatePerformanceData, getTDDBHD, getReelDrive]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
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
        referenceNumber: {
          referenceNumber: value,
        },
        customer: {
          customer: value,
        },
        date: {
          dates: {
            ...performanceData.dates,
            date: value,
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
        feedControls: {
          feed: {
            ...performanceData.feed,
            controls: value,
          },
        },
        passline: {
          feed: {
            ...performanceData.feed,
            passline: value,
          },
        },
        typeOfRoll: {
          straightener: {
            ...performanceData.straightener,
            rolls: {
              ...performanceData.straightener?.rolls,
              typeOfRoll: value,
            },
          },
        },
        reelBackplate: {
          reel: {
            ...performanceData.reel,
            backplate: {
              ...performanceData.reel?.backplate,
              type: value,
            },
          },
        },
        reelStyle: {
          reel: {
            ...performanceData.reel,
            style: value,
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

    // Trigger calculation if all required fields are present
    setTimeout(() => {
      if (hasAllRequiredFields(performanceData.material, performanceData.coil)) {
        triggerCalculation();
      }
    }, 500);
  };

  const triggerCalculation = async () => {
    const material = performanceData.material;
    const coil = performanceData.coil;

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

    // Call backend
    try {
      const result = await calculateMaterialSpecsVariant(payload);
      
      // Update calculated fields in nested structure
      updatePerformanceData({
        material: {
          ...material,
          minBendRadius: result["min_bend_rad"],
          minLoopLength: result["min_loop_length"],
          calculatedCoilOD: result["coil_od_calculated"],
        },
      });
    } catch (e) {
      console.error("Calculation error:", e);
    }
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

      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Material Specifications
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Coil Width (in)"
            name="material.coilWidth"
            value={performanceData.material?.coilWidth || ""}
            onChange={handleChange}
            type="number"
            min={coilWidthMin}
            max={coilWidthMax}
          />
          <Input
            label="Coil Weight (Max)"
            name="coil.maxCoilWeight"
            value={performanceData.coil?.maxCoilWeight || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Material Thickness (in)"
            name="material.materialThickness"
            value={performanceData.material?.materialThickness || ""}
            onChange={handleChange}
            type="number"
          />
          <Select
            label="Material Type"
            name="material.materialType"
            value={performanceData.material?.materialType || ""}
            onChange={handleChange}
            options={MATERIAL_TYPE_OPTIONS}
          />
          <Input
            label="Yield Strength (psi)"
            name="material.maxYieldStrength"
            value={performanceData.material?.maxYieldStrength || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Material Tensile (psi)"
            name="material.maxTensileStrength"
            value={performanceData.material?.maxTensileStrength || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Coil I.D."
            name="coil.coilID"
            value={performanceData.coil?.coilID || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Coil O.D."
            name="coil.maxCoilOD"
            value={performanceData.coil?.maxCoilOD || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Min Bend Radius (in)"
            name="material.minBendRadius"
            value={performanceData.material?.minBendRadius || ""}
            onChange={handleChange}
            type="number"
            readOnly
          />
          <Input
            label="Min Loop Length (ft)"
            name="material.minLoopLength"
            value={performanceData.material?.minLoopLength || ""}
            onChange={handleChange}
            type="number"
            readOnly
          />
          <Input
            label="Coil O.D. Calculated"
            name="material.calculatedCoilOD"
            value={performanceData.material?.calculatedCoilOD || ""}
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
            value={performanceData.feed?.direction || ""}
            onChange={handleChange}
            options={FEED_DIRECTION_OPTIONS}
            error={errors.feedDirection ? "Required" : ""}
          />
          <Select
            label="Select Controls Level"
            name="controlsLevel"
            value={performanceData.feed?.controlsLevel || ""}
            onChange={handleChange}
            options={CONTROLS_LEVEL_OPTIONS}
            error={errors.controlsLevel ? "Required" : ""}
          />
          <Select
            label="Type of Line"
            name="typeOfLine"
            value={performanceData.feed?.typeOfLine || ""}
            onChange={handleChange}
            options={TYPE_OF_LINE_OPTIONS}
            error={errors.typeOfLine ? "Required" : ""}
          />
          <Input
            label="Feed Controls"
            name="feedControls"
            type="text"
            value={performanceData.feed?.controls || ""}
            onChange={handleChange}
            error={errors.feedControls ? "Required" : ""}
            disabled
          />
          <Select
            label="Passline"
            name="passline"
            value={performanceData.feed?.passline || ""}
            onChange={handleChange}
            options={PASSLINE_OPTIONS}
            error={errors.passline ? "Required" : ""}
          />
          <Select
            label="Select Roll"
            name="typeOfRoll"
            value={performanceData.straightener?.rolls?.typeOfRoll || ""}
            onChange={handleChange}
            options={ROLL_TYPE_OPTIONS}
            error={errors.typeOfRoll ? "Required" : ""}
          />
          <Select
            label="Reel Backplate"
            name="reelBackplate"
            value={performanceData.reel?.backplate?.type || ""}
            onChange={handleChange}
            options={REEL_BACKPLATE_OPTIONS}
            error={errors.reelBackplate ? "Required" : ""}
          />
          <Select
            label="Reel Style"
            name="reelStyle"
            value={performanceData.reel?.style || ""}
            onChange={handleChange}
            options={REEL_STYLE_OPTIONS}
            error={errors.reelStyle ? "Required" : ""}
          />
          <Checkbox
            label="Light Gauge Non-Marking"
            name="lightGauge"
            checked={performanceData.feed?.lightGuageNonMarking === "true"}
            onChange={handleChange}
          />
          <Checkbox
            label="Non-Marking"
            name="nonMarking"
            checked={performanceData.feed?.nonMarking === "true"}
            onChange={handleChange}
          />
        </div>
      </Card>

      {/* Error Display */}
      {errors && Object.keys(errors).length > 0 && (
        <div className="text-center text-xs text-red-500 mt-2">
          {Object.entries(errors).map(([key, value]) => (
            <div key={key}>{key}: {Array.isArray(value) ? value.join(', ') : value}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MaterialSpecs;