import Card from "@/components/common/card";
import Input from "@/components/common/input";
import Text from "@/components/common/text";
import { useState } from "react";
import { useCreateTDDBHD } from "@/hooks/performance/use-create-tddbhd";
import { useGetTDDBHD } from "@/hooks/performance/use-get-tddbhd";
import Select from "@/components/common/select";
import {
  MATERIAL_TYPE_OPTIONS,
  YES_NO_OPTIONS,
  REEL_MODEL_OPTIONS,
  FEED_DIRECTION_OPTIONS,
  REEL_WIDTTH_OPTIONS,
  BACKPLATE_DIAMETER_OPTIONS,
  HYDRAULIC_THREADING_DRIVE_OPTIONS,
  HOLD_DOWN_ASSY_OPTIONS,
  HOLD_DOWN_CYLINDER_OPTIONS,
  BRAKE_MODEL_OPTIONS,
  BRAKE_QUANTITY_OPTIONS,
} from "@/utils/select-options";
import { usePerformanceSheet } from "@/contexts/performance.context";
import { useGetReelDrive } from "@/hooks/performance/use-get-reel-drive";
import { mapBackendToFrontendReelDrive } from "./reel-drive";

const VERSIONS = [
  "Maximum Thick",
  "Max @ Full",
  "Minimum Thick",
  "Max @ Width",
] as const;

type VersionKey = (typeof VERSIONS)[number];

type VersionedSection<T> = {
  [K in VersionKey]: T;
};

// Defensive helper to ensure all nested objects exist
function getSafeTDDBHD(raw: Partial<TDDBHDData> | undefined): TDDBHDData {
  return {
    referenceNumber: raw?.referenceNumber ?? "",
    customer: raw?.customer ?? "",
    date: raw?.date ?? "",
    reel: VERSIONS.reduce(
      (acc, v) => {
        acc[v] = { ...emptyReel, ...(raw?.reel?.[v] || {}) };
        return acc;
      },
      {} as VersionedSection<typeof emptyReel>
    ),
    coil: VERSIONS.reduce(
      (acc, v) => {
        acc[v] = { ...emptyCoil, ...(raw?.coil?.[v] || {}) };
        return acc;
      },
      {} as VersionedSection<typeof emptyCoil>
    ),
    brake: VERSIONS.reduce(
      (acc, v) => {
        acc[v] = { ...emptyBrake, ...(raw?.brake?.[v] || {}) };
        return acc;
      },
      {} as VersionedSection<typeof emptyBrake>
    ),
    threadingDrive: VERSIONS.reduce(
      (acc, v) => {
        acc[v] = {
          ...emptyThreadingDrive,
          ...(raw?.threadingDrive?.[v] || {}),
        };
        return acc;
      },
      {} as VersionedSection<typeof emptyThreadingDrive>
    ),
    holdDown: VERSIONS.reduce(
      (acc, v) => {
        acc[v] = { ...emptyHoldDown, ...(raw?.holdDown?.[v] || {}) };
        return acc;
      },
      {} as VersionedSection<typeof emptyHoldDown>
    ),
    cylinder: VERSIONS.reduce(
      (acc, v) => {
        acc[v] = { ...emptyCylinder, ...(raw?.cylinder?.[v] || {}) };
        return acc;
      },
      {} as VersionedSection<typeof emptyCylinder>
    ),
    dragBrake: VERSIONS.reduce(
      (acc, v) => {
        acc[v] = { ...emptyDragBrake, ...(raw?.dragBrake?.[v] || {}) };
        return acc;
      },
      {} as VersionedSection<typeof emptyDragBrake>
    ),
  };
}

// Add feedDirection and isTestRun to TDDBHDData type
export type TDDBHDData = {
  referenceNumber: string;
  customer: string;
  date: string;
  reel: VersionedSection<{
    reelModel: string;
    width: string;
    backplate: string;
    materialType: string;
    materialWidth: string;
    thickness: string;
    yieldStrength: string;
    airPressure: string;
    decelRate: string;
  }>;
  coil: VersionedSection<{
    weight: string;
    od: string;
    dispReel: string;
    webTensionPsi: string;
    webTensionLbs: string;
  }>;
  brake: VersionedSection<{
    padDiameter: string;
    cylinderBore: string;
    friction: string;
  }>;
  threadingDrive: VersionedSection<{
    airClutch: string;
    hydThreadingDrive: string;
    torqueAtMandrel: string;
    rewindTorque: string;
  }>;
  holdDown: VersionedSection<{
    assy: string;
    pressure: string;
    forceRequired: string;
    forceAvailable: string;
    minWidth: string;
  }>;
  cylinder: VersionedSection<{
    type: string;
    pressure: string;
  }>;
  dragBrake: VersionedSection<{
    reelModel: string;
    quantity: string;
    torqueRequired: string;
    failsafePSI: string;
    failsafeHoldingForce: string;
  }>;
};

const emptyReel = {
  reelModel: "",
  width: "",
  backplate: "",
  materialType: "",
  materialWidth: "",
  thickness: "",
  yieldStrength: "",
  airPressure: "",
  decelRate: "",
};
const emptyCoil = {
  weight: "",
  od: "",
  dispReel: "",
  webTensionPsi: "",
  webTensionLbs: "",
};
const emptyBrake = { padDiameter: "", cylinderBore: "", friction: "" };
const emptyThreadingDrive = {
  airClutch: "",
  hydThreadingDrive: "",
  torqueAtMandrel: "",
  rewindTorque: "",
};
const emptyHoldDown = {
  assy: "",
  pressure: "",
  forceRequired: "",
  forceAvailable: "",
  minWidth: "",
};
const emptyCylinder = { type: "", pressure: "" };
const emptyDragBrake = {
  reelModel: "",
  quantity: "",
  torqueRequired: "",
  failsafePSI: "",
  failsafeHoldingForce: "",
};

// Add feedDirection and isTestRun to defaultTDDBHDData
const defaultTDDBHDData: TDDBHDData = {
  referenceNumber: "",
  customer: "",
  date: "",
  reel: {
    "Maximum Thick": { ...emptyReel },
    "Max @ Full": { ...emptyReel },
    "Minimum Thick": { ...emptyReel },
    "Max @ Width": { ...emptyReel },
  },
  coil: {
    "Maximum Thick": { ...emptyCoil },
    "Max @ Full": { ...emptyCoil },
    "Minimum Thick": { ...emptyCoil },
    "Max @ Width": { ...emptyCoil },
  },
  brake: {
    "Maximum Thick": { ...emptyBrake },
    "Max @ Full": { ...emptyBrake },
    "Minimum Thick": { ...emptyBrake },
    "Max @ Width": { ...emptyBrake },
  },
  threadingDrive: {
    "Maximum Thick": { ...emptyThreadingDrive },
    "Max @ Full": { ...emptyThreadingDrive },
    "Minimum Thick": { ...emptyThreadingDrive },
    "Max @ Width": { ...emptyThreadingDrive },
  },
  holdDown: {
    "Maximum Thick": { ...emptyHoldDown },
    "Max @ Full": { ...emptyHoldDown },
    "Minimum Thick": { ...emptyHoldDown },
    "Max @ Width": { ...emptyHoldDown },
  },
  cylinder: {
    "Maximum Thick": { ...emptyCylinder },
    "Max @ Full": { ...emptyCylinder },
    "Minimum Thick": { ...emptyCylinder },
    "Max @ Width": { ...emptyCylinder },
  },
  dragBrake: {
    "Maximum Thick": { ...emptyDragBrake },
    "Max @ Full": { ...emptyDragBrake },
    "Minimum Thick": { ...emptyDragBrake },
    "Max @ Width": { ...emptyDragBrake },
  },
};

// Add mapping for material type label to value
const MATERIAL_TYPE_LABEL_TO_VALUE: Record<string, string> = Object.fromEntries(
  MATERIAL_TYPE_OPTIONS.map((opt) => [opt.label, opt.value])
);

// Reusable mapping function for backend TDDBHD data to context TDDBHDData
export function mapBackendToFrontendTDDBHD(
  backendData: any,
  prevTddbhd?: Partial<TDDBHDData>
): TDDBHDData {
  const versionMap = [
    { key: "Maximum Thick", prefix: "max" },
    { key: "Max @ Full", prefix: "full" },
    { key: "Minimum Thick", prefix: "min" },
    { key: "Max @ Width", prefix: "width" },
  ];
  const buildReel = (prefix: string) => ({
    reelModel: "",
    width: backendData[`${prefix}_material_width`] ?? "",
    backplate: "",
    materialType:
      MATERIAL_TYPE_LABEL_TO_VALUE[backendData[`${prefix}_material_type`]] ??
      backendData[`${prefix}_material_type`] ??
      "",
    materialWidth: backendData[`${prefix}_material_width`] ?? "",
    thickness: backendData[`${prefix}_material_thickness`] ?? "",
    yieldStrength: backendData[`${prefix}_yield_strength`] ?? "",
    airPressure: "",
    decelRate: "",
  });
  const buildCoil = (prefix: string) => ({
    weight: backendData[`${prefix}_coil_weight`] ?? "",
    od: backendData[`${prefix}_coil_od`] ?? "",
    dispReel: "",
    webTensionPsi: "",
    webTensionLbs: "",
  });
  const buildBrake = (prefix: string) => ({
    padDiameter: "",
    cylinderBore: "",
    friction: "",
  });
  const buildThreadingDrive = (prefix: string) => ({
    airClutch: "",
    hydThreadingDrive: "",
    torqueAtMandrel: "",
    rewindTorque: "",
  });
  const buildHoldDown = (prefix: string) => ({
    assy: "",
    pressure: "",
    forceRequired: "",
    forceAvailable: "",
    minWidth: "",
  });
  const buildCylinder = (prefix: string) => ({
    type: "",
    pressure: "",
  });
  const buildDragBrake = (prefix: string) => ({
    reelModel: "",
    quantity: "",
    torqueRequired: "",
    failsafePSI: "",
    failsafeHoldingForce: "",
  });
  const reel: any = {};
  const coil: any = {};
  const brake: any = {};
  const threadingDrive: any = {};
  const holdDown: any = {};
  const cylinder: any = {};
  const dragBrake: any = {};
  versionMap.forEach(({ key, prefix }) => {
    reel[key] = buildReel(prefix);
    coil[key] = buildCoil(prefix);
    brake[key] = buildBrake(prefix);
    threadingDrive[key] = buildThreadingDrive(prefix);
    holdDown[key] = buildHoldDown(prefix);
    cylinder[key] = buildCylinder(prefix);
    dragBrake[key] = buildDragBrake(prefix);
  });
  // Always map referenceNumber from backend data, fallback to previous value
  const referenceNumber =
    backendData.reference ||
    backendData.referenceNumber ||
    prevTddbhd?.referenceNumber ||
    "";
  return {
    referenceNumber,
    customer:
      backendData.customer ||
      backendData.customer ||
      prevTddbhd?.customer ||
      "",
    date: backendData.date || prevTddbhd?.date || "",
    reel,
    coil,
    brake,
    threadingDrive,
    holdDown,
    cylinder,
    dragBrake,
  };
}

export default function TDDBHD() {
  const { performanceSheet, updatePerformanceSheet, setPerformanceSheet } =
    usePerformanceSheet();
  const [confirmed, setConfirmed] = useState(false);
  const [status, setStatus] = useState<string>("");
  const {
    createTDDBHD,
    isLoading: isSaving,
    status: backendStatus,
  } = useCreateTDDBHD();
  const {
    getTDDBHD,
    isLoading: isGetting,
    status: getBackendStatus,
  } = useGetTDDBHD();
  const { getReelDrive } = useGetReelDrive();

  // Ensure tddbhd is initialized in context
  const tddbhd = getSafeTDDBHD(performanceSheet.tddbhd);
  // If tddbhd is missing, initialize it in context
  if (!performanceSheet.tddbhd) {
    updatePerformanceSheet({ tddbhd: getSafeTDDBHD(undefined) });
  }

  function handleInputChange(
    section:
      | "reel"
      | "coil"
      | "brake"
      | "threadingDrive"
      | "holdDown"
      | "cylinder"
      | "dragBrake",
    field: string,
    value: string
  ) {
    updatePerformanceSheet({
      tddbhd: {
        ...tddbhd,
        [section]: {
          ...tddbhd[section],
          "Maximum Thick": {
            ...tddbhd[section]?.[VERSIONS[0]],
            [field]: value,
          },
        },
      },
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    updatePerformanceSheet({
      tddbhd: {
        ...tddbhd,
        [name]: value,
      },
    });
  }

  async function handleGetData() {
    if (!tddbhd.referenceNumber) {
      setStatus("No reference number.");
      return;
    }
    try {
      setStatus("Fetching from backend...");
      const backendData = await getTDDBHD(tddbhd.referenceNumber);
      if (backendData) {
        // Map flat backend fields to versioned frontend structure
        const versionMap = [
          { key: "Maximum Thick", prefix: "max" },
          { key: "Max @ Full", prefix: "full" },
          { key: "Minimum Thick", prefix: "min" },
          { key: "Max @ Width", prefix: "width" },
        ];
        const buildReel = (prefix: string) => ({
          reelModel: "",
          width: backendData[`${prefix}_material_width`] ?? "",
          backplate: "",
          materialType:
            MATERIAL_TYPE_LABEL_TO_VALUE[
              backendData[`${prefix}_material_type`]
            ] ??
            backendData[`${prefix}_material_type`] ??
            "",
          materialWidth: backendData[`${prefix}_material_width`] ?? "",
          thickness: backendData[`${prefix}_material_thickness`] ?? "",
          yieldStrength: backendData[`${prefix}_yield_strength`] ?? "",
          airPressure: "",
          decelRate: "",
        });
        const buildCoil = (prefix: string) => ({
          weight: backendData[`${prefix}_coil_weight`] ?? "",
          od: backendData[`${prefix}_coil_od`] ?? "",
          dispReel: "",
          webTensionPsi: "",
          webTensionLbs: "",
        });
        const buildBrake = (prefix: string) => ({
          padDiameter: "",
          cylinderBore: "",
          friction: "",
        });
        const buildThreadingDrive = (prefix: string) => ({
          airClutch: "",
          hydThreadingDrive: "",
          torqueAtMandrel: "",
          rewindTorque: "",
        });
        const buildHoldDown = (prefix: string) => ({
          assy: "",
          pressure: "",
          forceRequired: "",
          forceAvailable: "",
          minWidth: "",
        });
        const buildCylinder = (prefix: string) => ({
          type: "",
          pressure: "",
        });
        const buildDragBrake = (prefix: string) => ({
          reelModel: "",
          quantity: "",
          torqueRequired: "",
          failsafePSI: "",
          failsafeHoldingForce: "",
        });
        const reel: any = {};
        const coil: any = {};
        const brake: any = {};
        const threadingDrive: any = {};
        const holdDown: any = {};
        const cylinder: any = {};
        const dragBrake: any = {};
        versionMap.forEach(({ key, prefix }) => {
          reel[key] = buildReel(prefix);
          coil[key] = buildCoil(prefix);
          brake[key] = buildBrake(prefix);
          threadingDrive[key] = buildThreadingDrive(prefix);
          holdDown[key] = buildHoldDown(prefix);
          cylinder[key] = buildCylinder(prefix);
          dragBrake[key] = buildDragBrake(prefix);
        });
        setPerformanceSheet((prev) => ({
          ...prev,
          tddbhd: {
            ...tddbhd,
            referenceNumber:
              backendData.reference || tddbhd.referenceNumber || "",
            customer:
              backendData.customer ||
              backendData.customer ||
              tddbhd.customer ||
              "",
            date: backendData.date || tddbhd.date || "",
            reel,
            coil,
            brake,
            threadingDrive,
            holdDown,
            cylinder,
            dragBrake,
          },
        }));
        // Also fetch Reel Drive and update context
        console.log("Fetching Reel Drive with refNum:", tddbhd.referenceNumber);
        getReelDrive(tddbhd.referenceNumber).then((reelDriveData) => {
          console.log("Reel Drive backend data:", reelDriveData);
          if (reelDriveData) {
            setPerformanceSheet((prev) => ({
              ...prev,
              reelDrive: mapBackendToFrontendReelDrive(
                reelDriveData,
                prev.reelDrive
              ),
            }));
          }
        });
        setStatus("Loaded from backend.");
      } else {
        setStatus("No saved data found.");
      }
    } catch (err) {
      setStatus("Backend unavailable. No saved data found.");
    }
  }

  async function handleSetData() {
    if (!tddbhd.referenceNumber) {
      setStatus("No reference number.");
      return;
    }
    const tddbhdFormData = {
      referenceNumber: tddbhd.referenceNumber,
      customer: tddbhd.customer,
      date: tddbhd.date,
      reel: tddbhd.reel,
      coil: tddbhd.coil,
      brake: tddbhd.brake,
      threadingDrive: tddbhd.threadingDrive,
      holdDown: tddbhd.holdDown,
      cylinder: tddbhd.cylinder,
      dragBrake: tddbhd.dragBrake,
    };
    try {
      setStatus("Saving to backend...");
      await createTDDBHD(tddbhdFormData as any);
      setStatus("Saved to backend.");
    } catch (err) {
      setStatus("Backend unavailable. Unable to save.");
    }
  }

  const data = getSafeTDDBHD(performanceSheet.tddbhd);

  return (
    <div className="w-full flex flex-1 flex-col p-2 gap-2">
      {/* Customer and Date Info */}
      <Card className="mb-0 p-4">
        <Text
          as="h3"
          className="mb-4 text-lg font-medium">
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
            name="date"
            type="date"
            value={data.date || ""}
            onChange={handleChange}
          />
        </div>
      </Card>
      {/* Version Tabs and Badge */}
      <Card className="mb-0 p-4">
        <Text
          as="h3"
          className="mb-4 text-lg font-medium">
          Reel & Material Specs
        </Text>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <Input
            label="Reel Model"
            value={data.reel["Maximum Thick"]?.reelModel || ""}
            onChange={(e) =>
              handleInputChange("reel", "reelModel", e.target.value)
            }
          />
          <Select
            label="Reel Width"
            value={data.reel["Maximum Thick"]?.width || ""}
            onChange={(e) => handleInputChange("reel", "width", e.target.value)}
            options={REEL_WIDTTH_OPTIONS.map((opt) => ({
              value: opt.value,
              label: opt.Label,
            }))}
          />
          <Select
            label="Backplate Diameter"
            value={data.reel["Maximum Thick"]?.backplate || ""}
            onChange={(e) =>
              handleInputChange("reel", "backplate", e.target.value)
            }
            options={BACKPLATE_DIAMETER_OPTIONS.map((opt) => ({
              value: opt.value,
              label: opt.Label,
            }))}
          />
          <Select
            label="Material Type"
            value={data.reel["Maximum Thick"]?.materialType || ""}
            onChange={(e) =>
              handleInputChange("reel", "materialType", e.target.value)
            }
            options={MATERIAL_TYPE_OPTIONS}
          />
          <Input
            label="Material Width (in)"
            value={data.reel["Maximum Thick"]?.materialWidth || ""}
            onChange={(e) =>
              handleInputChange("reel", "materialWidth", e.target.value)
            }
          />
          <Input
            label="Material Thickness (in)"
            value={data.reel["Maximum Thick"]?.thickness || ""}
            onChange={(e) =>
              handleInputChange("reel", "thickness", e.target.value)
            }
          />
          <Input
            label="Material Yield Strength (psi)"
            value={data.reel["Maximum Thick"]?.yieldStrength || ""}
            onChange={(e) =>
              handleInputChange("reel", "yieldStrength", e.target.value)
            }
          />
          <Input
            label="Air Pressure Available (psi)"
            value={data.reel["Maximum Thick"]?.airPressure || ""}
            onChange={(e) =>
              handleInputChange("reel", "airPressure", e.target.value)
            }
          />
          <Input
            label="Required Decel. Rate (ft/sec²)"
            value={data.reel["Maximum Thick"]?.decelRate || ""}
            onChange={(e) =>
              handleInputChange("reel", "decelRate", e.target.value)
            }
          />
        </div>
        <Card className="mb-4 p-4">
          <Text
            as="h3"
            className="mb-4 text-lg font-medium">
            Coil, Brake & Other Specs
          </Text>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Input
              label="Coil Weight (lbs)"
              value={data.coil["Maximum Thick"]?.weight || ""}
              onChange={(e) =>
                handleInputChange("coil", "weight", e.target.value)
              }
            />
            <Input
              label="Coil O.D. (in)"
              value={data.coil["Maximum Thick"]?.od || ""}
              onChange={(e) => handleInputChange("coil", "od", e.target.value)}
            />
            <Input
              label="Disp. (Reel) Mtr."
              value={data.coil["Maximum Thick"]?.dispReel || ""}
              onChange={(e) =>
                handleInputChange("coil", "dispReel", e.target.value)
              }
            />
            <Input
              label="Web Tension (psi)"
              value={data.coil["Maximum Thick"]?.webTensionPsi || ""}
              onChange={(e) =>
                handleInputChange("coil", "webTensionPsi", e.target.value)
              }
            />
            <Input
              label="Web Tension (lbs)"
              value={data.coil["Maximum Thick"]?.webTensionLbs || ""}
              onChange={(e) =>
                handleInputChange("coil", "webTensionLbs", e.target.value)
              }
            />
            <Input
              label="Brake Pad Diameter (in)"
              value={data.brake["Maximum Thick"]?.padDiameter || ""}
              onChange={(e) =>
                handleInputChange("brake", "padDiameter", e.target.value)
              }
            />
            <Input
              label="Cylinder Bore (in)"
              value={data.brake["Maximum Thick"]?.cylinderBore || ""}
              onChange={(e) =>
                handleInputChange("brake", "cylinderBore", e.target.value)
              }
            />
            <Input
              label="Coefficient of Friction"
              value={data.brake["Maximum Thick"]?.friction || ""}
              onChange={(e) =>
                handleInputChange("brake", "friction", e.target.value)
              }
            />
          </div>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Card className="p-4">
            <Text
              as="h3"
              className="mb-4 text-lg font-medium">
              Threading Drive
            </Text>
            <Input
              label="Air Clutch"
              value={data.threadingDrive["Maximum Thick"]?.airClutch || ""}
              onChange={(e) =>
                handleInputChange("threadingDrive", "airClutch", e.target.value)
              }
            />
            <Select
              label="Hyd. Threading Drive"
              value={
                data.threadingDrive["Maximum Thick"]?.hydThreadingDrive || ""
              }
              onChange={(e) =>
                handleInputChange(
                  "threadingDrive",
                  "hydThreadingDrive",
                  e.target.value
                )
              }
              options={HYDRAULIC_THREADING_DRIVE_OPTIONS}
            />
            <Input
              label="Torque At Mandrel (in. lbs.)"
              value={
                data.threadingDrive["Maximum Thick"]?.torqueAtMandrel || ""
              }
              onChange={(e) =>
                handleInputChange(
                  "threadingDrive",
                  "torqueAtMandrel",
                  e.target.value
                )
              }
            />
            <Input
              label="Rewind Torque Req. (in. lbs.)"
              value={data.threadingDrive["Maximum Thick"]?.rewindTorque || ""}
              onChange={(e) =>
                handleInputChange(
                  "threadingDrive",
                  "rewindTorque",
                  e.target.value
                )
              }
            />
          </Card>
          <Card className="p-4">
            <Text
              as="h3"
              className="mb-4 text-lg font-medium">
              Hold Down
            </Text>
            <Select
              label="Hold Down Assy"
              value={data.holdDown["Maximum Thick"]?.assy || ""}
              onChange={(e) =>
                handleInputChange("holdDown", "assy", e.target.value)
              }
              options={HOLD_DOWN_ASSY_OPTIONS}
            />
            <Input
              label="Holddown Pressure (psi)"
              value={data.holdDown["Maximum Thick"]?.pressure || ""}
              onChange={(e) =>
                handleInputChange("holdDown", "pressure", e.target.value)
              }
            />
            <Input
              label="Hold Down Force Required (lbs)"
              value={data.holdDown["Maximum Thick"]?.forceRequired || ""}
              onChange={(e) =>
                handleInputChange("holdDown", "forceRequired", e.target.value)
              }
            />
            <Input
              label="Hold Down Force Available (lbs)"
              value={data.holdDown["Maximum Thick"]?.forceAvailable || ""}
              onChange={(e) =>
                handleInputChange("holdDown", "forceAvailable", e.target.value)
              }
            />
            <Input
              label="Min. Material Width (in)"
              value={data.holdDown["Maximum Thick"]?.minWidth || ""}
              onChange={(e) =>
                handleInputChange("holdDown", "minWidth", e.target.value)
              }
            />
          </Card>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Card className="p-4">
            <Text
              as="h3"
              className="mb-4 text-lg font-medium">
              Cylinder
            </Text>
            <Select
              label="Type"
              value={data.cylinder["Maximum Thick"]?.type || ""}
              onChange={(e) =>
                handleInputChange("cylinder", "type", e.target.value)
              }
              options={HOLD_DOWN_CYLINDER_OPTIONS}
            />
            <Input
              label="Pressure (psi)"
              value={data.cylinder["Maximum Thick"]?.pressure || ""}
              onChange={(e) =>
                handleInputChange("cylinder", "pressure", e.target.value)
              }
            />
          </Card>
          <Card className="p-4">
            <Text
              as="h3"
              className="mb-4 text-lg font-medium">
              Drag Brake
            </Text>
            <Select
              label="Brake Model"
              value={data.dragBrake["Maximum Thick"]?.reelModel || ""}
              onChange={(e) =>
                handleInputChange("dragBrake", "reelModel", e.target.value)
              }
              options={BRAKE_MODEL_OPTIONS}
            />
            <Select
              label="Brake Quantity"
              value={data.dragBrake["Maximum Thick"]?.quantity || ""}
              onChange={(e) =>
                handleInputChange("dragBrake", "quantity", e.target.value)
              }
              options={BRAKE_QUANTITY_OPTIONS}
            />
            <Input
              label="Torque Required (in. lbs.)"
              value={data.dragBrake["Maximum Thick"]?.torqueRequired || ""}
              onChange={(e) =>
                handleInputChange("dragBrake", "torqueRequired", e.target.value)
              }
            />
            <Input
              label="Failsafe - Single Stage (psi air req.)"
              value={data.dragBrake["Maximum Thick"]?.failsafePSI || ""}
              onChange={(e) =>
                handleInputChange("dragBrake", "failsafePSI", e.target.value)
              }
            />
            <Input
              label="Failsafe Holding Force (in. lbs.)"
              value={
                data.dragBrake["Maximum Thick"]?.failsafeHoldingForce || ""
              }
              onChange={(e) =>
                handleInputChange(
                  "dragBrake",
                  "failsafeHoldingForce",
                  e.target.value
                )
              }
            />
          </Card>
        </div>
      </Card>
      {status && (
        <div className="text-center text-xs text-primary mt-2">{status}</div>
      )}
      {backendStatus && (
        <div className="text-center text-xs text-primary mt-2">
          {backendStatus}
        </div>
      )}
      {getBackendStatus && (
        <div className="text-center text-xs text-primary mt-2">
          {getBackendStatus}
        </div>
      )}
    </div>
  );
}
