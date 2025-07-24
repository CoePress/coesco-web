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
import { 
  mapBackendToRFQ,
  mapBackendToTDDBHD,
  mapBackendToReelDrive 
} from "@/utils/universal-mapping";
import { useGetTDDBHD } from "@/hooks/performance/use-get-tddbhd";
import { useGetReelDrive } from "@/hooks/performance/use-get-reel-drive";

const RFQ = () => {
  const { performanceData, updatePerformanceData } = usePerformanceSheet();
  const { errors } = useCreateRFQ();
  const { fetchedRFQ } = useGetRFQ();
  const { getTDDBHD } = useGetTDDBHD();
  const { getReelDrive } = useGetReelDrive();

  useEffect(() => {
    if (fetchedRFQ) {
      const data =
        typeof fetchedRFQ === "object" && "rfq" in fetchedRFQ && fetchedRFQ.rfq
          ? (fetchedRFQ as any).rfq
          : fetchedRFQ;
      
      // Map backend RFQ data to new nested structure using universal mapping
      const mappedData = mapBackendToRFQ(data, performanceData);
      updatePerformanceData(mappedData);
      
      // Fetch related data
      const refNum = mappedData.referenceNumber || performanceData.referenceNumber;
      if (refNum) {
        getTDDBHD(refNum).then((tddbhdData) => {
          if (tddbhdData) {
            // Map TDDBHD data to nested structure using universal mapping
            const tddbhdMappedData = mapBackendToTDDBHD(tddbhdData, performanceData);
            updatePerformanceData(tddbhdMappedData);
            console.log("TDDBHD data mapped:", tddbhdMappedData);
          }
        });
        
        getReelDrive(refNum).then((reelDriveData) => {
          if (reelDriveData) {
            // Map Reel Drive data to nested structure using universal mapping
            const reelDriveMappedData = mapBackendToReelDrive(reelDriveData, performanceData);
            updatePerformanceData(reelDriveMappedData);
            console.log("Reel Drive data mapped:", reelDriveMappedData);
          }
        });
      }
    }
  }, [fetchedRFQ, updatePerformanceData, getTDDBHD, getReelDrive]);

  // Helper: check if all required fields are present for calculation
  function hasAllRequiredFieldsRFQ() {
    const material = performanceData.material;
    const coil = performanceData.coil;
    
    return (
      material?.materialType &&
      material?.materialThickness &&
      material?.maxYieldStrength &&
      material?.coilWidth &&
      coil?.maxCoilWeight &&
      coil?.coilID
    );
  }

  // Helper: trigger backend calculation
  async function triggerCalculationRFQ() {
    if (!hasAllRequiredFieldsRFQ()) return;

    const material = performanceData.material;
    const coil = performanceData.coil;

    const payload = {
      material_type: material?.materialType || "",
      material_thickness: Number(material?.materialThickness || 0),
      yield_strength: Number(material?.maxYieldStrength || 0),
      material_width: Number(material?.coilWidth || 0),
      coil_weight_max: Number(coil?.maxCoilWeight || 0),
      coil_id: Number(coil?.coilID || 0),
    };

    try {
      const result = await pythonInstance.post(
        "/material_specs/calculate_variant",
        payload
      );
      
      updatePerformanceData({
        material: {
          ...material,
          minBendRadius: result.data["min_bend_rad"],
          minLoopLength: result.data["min_loop_length"],
          calculatedCoilOD: result.data["coil_od_calculated"],
        },
      });
    } catch (e) {
      console.error("Calculation error:", e);
    }
  }

  const fetchFPM = async (
    feed_length: string,
    spm: string,
    key: "average" | "max" | "min"
  ) => {
    const length = parseFloat(feed_length);
    const spmVal = parseFloat(spm);
    if (!length || !spmVal) return;
    
    try {
      const res = await pythonInstance.post("/rfq/calculate_fpm", {
        feed_length: length,
        spm: spmVal,
      });
      
      const fpmValue = res.data.fpm?.toString() ?? "";
      
      updatePerformanceData({
        feed: {
          ...performanceData.feed,
          [key]: {
            ...performanceData.feed?.[key],
            fpm: fpmValue,
          },
        },
      });
    } catch (error) {
      console.error("FPM calculation error:", error);
    }
  };

  useEffect(() => {
    const avgLength = performanceData.feed?.average?.length;
    const avgSPM = performanceData.feed?.average?.spm;
    if (avgLength && avgSPM) {
      fetchFPM(avgLength.toString(), avgSPM.toString(), "average");
    }
  }, [performanceData.feed?.average?.length, performanceData.feed?.average?.spm]);

  useEffect(() => {
    const maxLength = performanceData.feed?.max?.length;
    const maxSPM = performanceData.feed?.max?.spm;
    if (maxLength && maxSPM) {
      fetchFPM(maxLength.toString(), maxSPM.toString(), "max");
    }
  }, [performanceData.feed?.max?.length, performanceData.feed?.max?.spm]);

  useEffect(() => {
    const minLength = performanceData.feed?.min?.length;
    const minSPM = performanceData.feed?.min?.spm;
    if (minLength && minSPM) {
      fetchFPM(minLength.toString(), minSPM.toString(), "min");
    }
  }, [performanceData.feed?.min?.length, performanceData.feed?.min?.spm]);

  const handleChange = (e: any) => {
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
      // Handle top-level fields
      updatePerformanceData({
        [name]: actualValue,
      });
    }

    // Trigger calculation if needed
    setTimeout(() => {
      if (hasAllRequiredFieldsRFQ()) {
        triggerCalculationRFQ();
      }
    }, 500);
  };

  return (
    <div className="w-full flex flex-1 flex-col p-2 gap-2">
      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Basic Information
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Input
            label="Reference Number"
            name="referenceNumber"
            value={performanceData.referenceNumber || ""}
            onChange={handleChange}
            error={errors.referenceNumber ? "Required" : ""}
          />
          <Input
            label="Date"
            type="date"
            name="dates.date"
            value={performanceData.dates?.date || ""}
            onChange={handleChange}
            error={errors.date ? "Required" : ""}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Input
            label="Company Name"
            name="customer"
            value={performanceData.customer || ""}
            onChange={handleChange}
            error={errors.customer ? "Required" : ""}
          />
          <Input
            label="State/Province"
            name="customerInfo.state"
            value={performanceData.customerInfo?.state || ""}
            onChange={handleChange}
          />
          <Input
            label="Street Address"
            name="customerInfo.streetAddress"
            value={performanceData.customerInfo?.streetAddress || ""}
            onChange={handleChange}
          />
          <Input
            label="ZIP/Postal Code"
            name="customerInfo.zip"
            value={performanceData.customerInfo?.zip || ""}
            onChange={handleChange}
          />
          <Input
            label="City"
            name="customerInfo.city"
            value={performanceData.customerInfo?.city || ""}
            onChange={handleChange}
          />
          <Input
            label="Country"
            name="customerInfo.country"
            value={performanceData.customerInfo?.country || ""}
            onChange={handleChange}
          />
          <Input
            label="Contact Name"
            name="customerInfo.contactName"
            value={performanceData.customerInfo?.contactName || ""}
            onChange={handleChange}
          />
          <Input
            label="Position"
            name="customerInfo.position"
            value={performanceData.customerInfo?.position || ""}
            onChange={handleChange}
          />
          <Input
            label="Phone"
            name="customerInfo.phoneNumber"
            value={performanceData.customerInfo?.phoneNumber || ""}
            onChange={handleChange}
          />
          <Input
            label="Email"
            name="customerInfo.email"
            value={performanceData.customerInfo?.email || ""}
            onChange={handleChange}
          />
          <Input
            label="Dealer Name"
            name="customerInfo.dealerName"
            value={performanceData.customerInfo?.dealerName || ""}
            onChange={handleChange}
          />
          <Input
            label="Dealer Salesman"
            name="customerInfo.dealerSalesman"
            value={performanceData.customerInfo?.dealerSalesman || ""}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="How many days/week is the company running?"
            name="customerInfo.daysPerWeek"
            value={performanceData.customerInfo?.daysPerWeek || ""}
            onChange={handleChange}
          />
          <Input
            label="How many shifts/day is the company running?"
            name="customerInfo.shiftsPerDay"
            value={performanceData.customerInfo?.shiftsPerDay || ""}
            onChange={handleChange}
          />
          <Select
            label="Line Application"
            name="feed.application"
            value={performanceData.feed?.application || ""}
            onChange={handleChange}
            options={[
              { value: "pressFeed", label: "Press Feed" },
              { value: "cutToLength", label: "Cut To Length" },
              { value: "standalone", label: "Standalone" },
            ]}
          />
          <Select
            label="Type of Line"
            name="feed.typeOfLine"
            value={performanceData.feed?.typeOfLine || ""}
            onChange={handleChange}
            options={TYPE_OF_LINE_OPTIONS}
          />
          <Select
            label="Pull Through"
            name="feed.pullThru.isPullThru"
            value={performanceData.feed?.pullThru?.isPullThru || ""}
            onChange={handleChange}
            options={YES_NO_OPTIONS}
            error={errors.pullThrough ? "Required" : ""}
          />
        </div>
      </Card>

      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Coil Specifications
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Input
            label="Max Coil Width (in)"
            name="coil.maxCoilWidth"
            value={performanceData.coil?.maxCoilWidth || ""}
            onChange={handleChange}
            type="number"
            error={errors.coilWidthMax ? "Required" : ""}
          />
          <Input
            label="Min Coil Width (in)"
            name="coil.minCoilWidth"
            value={performanceData.coil?.minCoilWidth || ""}
            onChange={handleChange}
            type="number"
            error={errors.coilWidthMin ? "Required" : ""}
          />
          <Input
            label="Max Coil O.D. (in)"
            name="coil.maxCoilOD"
            value={performanceData.coil?.maxCoilOD || ""}
            onChange={handleChange}
            type="number"
            error={errors.maxCoilOD ? "Required" : ""}
          />
          <Input
            label="Coil I.D. (in)"
            name="coil.coilID"
            value={performanceData.coil?.coilID || ""}
            onChange={handleChange}
            type="number"
            error={errors.coilID ? "Required" : ""}
          />
          <Input
            label="Max Coil Weight (lbs)"
            name="coil.maxCoilWeight"
            value={performanceData.coil?.maxCoilWeight || ""}
            onChange={handleChange}
            type="number"
            error={errors.coilWeightMax ? "Required" : ""}
          />
          <Input
            label="Max Coil Handling Capacity (lbs)"
            type="number"
            name="coil.maxCoilHandlingCap"
            value={performanceData.coil?.maxCoilHandlingCap || ""}
            onChange={handleChange}
          />
        </div>

        <div className="mb-6">
          <div className="flex flex-wrap gap-6">
            <Checkbox
              label="Slit Edge"
              name="coil.slitEdge"
              checked={performanceData.coil?.slitEdge === "true"}
              onChange={handleChange}
              error={errors.slitEdge ? "At least one required" : ""}
            />
            <Checkbox
              label="Mill Edge"
              name="coil.millEdge"
              checked={performanceData.coil?.millEdge === "true"}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Will a coil car be required?"
            name="coil.requireCoilCar"
            value={performanceData.coil?.requireCoilCar || ""}
            onChange={handleChange}
            options={YES_NO_OPTIONS}
          />
          <Select
            label="Will you be running off the Backplate?"
            name="coil.runningOffBackplate"
            value={performanceData.coil?.runningOffBackplate || ""}
            onChange={handleChange}
            options={YES_NO_OPTIONS}
          />
          <Select
            label="Are you running partial coils, i.e. will you require rewinding?"
            name="coil.requireRewinding"
            value={performanceData.coil?.requireRewinding || ""}
            onChange={handleChange}
            options={YES_NO_OPTIONS}
          />
        </div>
      </Card>

      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Material Specifications
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
          <Input
            label="Highest Yield/most challenging Mat Spec (thick)"
            name="material.materialThickness"
            value={performanceData.material?.materialThickness || ""}
            onChange={handleChange}
            type="number"
            error={errors["material.materialThickness"] ? "Required" : ""}
          />
          <Input
            label="at Width (in)"
            name="material.coilWidth"
            value={performanceData.material?.coilWidth || ""}
            onChange={handleChange}
            type="number"
            error={errors["material.coilWidth"] ? "Required" : ""}
          />
          <Select
            label="Material Type"
            name="material.materialType"
            value={performanceData.material?.materialType || ""}
            onChange={handleChange}
            options={MATERIAL_TYPE_OPTIONS}
            error={errors["material.materialType"] ? "Required" : ""}
          />
          <Input
            label="Max Yield Strength (PSI)"
            name="material.maxYieldStrength"
            value={performanceData.material?.maxYieldStrength || ""}
            onChange={handleChange}
            type="number"
            error={errors["material.maxYieldStrength"] ? "Required" : ""}
          />
          <Input
            label="Max Tensile Strength (PSI)"
            name="material.maxTensileStrength"
            value={performanceData.material?.maxTensileStrength || ""}
            onChange={handleChange}
            type="number"
            error={errors["material.maxTensileStrength"] ? "Required" : ""}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Select
            label="Does the surface finish matter? Are they running a cosmetic material?"
            name="runningCosmeticMaterial"
            value={performanceData.runningCosmeticMaterial || ""}
            onChange={handleChange}
            options={[
              { value: "No", label: "No" },
              { value: "Yes", label: "Yes" },
            ]}
            error={errors.cosmeticMaterial ? "Required" : ""}
          />
          <Input
            label="Current brand of feed equipment"
            name="brandOfFeed"
            value={performanceData.brandOfFeed || ""}
            onChange={handleChange}
          />
        </div>
      </Card>

      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Type of Press
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Checkbox
            label="Gap Frame Press"
            name="press.gapFramePress"
            checked={performanceData.press?.gapFramePress === "true"}
            onChange={handleChange}
          />
          <Checkbox
            label="Hydraulic Press"
            name="press.hydraulicPress"
            checked={performanceData.press?.hydraulicPress === "true"}
            onChange={handleChange}
          />
          <Checkbox
            label="OBI"
            name="press.obi"
            checked={performanceData.press?.obi === "true"}
            onChange={handleChange}
          />
          <Checkbox
            label="Servo Press"
            name="press.servoPress"
            checked={performanceData.press?.servoPress === "true"}
            onChange={handleChange}
          />
          <Checkbox
            label="Shear Die Application"
            name="press.shearDieApplication"
            checked={performanceData.press?.shearDieApplication === "true"}
            onChange={handleChange}
          />
          <Checkbox
            label="Straight Side Press"
            name="press.straightSidePress"
            checked={performanceData.press?.straightSidePress === "true"}
            onChange={handleChange}
          />
          <Checkbox
            label="Other"
            name="press.other"
            checked={performanceData.press?.other === "true"}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            label="Tonnage of Press"
            name="press.tonnageOfPress"
            value={performanceData.press?.tonnageOfPress || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Press Bed Area: Width (in)"
            name="press.bedWidth"
            value={performanceData.press?.bedWidth || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Length (in)"
            name="press.bedLength"
            value={performanceData.press?.bedLength || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Press Stroke Length (in)"
            name="press.strokeLength"
            value={performanceData.press?.strokeLength || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Window Opening Size of Press (in)"
            name="press.windowSize"
            value={performanceData.press?.windowSize || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Press Max SPM"
            name="press.maxSPM"
            value={performanceData.press?.maxSPM || ""}
            onChange={handleChange}
            type="number"
            error={errors.maxSPM ? "Required" : ""}
          />
        </div>
      </Card>

      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Type of Dies
        </Text>
        <div className="mb-6">
          <div className="flex flex-wrap gap-6">
            <Checkbox
              label="Transfer Dies"
              name="dies.transferDies"
              checked={performanceData.dies?.transferDies === "true"}
              onChange={handleChange}
            />
            <Checkbox
              label="Progressive Dies"
              name="dies.progressiveDies"
              checked={performanceData.dies?.progressiveDies === "true"}
              onChange={handleChange}
              required
              error={errors.dies ? "At least one required" : ""}
            />
            <Checkbox
              label="Blanking Dies"
              name="dies.blankingDies"
              checked={performanceData.dies?.blankingDies === "true"}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Input
            label="Average feed length"
            name="feed.average.length"
            value={performanceData.feed?.average?.length || ""}
            onChange={handleChange}
            type="number"
            error={errors.avgFeedLen ? "Required" : ""}
          />
          <Input
            label="at (SPM)"
            name="feed.average.spm"
            value={performanceData.feed?.average?.spm || ""}
            onChange={handleChange}
            type="number"
            error={errors.avgFeedSPM ? "Required" : ""}
          />
          <Input
            label="Feed Speed (FPM)"
            name="feed.average.fpm"
            value={performanceData.feed?.average?.fpm || ""}
            readOnly
            disabled
          />
          <Input
            label="Maximum feed length"
            name="feed.max.length"
            value={performanceData.feed?.max?.length || ""}
            onChange={handleChange}
            type="number"
            error={errors.maxFeedLen ? "Required" : ""}
          />
          <Input
            label="at (SPM)"
            name="feed.max.spm"
            value={performanceData.feed?.max?.spm || ""}
            onChange={handleChange}
            type="number"
            error={errors.maxFeedSPM ? "Required" : ""}
          />
          <Input
            label="Feed Speed (FPM)"
            name="feed.max.fpm"
            value={performanceData.feed?.max?.fpm || ""}
            readOnly
            disabled
          />
          <Input
            label="Minimum feed length"
            name="feed.min.length"
            value={performanceData.feed?.min?.length || ""}
            onChange={handleChange}
            type="number"
            error={errors.minFeedLen ? "Required" : ""}
          />
          <Input
            label="at (SPM)"
            name="feed.min.spm"
            value={performanceData.feed?.min?.spm || ""}
            onChange={handleChange}
            type="number"
            error={errors.minFeedSPM ? "Required" : ""}
          />
          <Input
            label="Feed Speed (FPM)"
            name="feed.min.fpm"
            value={performanceData.feed?.min?.fpm || ""}
            readOnly
            disabled
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Voltage Required (VAC)"
            name="voltageRequired"
            value={performanceData.voltageRequired || ""}
            onChange={handleChange}
            type="number"
            error={errors.voltage ? "Required" : ""}
          />
        </div>
      </Card>

      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Space & Mounting
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Input
            label="Space allotment Length (ft)"
            name="equipmentSpaceLength"
            value={performanceData.equipmentSpaceLength || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Width (ft)"
            name="equipmentSpaceWidth"
            value={performanceData.equipmentSpaceWidth || ""}
            onChange={handleChange}
            type="number"
          />
        </div>

        <div className="space-y-4 mb-6">
          <Input
            label="Are there any walls or columns obstructing the equipment's location?"
            name="obstructions"
            value={performanceData.obstructions || ""}
            onChange={handleChange}
          />
          <Input
            label="Can the feeder be mounted to the press?"
            name="mount.feederMountedToPress"
            value={performanceData.mount?.feederMountedToPress || ""}
            onChange={handleChange}
          />
          <Input
            label="If 'YES', we must verify there is adequate structural support to mount to. Is there adequate support?"
            name="mount.adequateSupport"
            value={performanceData.mount?.adequateSupport || ""}
            onChange={handleChange}
          />
          <Input
            label="If 'No', it will require a cabinet. Will you need custom mounting plate(s)?"
            name="mount.customMounting"
            value={performanceData.mount?.customMounting || ""}
            onChange={handleChange}
          />
          <Input
            label="Passline Height (in):"
            name="feed.passline"
            value={performanceData.feed?.passline || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Will there be a loop pit?"
            name="loopPit"
            value={performanceData.loopPit || ""}
            onChange={handleChange}
          />
          <Input
            label="Is coil change time a concern?"
            name="coil.changeTimeConcern"
            value={performanceData.coil?.changeTimeConcern || ""}
            onChange={handleChange}
          />
          <Input
            label="If so, what is your coil change time goal? (min)"
            name="coil.timeChangeGoal"
            value={performanceData.coil?.timeChangeGoal || ""}
            onChange={handleChange}
            type="number"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Select
            label="Feed Direction"
            name="feed.direction"
            value={performanceData.feed?.direction || ""}
            onChange={handleChange}
            options={FEED_DIRECTION_OPTIONS}
            error={errors.feedDirection ? "Required" : ""}
          />
          <Input
            label="Coil Loading"
            name="coil.loading"
            value={performanceData.coil?.loading || ""}
            onChange={handleChange}
            error={errors.coilLoading ? "Required" : ""}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Will your line require guarding or special safety requirements?"
            name="requireGuarding"
            value={performanceData.requireGuarding || ""}
            onChange={handleChange}
          />
        </div>
      </Card>

      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Timeline & Delivery
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Input
            label="When will decision be made on project?"
            name="dates.decisionDate"
            type="date"
            value={performanceData.dates?.decisionDate || ""}
            onChange={handleChange}
          />
          <Input
            label="Ideal Delivery Date"
            name="dates.idealDeliveryDate"
            type="date"
            value={performanceData.dates?.idealDeliveryDate || ""}
            onChange={handleChange}
          />
          <Input
            label="Earliest date customer can accept delivery"
            name="dates.earliestDeliveryDate"
            type="date"
            value={performanceData.dates?.earliestDeliveryDate || ""}
            onChange={handleChange}
          />
          <Input
            label="Latest date customer can accept delivery"
            name="dates.latestDeliveryDate"
            type="date"
            value={performanceData.dates?.latestDeliveryDate || ""}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Textarea
            label="Special Considerations"
            name="specialConsiderations"
            value={performanceData.specialConsiderations || ""}
            onChange={handleChange}
            rows={3}
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

export default RFQ;