import { useEffect } from "react";
import Input from "@/components/common/input";
import Select from "@/components/common/select";
import Checkbox from "@/components/common/checkbox";
import Textarea from "@/components/common/textarea";
import Text from "@/components/common/text";
import Card from "@/components/common/card";
import { useCreateRFQ } from "@/hooks/performance/use-create-rfq";
import { useGetRFQ } from "@/hooks/performance/use-get-rfq";
import { pythonInstance } from "@/utils";
import {
  TYPE_OF_LINE_OPTIONS,
  MATERIAL_TYPE_OPTIONS,
  YES_NO_OPTIONS,
  FEED_DIRECTION_OPTIONS,
} from "@/utils/select-options";
import { usePerformanceSheet } from "@/contexts/performance.context";
import { mapBackendToFrontendRFQ } from "@/utils/rfq-mapping";
import { PerformanceSheetState } from "@/contexts/performance.context";
import { useGetTDDBHD } from "@/hooks/performance/use-get-tddbhd";
import { mapBackendToFrontendTDDBHD } from "./tddbhd";
import { useGetReelDrive } from "@/hooks/performance/use-get-reel-drive";
import { mapBackendToFrontendReelDrive } from "./reel-drive";

// Helper to safely access versioned fields by key
const getVersioned = (
  ps: PerformanceSheetState,
  key: "maxThick" | "atFull" | "minThick" | "atWidth"
) => ps[key];

const RFQ = () => {
  const { performanceSheet, updatePerformanceSheet, setPerformanceSheet } =
    usePerformanceSheet();
  const { isLoading, status, errors, createRFQ } = useCreateRFQ();
  const {
    isLoading: isGetting,
    status: getStatus,
    fetchedRFQ,
    getRFQ,
  } = useGetRFQ();
  const { getTDDBHD } = useGetTDDBHD();
  const { getReelDrive } = useGetReelDrive();

  useEffect(() => {
    if (fetchedRFQ) {
      const data =
        typeof fetchedRFQ === "object" && "rfq" in fetchedRFQ && fetchedRFQ.rfq
          ? (fetchedRFQ as any).rfq
          : fetchedRFQ;
      const mapped = mapBackendToFrontendRFQ(data);
      setPerformanceSheet((prev) => ({
        ...prev,
        ...mapped,
      }));
      // Also fetch TDDBHD and Reel Drive and update context
      const refNum =
        performanceSheet.referenceNumber || (mapped as any).referenceNumber;
      if (refNum) {
        console.log("Fetching TDDBHD with refNum:", refNum);
        getTDDBHD(refNum).then((tddbhdData) => {
          console.log("TDDBHD backend data:", tddbhdData);
          if (tddbhdData) {
            setPerformanceSheet((prev) => ({
              ...prev,
              tddbhd: mapBackendToFrontendTDDBHD(tddbhdData, prev.tddbhd),
            }));
          }
        });
        console.log("Fetching Reel Drive with refNum:", refNum);
        getReelDrive(refNum).then((reelDriveData) => {
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
      }
      // After setting, attempt backend calculations for each versioned spec
      const versions = ["maxThick", "atFull", "minThick", "atWidth"] as const;
      versions.forEach((versionKey) => {
        const versionData = mapped[versionKey];
        if (versionData && hasAllRequiredFieldsRFQ(versionData)) {
          triggerCalculationRFQ(versionKey, versionData);
        }
      });
    }
  }, [fetchedRFQ, setPerformanceSheet]);

  // Helper: check if all required fields are present for calculation (RFQ context)
  function hasAllRequiredFieldsRFQ(versionData: any) {
    return (
      versionData.coilWeight &&
      versionData.coilID &&
      versionData.materialType &&
      versionData.materialThickness &&
      versionData.yieldStrength &&
      versionData.coilWidth
    );
  }

  // Helper: trigger backend calculation for a version (RFQ context)
  async function triggerCalculationRFQ(versionKey: string, versionData: any) {
    const coilWeight =
      versionData.coilWeight !== undefined &&
      versionData.coilWeight !== null &&
      versionData.coilWeight !== ""
        ? Number(versionData.coilWeight)
        : 0;
    const payload = {
      material_type:
        typeof versionData.materialType === "string"
          ? versionData.materialType
          : "",
      material_thickness: Number(versionData.materialThickness ?? 0),
      yield_strength: Number(versionData.yieldStrength ?? 0),
      material_width: Number(versionData.coilWidth ?? 0),
      coil_weight_max: coilWeight,
      coil_id: Number(versionData.coilID ?? 0),
    };
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
    try {
      // Use the same calculation endpoint as Material Specs
      const result = await pythonInstance.post(
        "/material_specs/calculate_variant",
        payload
      );
      setPerformanceSheet((prev) => ({
        ...prev,
        [versionKey]: {
          ...(getVersioned(prev, versionKey as any) || {}),
          minBendRad: result.data["min_bend_rad"],
          minLoopLength: result.data["min_loop_length"],
          coilODCalculated: result.data["coil_od_calculated"],
        },
      }));
    } catch (e) {
      // Optionally handle error
    }
  }

  const fetchFPM = async (
    feed_length: string,
    spm: string,
    key: "avgFPM" | "maxFPM" | "minFPM"
  ) => {
    const length = parseFloat(feed_length);
    const spmVal = parseFloat(spm);
    if (!length || !spmVal) {
      updatePerformanceSheet({ [key]: "" });
      return;
    }
    try {
      const res = await pythonInstance.post("/rfq/calculate_fpm", {
        feed_length: length,
        spm: spmVal,
      });
      updatePerformanceSheet({ [key]: res.data.fpm?.toString() ?? "" });
    } catch {
      updatePerformanceSheet({ [key]: "" });
    }
  };

  useEffect(() => {
    fetchFPM(
      performanceSheet.avgFeedLen,
      performanceSheet.avgFeedSPM,
      "avgFPM"
    );
  }, [performanceSheet.avgFeedLen, performanceSheet.avgFeedSPM]);
  useEffect(() => {
    fetchFPM(
      performanceSheet.maxFeedLen,
      performanceSheet.maxFeedSPM,
      "maxFPM"
    );
  }, [performanceSheet.maxFeedLen, performanceSheet.maxFeedSPM]);
  useEffect(() => {
    fetchFPM(
      performanceSheet.minFeedLen,
      performanceSheet.minFeedSPM,
      "minFPM"
    );
  }, [performanceSheet.minFeedLen, performanceSheet.minFeedSPM]);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    if (name.includes("pressType.")) {
      updatePerformanceSheet({
        pressType: {
          ...performanceSheet.pressType,
          [name.split(".")[1]]: type === "checkbox" ? checked : value,
        },
      });
    } else if (name.includes("dies.")) {
      updatePerformanceSheet({
        dies: {
          ...performanceSheet.dies,
          [name.split(".")[1]]: checked,
        },
      });
    } else if (name.startsWith("maxThick")) {
      const [spec, field] = name.split(".");
      if (
        spec === "maxThick" ||
        spec === "atFull" ||
        spec === "minThick" ||
        spec === "atWidth"
      ) {
        updatePerformanceSheet({
          [spec]: {
            ...performanceSheet[
              spec as "maxThick" | "atFull" | "minThick" | "atWidth"
            ],
            [field]: value,
          },
        });
      }
    } else {
      updatePerformanceSheet({
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };

  const handleGet = async () => {
    await getRFQ(performanceSheet.referenceNumber);
  };

  return (
    <div className="w-full flex flex-1 flex-col p-2 gap-2">
      <Card className="mb-0 p-4">
        <Text
          as="h3"
          className="mb-4 text-lg font-medium">
          Basic Information
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Input
            label="Date"
            type="date"
            name="date"
            value={performanceSheet.date}
            onChange={handleChange}
            error={errors.date ? "Required" : ""}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Input
            label="Company Name"
            name="customer"
            value={performanceSheet.customer}
            onChange={handleChange}
            error={errors.customer ? "Required" : ""}
          />
          <Input
            label="State/Province"
            name="state"
            value={performanceSheet.state}
            onChange={handleChange}
          />
          <Input
            label="Street Address"
            name="streetAddress"
            value={performanceSheet.streetAddress}
            onChange={handleChange}
          />
          <Input
            label="ZIP/Postal Code"
            name="zip"
            value={performanceSheet.zip}
            onChange={handleChange}
          />
          <Input
            label="City"
            name="city"
            value={performanceSheet.city}
            onChange={handleChange}
          />
          <Input
            label="Country"
            name="country"
            value={performanceSheet.country}
            onChange={handleChange}
          />
          <Input
            label="Contact Name"
            name="contactName"
            value={performanceSheet.contactName}
            onChange={handleChange}
          />
          <Input
            label="Position"
            name="position"
            value={performanceSheet.position}
            onChange={handleChange}
          />
          <Input
            label="Phone"
            name="phone"
            value={performanceSheet.phone}
            onChange={handleChange}
          />
          <Input
            label="Email"
            name="email"
            value={performanceSheet.email}
            onChange={handleChange}
          />
          <Input
            label="Dealer Name"
            name="dealerName"
            value={performanceSheet.dealerName}
            onChange={handleChange}
          />
          <Input
            label="Dealer Salesman"
            name="dealerSalesman"
            value={performanceSheet.dealerSalesman}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="How many days/week is the company running?"
            name="daysPerWeek"
            value={performanceSheet.daysPerWeek}
            onChange={handleChange}
          />
          <Input
            label="How many shifts/day is the company running?"
            name="shiftsPerDay"
            value={performanceSheet.shiftsPerDay}
            onChange={handleChange}
          />
          <Select
            label="Line Application"
            name="lineApplication"
            value={performanceSheet.lineApplication}
            onChange={handleChange}
            options={[
              { value: "pressFeed", label: "Press Feed" },
              { value: "cutToLength", label: "Cut To Length" },
              { value: "standalone", label: "Standalone" },
            ]}
          />
          <Select
            label="Type of Line"
            name="typeOfLine"
            value={performanceSheet.typeOfLine}
            onChange={handleChange}
            options={TYPE_OF_LINE_OPTIONS}
          />
          <Select
            label="Pull Through"
            name="pullThrough"
            value={performanceSheet.pullThrough}
            onChange={handleChange}
            options={YES_NO_OPTIONS}
            error={errors.pullThrough ? "Required" : ""}
          />
        </div>
      </Card>

      <Card className="mb-0 p-4">
        <Text
          as="h3"
          className="mb-4 text-lg font-medium">
          Coil Specifications
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Input
            label="Max Coil Width (in)"
            name="coilWidthMax"
            value={performanceSheet.coilWidthMax}
            onChange={handleChange}
            type="number"
            error={errors.coilWidthMax ? "Required" : ""}
          />
          <Input
            label="Min Coil Width (in)"
            name="coilWidthMin"
            value={performanceSheet.coilWidthMin}
            onChange={handleChange}
            type="number"
            error={errors.coilWidthMin ? "Required" : ""}
          />
          <Input
            label="Max Coil O.D. (in)"
            name="maxCoilOD"
            value={performanceSheet.maxCoilOD}
            onChange={handleChange}
            type="number"
            error={errors.maxCoilOD ? "Required" : ""}
          />
          <Input
            label="Coil I.D. (in)"
            name="coilID"
            value={performanceSheet.coilID}
            onChange={handleChange}
            type="number"
            error={errors.coilID ? "Required" : ""}
          />
          <Input
            label="Max Coil Weight (lbs)"
            name="coilWeightMax"
            value={performanceSheet.coilWeightMax}
            onChange={handleChange}
            type="number"
            error={errors.coilWeightMax ? "Required" : ""}
          />
          <Input
            label="Max Coil Handling Capacity (lbs)"
            type="number"
            name="coilHandlingMax"
            value={performanceSheet.coilHandlingMax}
            onChange={handleChange}
          />
        </div>

        <div className="mb-6">
          <div className="flex flex-wrap gap-6">
            <Checkbox
              label="Slit Edge"
              name="slitEdge"
              checked={performanceSheet.slitEdge}
              onChange={handleChange}
              error={errors.slitEdge ? "At least one required" : ""}
            />
            <Checkbox
              label="Mill Edge"
              name="millEdge"
              checked={performanceSheet.millEdge}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Will a coil car be required?"
            name="coilCarRequired"
            value={performanceSheet.coilCarRequired}
            onChange={handleChange}
            options={YES_NO_OPTIONS}
          />
          <Select
            label="Will you be running off the Backplate?"
            name="runOffBackplate"
            value={performanceSheet.runOffBackplate}
            onChange={handleChange}
            options={YES_NO_OPTIONS}
          />
          <Select
            label="Are you running partial coils, i.e. will you require rewinding?"
            name="requireRewinding"
            value={performanceSheet.requireRewinding}
            onChange={handleChange}
            options={YES_NO_OPTIONS}
          />
        </div>
      </Card>

      <Card className="mb-0 p-4">
        <Text
          as="h3"
          className="mb-4 text-lg font-medium">
          Material Specifications
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
          <Input
            label="Highest Yield/most challenging Mat Spec (thick)"
            name="maxThick.materialThickness"
            value={performanceSheet.maxThick.materialThickness}
            onChange={handleChange}
            type="number"
            error={errors["maxThick.materialThickness"] ? "Required" : ""}
          />
          <Input
            label="at Width (in)"
            name="maxThick.coilWidth"
            value={performanceSheet.maxThick.coilWidth}
            onChange={handleChange}
            type="number"
            error={errors["maxThick.coilWidth"] ? "Required" : ""}
          />
          <Select
            label="Material Type"
            name="maxThick.materialType"
            value={performanceSheet.maxThick.materialType}
            onChange={handleChange}
            options={MATERIAL_TYPE_OPTIONS}
          />
          <Input
            label="Max Yield Strength (PSI)"
            name="maxThick.yieldStrength"
            value={performanceSheet.maxThick.yieldStrength}
            onChange={handleChange}
            type="number"
            error={errors["maxThick.yieldStrength"] ? "Required" : ""}
          />
          <Input
            label="Max Tensile Strength (PSI)"
            name="maxThick.materialTensile"
            value={performanceSheet.maxThick.materialTensile}
            onChange={handleChange}
            type="number"
            error={errors["maxThick.materialTensile"] ? "Required" : ""}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Select
            label="Does the surface finish matter? Are they running a cosmetic material?"
            name="cosmeticMaterial"
            value={performanceSheet.cosmeticMaterial}
            onChange={handleChange}
            options={[
              { value: "No", label: "No" },
              { value: "Yes", label: "Yes" },
            ]}
            error={errors.cosmeticMaterial ? "Required" : ""}
          />
          <Input
            label="Current brand of feed equipment"
            name="feedEquipment"
            value={performanceSheet.feedEquipment}
            onChange={handleChange}
          />
        </div>
      </Card>

      <Card className="mb-0 p-4">
        <Text
          as="h3"
          className="mb-4 text-lg font-medium">
          Type of Press
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Checkbox
            label="Gap Frame Press"
            name="pressType.gapFrame"
            checked={performanceSheet.pressType.gapFrame}
            onChange={handleChange}
          />
          <Checkbox
            label="Hydraulic Press"
            name="pressType.hydraulic"
            checked={performanceSheet.pressType.hydraulic}
            onChange={handleChange}
          />
          <Checkbox
            label="OBI"
            name="pressType.obi"
            checked={performanceSheet.pressType.obi}
            onChange={handleChange}
          />
          <Checkbox
            label="Servo Press"
            name="pressType.servo"
            checked={performanceSheet.pressType.servo}
            onChange={handleChange}
          />
          <Checkbox
            label="Shear Die Application"
            name="pressType.shearDie"
            checked={performanceSheet.pressType.shearDie}
            onChange={handleChange}
          />
          <Checkbox
            label="Straight Side Press"
            name="pressType.straightSide"
            checked={performanceSheet.pressType.straightSide}
            onChange={handleChange}
          />
          <Checkbox
            label="Other"
            name="pressType.other"
            checked={performanceSheet.pressType.other}
            onChange={handleChange}
          />

          {performanceSheet.pressType.other && (
            <Input
              label="Other..."
              name="pressType.otherText"
              value={performanceSheet.pressType.otherText}
              onChange={handleChange}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            label="Tonnage of Press"
            name="tonnage"
            value={performanceSheet.tonnage}
            onChange={handleChange}
          />
          <Input
            label="Press Bed Area: Width (in)"
            name="pressBedWidth"
            value={performanceSheet.pressBedWidth}
            onChange={handleChange}
          />
          <Input
            label="Length (in)"
            name="pressBedLength"
            value={performanceSheet.pressBedLength}
            onChange={handleChange}
          />
          <Input
            label="Press Stroke Length (in)"
            name="pressStroke"
            value={performanceSheet.pressStroke}
            onChange={handleChange}
          />
          <Input
            label="Window Opening Size of Press (in)"
            name="windowOpening"
            value={performanceSheet.windowOpening}
            onChange={handleChange}
          />
          <Input
            label="Press Max SPM"
            name="maxSPM"
            value={performanceSheet.maxSPM}
            onChange={handleChange}
            error={errors.maxSPM ? "Required" : ""}
          />
        </div>
      </Card>

      <Card className="mb-0 p-4">
        <Text
          as="h3"
          className="mb-4 text-lg font-medium">
          Type of Dies
        </Text>
        <div className="mb-6">
          <div className="flex flex-wrap gap-6">
            <Checkbox
              label="Transfer Dies"
              name="dies.transfer"
              checked={performanceSheet.dies.transfer}
              onChange={handleChange}
            />
            <Checkbox
              label="Progressive Dies"
              name="dies.progressive"
              checked={performanceSheet.dies.progressive}
              onChange={handleChange}
              required
              error={errors.dies ? "At least one required" : ""}
            />
            <Checkbox
              label="Blanking Dies"
              name="dies.blanking"
              checked={performanceSheet.dies.blanking}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Input
            label="Average feed length"
            name="avgFeedLen"
            value={performanceSheet.avgFeedLen}
            onChange={handleChange}
            error={errors.avgFeedLen ? "Required" : ""}
          />
          <Input
            label="at (SPM)"
            name="avgFeedSPM"
            value={performanceSheet.avgFeedSPM}
            onChange={handleChange}
            error={errors.avgFeedSPM ? "Required" : ""}
          />
          <Input
            label="Feed Speed (FPM)"
            name="avgFPM"
            value={performanceSheet.avgFPM}
            readOnly
            disabled
          />
          <Input
            label="Maximum feed length"
            name="maxFeedLen"
            value={performanceSheet.maxFeedLen}
            onChange={handleChange}
            error={errors.maxFeedLen ? "Required" : ""}
          />
          <Input
            label="at (SPM)"
            name="maxFeedSPM"
            value={performanceSheet.maxFeedSPM}
            onChange={handleChange}
            error={errors.maxFeedSPM ? "Required" : ""}
          />
          <Input
            label="Feed Speed (FPM)"
            name="maxFPM"
            value={performanceSheet.maxFPM}
            readOnly
            disabled
          />
          <Input
            label="Minimum feed length"
            name="minFeedLen"
            value={performanceSheet.minFeedLen}
            onChange={handleChange}
            error={errors.minFeedLen ? "Required" : ""}
          />
          <Input
            label="at (SPM)"
            name="minFeedSPM"
            value={performanceSheet.minFeedSPM}
            onChange={handleChange}
            error={errors.minFeedSPM ? "Required" : ""}
          />
          <Input
            label="Feed Speed (FPM)"
            name="minFPM"
            value={performanceSheet.minFPM}
            readOnly
            disabled
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Voltage Required (VAC)"
            name="voltage"
            value={performanceSheet.voltage}
            onChange={handleChange}
            error={errors.voltage ? "Required" : ""}
          />
        </div>
      </Card>

      <Card className="mb-0 p-4">
        <Text
          as="h3"
          className="mb-4 text-lg font-medium">
          Space & Mounting
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Input
            label="Space allotment Length (ft)"
            name="spaceLength"
            value={performanceSheet.spaceLength}
            onChange={handleChange}
          />
          <Input
            label="Width (ft)"
            name="spaceWidth"
            value={performanceSheet.spaceWidth}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-4 mb-6">
          <Input
            label="Are there any walls or columns obstructing the equipment's location?"
            name="obstructions"
            value={performanceSheet.obstructions}
            onChange={handleChange}
          />
          <Input
            label="Can the feeder be mounted to the press?"
            name="mountToPress"
            value={performanceSheet.mountToPress}
            onChange={handleChange}
          />
          <Input
            label="If 'YES', we must verify there is adequate structural support to mount to. Is there adequate support?"
            name="adequateSupport"
            value={performanceSheet.adequateSupport}
            onChange={handleChange}
          />
          <Input
            label="If 'No', it will require a cabinet. Will you need custom mounting plate(s)?"
            name="needMountingPlates"
            value={performanceSheet.needMountingPlates}
            onChange={handleChange}
          />
          <Input
            label="Passline Height (in):"
            name="passlineHeight"
            value={performanceSheet.passlineHeight}
            onChange={handleChange}
          />
          <Input
            label="Will there be a loop pit?"
            name="loopPit"
            value={performanceSheet.loopPit}
            onChange={handleChange}
          />
          <Input
            label="Is coil change time a concern?"
            name="coilChangeConcern"
            value={performanceSheet.coilChangeConcern}
            onChange={handleChange}
          />
          <Input
            label="If so, what is your coil change time goal? (min)"
            name="coilChangeTime"
            value={performanceSheet.coilChangeTime}
            onChange={handleChange}
          />
          <Input
            label="What are reasons you experience unplanned downtime?"
            name="downtimeReasons"
            value={performanceSheet.downtimeReasons}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Select
            label="Feed Direction"
            name="feedDirection"
            value={performanceSheet.feedDirection}
            onChange={handleChange}
            options={FEED_DIRECTION_OPTIONS}
            error={errors.feedDirection ? "Required" : ""}
          />
          <Input
            label="Coil Loading"
            name="coilLoading"
            value={performanceSheet.coilLoading}
            onChange={handleChange}
            error={errors.coilLoading ? "Required" : ""}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Will your line require guarding or special safety requirements?"
            name="safetyRequirements"
            value={performanceSheet.safetyRequirements}
            onChange={handleChange}
          />
        </div>
      </Card>

      <Card className="mb-0 p-4">
        <Text
          as="h3"
          className="mb-4 text-lg font-medium">
          Timeline & Delivery
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Input
            label="When will decision be made on project?"
            name="decisionDate"
            type="date"
            value={performanceSheet.decisionDate}
            onChange={handleChange}
          />
          <Input
            label="Ideal Delivery Date"
            name="idealDelivery"
            type="date"
            value={performanceSheet.idealDelivery}
            onChange={handleChange}
          />
          <Input
            label="Earliest date customer can accept delivery"
            name="earliestDelivery"
            type="date"
            value={performanceSheet.earliestDelivery}
            onChange={handleChange}
          />
          <Input
            label="Latest date customer can accept delivery"
            name="latestDelivery"
            type="date"
            value={performanceSheet.latestDelivery}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Textarea
            label="Special Considerations"
            name="specialConsiderations"
            value={performanceSheet.specialConsiderations}
            onChange={handleChange}
            rows={3}
          />
        </div>
      </Card>
    </div>
  );
};

export default RFQ;
