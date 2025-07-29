import { useEffect } from "react";
import Input from "@/components/common/input";
import Select from "@/components/common/select";
import Checkbox from "@/components/common/checkbox";
import Textarea from "@/components/common/textarea";
import Text from "@/components/common/text";
import Card from "@/components/common/card";
import {
  TYPE_OF_LINE_OPTIONS,
  MATERIAL_TYPE_OPTIONS,
  YES_NO_OPTIONS,
  FEED_DIRECTION_OPTIONS,
} from "@/utils/select-options";
import { PerformanceData } from "@/contexts/performance.context";

export interface RFQProps {
  data: PerformanceData;
  isEditing: boolean;
  onChange: (updates: Partial<PerformanceData>) => void;
}

const RFQ: React.FC<RFQProps> = ({ data, isEditing, onChange }) => {
  useEffect(() => {
    
  }, [onChange]);

  // Helper: check if all required fields are present for calculation
  function hasAllRequiredFieldsRFQ() {
    const material = data.material;
    const coil = data.coil;
    
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

  }

  const fetchFPM = async (
    feed_length: string,
    spm: string,
  ) => {
    const length = parseFloat(feed_length);
    const spmVal = parseFloat(spm);
    if (!length || !spmVal) return;
    
  };

  useEffect(() => {
    const avgLength = data.feed?.average?.length;
    const avgSPM = data.feed?.average?.spm;
    if (avgLength && avgSPM) {
      fetchFPM(avgLength.toString(), avgSPM.toString());
    }
  }, [data.feed?.average?.length, data.feed?.average?.spm]);

  useEffect(() => {
    const maxLength = data.feed?.max?.length;
    const maxSPM = data.feed?.max?.spm;
    if (maxLength && maxSPM) {
      fetchFPM(maxLength.toString(), maxSPM.toString());
    }
  }, [data.feed?.max?.length, data.feed?.max?.spm]);

  useEffect(() => {
    const minLength = data.feed?.min?.length;
    const minSPM = data.feed?.min?.spm;
    if (minLength && minSPM) {
      fetchFPM(minLength.toString(), minSPM.toString());
    }
  }, [data.feed?.min?.length, data.feed?.min?.spm]);

  const handleChange = (e: any) => {
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
      // Handle top-level fields
      onChange({
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
            value={data.referenceNumber || ""}
            onChange={handleChange}
          />
          <Input
            label="Date"
            type="date"
            name="dates.date"
            value={data.dates?.date || ""}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Input
            label="Company Name"
            name="customer"
            value={data.customer || ""}
            onChange={handleChange}
          />
          <Input
            label="State/Province"
            name="customerInfo.state"
            value={data.customerInfo?.state || ""}
            onChange={handleChange}
          />
          <Input
            label="Street Address"
            name="customerInfo.streetAddress"
            value={data.customerInfo?.streetAddress || ""}
            onChange={handleChange}
          />
          <Input
            label="ZIP/Postal Code"
            name="customerInfo.zip"
            value={data.customerInfo?.zip || ""}
            onChange={handleChange}
          />
          <Input
            label="City"
            name="customerInfo.city"
            value={data.customerInfo?.city || ""}
            onChange={handleChange}
          />
          <Input
            label="Country"
            name="customerInfo.country"
            value={data.customerInfo?.country || ""}
            onChange={handleChange}
          />
          <Input
            label="Contact Name"
            name="customerInfo.contactName"
            value={data.customerInfo?.contactName || ""}
            onChange={handleChange}
          />
          <Input
            label="Position"
            name="customerInfo.position"
            value={data.customerInfo?.position || ""}
            onChange={handleChange}
          />
          <Input
            label="Phone"
            name="customerInfo.phoneNumber"
            value={data.customerInfo?.phoneNumber || ""}
            onChange={handleChange}
          />
          <Input
            label="Email"
            name="customerInfo.email"
            value={data.customerInfo?.email || ""}
            onChange={handleChange}
          />
          <Input
            label="Dealer Name"
            name="customerInfo.dealerName"
            value={data.customerInfo?.dealerName || ""}
            onChange={handleChange}
          />
          <Input
            label="Dealer Salesman"
            name="customerInfo.dealerSalesman"
            value={data.customerInfo?.dealerSalesman || ""}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="How many days/week is the company running?"
            name="customerInfo.daysPerWeek"
            value={data.customerInfo?.daysPerWeek || ""}
            onChange={handleChange}
          />
          <Input
            label="How many shifts/day is the company running?"
            name="customerInfo.shiftsPerDay"
            value={data.customerInfo?.shiftsPerDay || ""}
            onChange={handleChange}
          />
          <Select
            label="Line Application"
            name="feed.application"
            value={data.feed?.application || ""}
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
            value={data.feed?.typeOfLine || ""}
            onChange={handleChange}
            options={TYPE_OF_LINE_OPTIONS}
          />
          <Select
            label="Pull Through"
            name="feed.pullThru.isPullThru"
            value={data.feed?.pullThru?.isPullThru || ""}
            onChange={handleChange}
            options={YES_NO_OPTIONS}
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
            value={data.coil?.maxCoilWidth || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Min Coil Width (in)"
            name="coil.minCoilWidth"
            value={data.coil?.minCoilWidth || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Max Coil O.D. (in)"
            name="coil.maxCoilOD"
            value={data.coil?.maxCoilOD || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Coil I.D. (in)"
            name="coil.coilID"
            value={data.coil?.coilID || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Max Coil Weight (lbs)"
            name="coil.maxCoilWeight"
            value={data.coil?.maxCoilWeight || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Max Coil Handling Capacity (lbs)"
            type="number"
            name="coil.maxCoilHandlingCap"
            value={data.coil?.maxCoilHandlingCap || ""}
            onChange={handleChange}
          />
        </div>

        <div className="mb-6">
          <div className="flex flex-wrap gap-6">
            <Checkbox
              label="Slit Edge"
              name="coil.slitEdge"
              checked={data.coil?.slitEdge === "true"}
              onChange={handleChange}
            />
            <Checkbox
              label="Mill Edge"
              name="coil.millEdge"
              checked={data.coil?.millEdge === "true"}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Will a coil car be required?"
            name="coil.requireCoilCar"
            value={data.coil?.requireCoilCar || ""}
            onChange={handleChange}
            options={YES_NO_OPTIONS}
          />
          <Select
            label="Will you be running off the Backplate?"
            name="coil.runningOffBackplate"
            value={data.coil?.runningOffBackplate || ""}
            onChange={handleChange}
            options={YES_NO_OPTIONS}
          />
          <Select
            label="Are you running partial coils, i.e. will you require rewinding?"
            name="coil.requireRewinding"
            value={data.coil?.requireRewinding || ""}
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
            value={data.material?.materialThickness || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="at Width (in)"
            name="material.coilWidth"
            value={data.material?.coilWidth || ""}
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
            label="Max Yield Strength (PSI)"
            name="material.maxYieldStrength"
            value={data.material?.maxYieldStrength || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Max Tensile Strength (PSI)"
            name="material.maxTensileStrength"
            value={data.material?.maxTensileStrength || ""}
            onChange={handleChange}
            type="number"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Select
            label="Does the surface finish matter? Are they running a cosmetic material?"
            name="runningCosmeticMaterial"
            value={data.runningCosmeticMaterial || ""}
            onChange={handleChange}
            options={[
              { value: "No", label: "No" },
              { value: "Yes", label: "Yes" },
            ]}
          />
          <Input
            label="Current brand of feed equipment"
            name="brandOfFeed"
            value={data.brandOfFeed || ""}
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
            checked={data.press?.gapFramePress === "true"}
            onChange={handleChange}
          />
          <Checkbox
            label="Hydraulic Press"
            name="press.hydraulicPress"
            checked={data.press?.hydraulicPress === "true"}
            onChange={handleChange}
          />
          <Checkbox
            label="OBI"
            name="press.obi"
            checked={data.press?.obi === "true"}
            onChange={handleChange}
          />
          <Checkbox
            label="Servo Press"
            name="press.servoPress"
            checked={data.press?.servoPress === "true"}
            onChange={handleChange}
          />
          <Checkbox
            label="Shear Die Application"
            name="press.shearDieApplication"
            checked={data.press?.shearDieApplication === "true"}
            onChange={handleChange}
          />
          <Checkbox
            label="Straight Side Press"
            name="press.straightSidePress"
            checked={data.press?.straightSidePress === "true"}
            onChange={handleChange}
          />
          <Checkbox
            label="Other"
            name="press.other"
            checked={data.press?.other === "true"}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            label="Tonnage of Press"
            name="press.tonnageOfPress"
            value={data.press?.tonnageOfPress || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Press Bed Area: Width (in)"
            name="press.bedWidth"
            value={data.press?.bedWidth || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Length (in)"
            name="press.bedLength"
            value={data.press?.bedLength || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Press Stroke Length (in)"
            name="press.strokeLength"
            value={data.press?.strokeLength || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Window Opening Size of Press (in)"
            name="press.windowSize"
            value={data.press?.windowSize || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Press Max SPM"
            name="press.maxSPM"
            value={data.press?.maxSPM || ""}
            onChange={handleChange}
            type="number"
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
              checked={data.dies?.transferDies === "true"}
              onChange={handleChange}
            />
            <Checkbox
              label="Progressive Dies"
              name="dies.progressiveDies"
              checked={data.dies?.progressiveDies === "true"}
              onChange={handleChange}
              required
            />
            <Checkbox
              label="Blanking Dies"
              name="dies.blankingDies"
              checked={data.dies?.blankingDies === "true"}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Input
            label="Average feed length"
            name="feed.average.length"
            value={data.feed?.average?.length || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="at (SPM)"
            name="feed.average.spm"
            value={data.feed?.average?.spm || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Feed Speed (FPM)"
            name="feed.average.fpm"
            value={data.feed?.average?.fpm || ""}
            readOnly
            disabled
          />
          <Input
            label="Maximum feed length"
            name="feed.max.length"
            value={data.feed?.max?.length || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="at (SPM)"
            name="feed.max.spm"
            value={data.feed?.max?.spm || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Feed Speed (FPM)"
            name="feed.max.fpm"
            value={data.feed?.max?.fpm || ""}
            readOnly
            disabled
          />
          <Input
            label="Minimum feed length"
            name="feed.min.length"
            value={data.feed?.min?.length || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="at (SPM)"
            name="feed.min.spm"
            value={data.feed?.min?.spm || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Feed Speed (FPM)"
            name="feed.min.fpm"
            value={data.feed?.min?.fpm || ""}
            readOnly
            disabled
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Voltage Required (VAC)"
            name="voltageRequired"
            value={data.voltageRequired || ""}
            onChange={handleChange}
            type="number"
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
            value={data.equipmentSpaceLength || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Width (ft)"
            name="equipmentSpaceWidth"
            value={data.equipmentSpaceWidth || ""}
            onChange={handleChange}
            type="number"
          />
        </div>

        <div className="space-y-4 mb-6">
          <Input
            label="Are there any walls or columns obstructing the equipment's location?"
            name="obstructions"
            value={data.obstructions || ""}
            onChange={handleChange}
          />
          <Input
            label="Can the feeder be mounted to the press?"
            name="mount.feederMountedToPress"
            value={data.mount?.feederMountedToPress || ""}
            onChange={handleChange}
          />
          <Input
            label="If 'YES', we must verify there is adequate structural support to mount to. Is there adequate support?"
            name="mount.adequateSupport"
            value={data.mount?.adequateSupport || ""}
            onChange={handleChange}
          />
          <Input
            label="If 'No', it will require a cabinet. Will you need custom mounting plate(s)?"
            name="mount.customMounting"
            value={data.mount?.customMounting || ""}
            onChange={handleChange}
          />
          <Input
            label="Passline Height (in):"
            name="feed.passline"
            value={data.feed?.passline || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Will there be a loop pit?"
            name="loopPit"
            value={data.loopPit || ""}
            onChange={handleChange}
          />
          <Input
            label="Is coil change time a concern?"
            name="coil.changeTimeConcern"
            value={data.coil?.changeTimeConcern || ""}
            onChange={handleChange}
          />
          <Input
            label="If so, what is your coil change time goal? (min)"
            name="coil.timeChangeGoal"
            value={data.coil?.timeChangeGoal || ""}
            onChange={handleChange}
            type="number"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Select
            label="Feed Direction"
            name="feed.direction"
            value={data.feed?.direction || ""}
            onChange={handleChange}
            options={FEED_DIRECTION_OPTIONS}
          />
          <Input
            label="Coil Loading"
            name="coil.loading"
            value={data.coil?.loading || ""}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Will your line require guarding or special safety requirements?"
            name="requireGuarding"
            value={data.requireGuarding || ""}
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
            value={data.dates?.decisionDate || ""}
            onChange={handleChange}
          />
          <Input
            label="Ideal Delivery Date"
            name="dates.idealDeliveryDate"
            type="date"
            value={data.dates?.idealDeliveryDate || ""}
            onChange={handleChange}
          />
          <Input
            label="Earliest date customer can accept delivery"
            name="dates.earliestDeliveryDate"
            type="date"
            value={data.dates?.earliestDeliveryDate || ""}
            onChange={handleChange}
          />
          <Input
            label="Latest date customer can accept delivery"
            name="dates.latestDeliveryDate"
            type="date"
            value={data.dates?.latestDeliveryDate || ""}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Textarea
            label="Special Considerations"
            name="specialConsiderations"
            value={data.specialConsiderations || ""}
            onChange={handleChange}
            rows={3}
          />
        </div>
      </Card>

      {/* Error Display */}
      
    </div>
  );
};

export default RFQ;