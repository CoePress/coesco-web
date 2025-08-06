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
import { useRef, useEffect, useState } from "react";
import { useUpdateEntity } from "@/hooks/_base/use-update-entity";
import { useParams } from "react-router-dom"
import { useGetEntity } from "@/hooks/_base/use-get-entity";

export interface RFQProps {
  data: PerformanceData;
  isEditing: boolean;
}

const RFQ: React.FC<RFQProps> = ({ data, isEditing }) => {
  const endpoint = `/performance/sheets`;
  const { loading, error } = useGetEntity(endpoint);
  const { updateEntity, loading: updateLoading, error: updateError } = useUpdateEntity(endpoint);
  const { id: performanceSheetId } = useParams();
  
  // Local state for immediate UI updates
  const [localData, setLocalData] = useState<PerformanceData>(data);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only sync on initial load when localData is empty
    if (!localData.referenceNumber && data.referenceNumber) {
      console.log('Initial data load, syncing all data');
      setLocalData(data);
    }
  }, [data, localData.referenceNumber]);

  const handleChange = async (e: any) => {
    if (!isEditing) return;
    const { name, value, type, checked } = e.target;
    const actualValue = type === "checkbox" ? checked : value;

    console.log(`Field changed: ${name}, Value: ${actualValue}`);

    // Update local state immediately for responsive UI
    setLocalData(prevData => {
      const updatedData = JSON.parse(JSON.stringify(prevData));

      if (name.includes(".")) {
        // Handle nested field updates
        const parts = name.split(".");
        let current = updatedData;
        
        // Navigate to the parent object
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) {
            current[parts[i]] = {};
          }
          current = current[parts[i]];
        }
        
        // Set the final value
        current[parts[parts.length - 1]] = type === "checkbox" ? (actualValue ? "true" : "false") : actualValue;
      } else {
        // Handle top-level fields
        updatedData[name] = type === "checkbox" ? (actualValue ? "true" : "false") : actualValue;
      }

      return updatedData;
    });

    // Debounce backend updates to avoid excessive API calls
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(async () => {
      try {
        if (!performanceSheetId) {
          throw new Error("Performance Sheet ID is missing.");
        }

        // Create updated data for backend
        const updatedData = JSON.parse(JSON.stringify(localData));
        
        // Apply the current change to the data being sent
        if (name.includes(".")) {
          const parts = name.split(".");
          let current = updatedData;
          
          for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) {
              current[parts[i]] = {};
            }
            current = current[parts[i]];
          }
          
          current[parts[parts.length - 1]] = type === "checkbox" ? (actualValue ? "true" : "false") : actualValue;
        } else {
          updatedData[name] = type === "checkbox" ? (actualValue ? "true" : "false") : actualValue;
        }

        console.log("Updating with complete data structure:", updatedData);

        // Send to backend (this will also trigger calculations)
        const response = await updateEntity(performanceSheetId, { data: updatedData });
        
        console.log("Backend response:", response);
        
        // Handle calculated values directly from the backend response
        if (response && response.data && response.data.feed) {
          console.log("Updating calculated FPM values from backend response");
          
          setLocalData(prevData => ({
            ...prevData,
            feed: {
              ...prevData.feed,
              average: {
                ...prevData.feed?.average,
                fpm: response.data.feed.average?.fpm?.toString() || prevData.feed?.average?.fpm
              },
              max: {
                ...prevData.feed?.max,
                fpm: response.data.feed.max?.fpm?.toString() || prevData.feed?.max?.fpm
              },
              min: {
                ...prevData.feed?.min,
                fpm: response.data.feed.min?.fpm?.toString() || prevData.feed?.min?.fpm
              }
            }
          }));
          
          console.log("Updated FPM values:", {
            average: response.data.feed.average?.fpm,
            max: response.data.feed.max?.fpm,
            min: response.data.feed.min?.fpm
          });
        }

      } catch (error) {
        console.error('Error updating field:', error);
        setLocalData(data);
      }
    }, 500);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full flex flex-1 flex-col p-2 gap-2">
      {/* Show loading indicator when calculations are running */}
      {(loading || updateLoading) && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-blue-800">
              {updateLoading ? "Saving changes..." : "Loading..."}
            </span>
          </div>
        </div>
      )}

      {/* Show error if calculation fails */}
      {(error || updateError) && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <span className="text-red-800">
            Error: {error || updateError}
          </span>
        </div>
      )}

      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Basic Information
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Input
            label="Reference Number"
            name="referenceNumber"
            value={localData.referenceNumber || ""}
            onChange={handleChange}
          />
          <Input
            label="Date"
            type="date"
            name="dates.date"
            value={localData.dates?.date || ""}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Input
            label="Company Name"
            name="customer"
            value={localData.customer || ""}
            onChange={handleChange}
          />
          <Input
            label="State/Province"
            name="customerInfo.state"
            value={localData.customerInfo?.state || ""}
            onChange={handleChange}
          />
          <Input
            label="Street Address"
            name="customerInfo.streetAddress"
            value={localData.customerInfo?.streetAddress || ""}
            onChange={handleChange}
          />
          <Input
            label="ZIP/Postal Code"
            name="customerInfo.zip"
            value={localData.customerInfo?.zip || ""}
            onChange={handleChange}
          />
          <Input
            label="City"
            name="customerInfo.city"
            value={localData.customerInfo?.city || ""}
            onChange={handleChange}
          />
          <Input
            label="Country"
            name="customerInfo.country"
            value={localData.customerInfo?.country || ""}
            onChange={handleChange}
          />
          <Input
            label="Contact Name"
            name="customerInfo.contactName"
            value={localData.customerInfo?.contactName || ""}
            onChange={handleChange}
          />
          <Input
            label="Position"
            name="customerInfo.position"
            value={localData.customerInfo?.position || ""}
            onChange={handleChange}
          />
          <Input
            label="Phone"
            name="customerInfo.phoneNumber"
            value={localData.customerInfo?.phoneNumber || ""}
            onChange={handleChange}
          />
          <Input
            label="Email"
            name="customerInfo.email"
            value={localData.customerInfo?.email || ""}
            onChange={handleChange}
          />
          <Input
            label="Dealer Name"
            name="customerInfo.dealerName"
            value={localData.customerInfo?.dealerName || ""}
            onChange={handleChange}
          />
          <Input
            label="Dealer Salesman"
            name="customerInfo.dealerSalesman"
            value={localData.customerInfo?.dealerSalesman || ""}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="How many days/week is the company running?"
            name="customerInfo.daysPerWeek"
            value={localData.customerInfo?.daysPerWeek || ""}
            onChange={handleChange}
          />
          <Input
            label="How many shifts/day is the company running?"
            name="customerInfo.shiftsPerDay"
            value={localData.customerInfo?.shiftsPerDay || ""}
            onChange={handleChange}
          />
          <Select
            label="Line Application"
            name="feed.application"
            value={localData.feed?.application || ""}
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
            value={localData.feed?.typeOfLine || ""}
            onChange={handleChange}
            options={TYPE_OF_LINE_OPTIONS}
          />
          <Select
            label="Pull Through"
            name="feed.pullThru.isPullThru"
            value={localData.feed?.pullThru?.isPullThru || ""}
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
            value={localData.coil?.maxCoilWidth || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Min Coil Width (in)"
            name="coil.minCoilWidth"
            value={localData.coil?.minCoilWidth || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Max Coil O.D. (in)"
            name="coil.maxCoilOD"
            value={localData.coil?.maxCoilOD || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Coil I.D. (in)"
            name="coil.coilID"
            value={localData.coil?.coilID || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Max Coil Weight (lbs)"
            name="coil.maxCoilWeight"
            value={localData.coil?.maxCoilWeight || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Max Coil Handling Capacity (lbs)"
            type="number"
            name="coil.maxCoilHandlingCap"
            value={localData.coil?.maxCoilHandlingCap || ""}
            onChange={handleChange}
          />
        </div>

        <div className="mb-6">
          <div className="flex flex-wrap gap-6">
            <Checkbox
              label="Slit Edge"
              name="coil.slitEdge"
              checked={localData.coil?.slitEdge === "true"}
              onChange={handleChange}
            />
            <Checkbox
              label="Mill Edge"
              name="coil.millEdge"
              checked={localData.coil?.millEdge === "true"}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Will a coil car be required?"
            name="coil.requireCoilCar"
            value={localData.coil?.requireCoilCar || ""}
            onChange={handleChange}
            options={YES_NO_OPTIONS}
          />
          <Select
            label="Will you be running off the Backplate?"
            name="coil.runningOffBackplate"
            value={localData.coil?.runningOffBackplate || ""}
            onChange={handleChange}
            options={YES_NO_OPTIONS}
          />
          <Select
            label="Are you running partial coils, i.e. will you require rewinding?"
            name="coil.requireRewinding"
            value={localData.coil?.requireRewinding || ""}
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
            value={localData.material?.materialThickness || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="at Width (in)"
            name="material.coilWidth"
            value={localData.material?.coilWidth || ""}
            onChange={handleChange}
            type="number"
          />
          <Select
            label="Material Type"
            name="material.materialType"
            value={localData.material?.materialType || ""}
            onChange={handleChange}
            options={MATERIAL_TYPE_OPTIONS}
          />
          <Input
            label="Max Yield Strength (PSI)"
            name="material.maxYieldStrength"
            value={localData.material?.maxYieldStrength || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Max Tensile Strength (PSI)"
            name="material.maxTensileStrength"
            value={localData.material?.maxTensileStrength || ""}
            onChange={handleChange}
            type="number"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Select
            label="Does the surface finish matter? Are they running a cosmetic material?"
            name="runningCosmeticMaterial"
            value={localData.runningCosmeticMaterial || ""}
            onChange={handleChange}
            options={[
              { value: "No", label: "No" },
              { value: "Yes", label: "Yes" },
            ]}
          />
          <Input
            label="Current brand of feed equipment"
            name="brandOfFeed"
            value={localData.brandOfFeed || ""}
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
            checked={localData.press?.gapFramePress === "true"}
            onChange={handleChange}
          />
          <Checkbox
            label="Hydraulic Press"
            name="press.hydraulicPress"
            checked={localData.press?.hydraulicPress === "true"}
            onChange={handleChange}
          />
          <Checkbox
            label="OBI"
            name="press.obi"
            checked={localData.press?.obi === "true"}
            onChange={handleChange}
          />
          <Checkbox
            label="Servo Press"
            name="press.servoPress"
            checked={localData.press?.servoPress === "true"}
            onChange={handleChange}
          />
          <Checkbox
            label="Shear Die Application"
            name="press.shearDieApplication"
            checked={localData.press?.shearDieApplication === "true"}
            onChange={handleChange}
          />
          <Checkbox
            label="Straight Side Press"
            name="press.straightSidePress"
            checked={localData.press?.straightSidePress === "true"}
            onChange={handleChange}
          />
          <Checkbox
            label="Other"
            name="press.other"
            checked={localData.press?.other === "true"}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            label="Tonnage of Press"
            name="press.tonnageOfPress"
            value={localData.press?.tonnageOfPress || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Press Bed Area: Width (in)"
            name="press.bedWidth"
            value={localData.press?.bedWidth || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Length (in)"
            name="press.bedLength"
            value={localData.press?.bedLength || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Press Stroke Length (in)"
            name="press.strokeLength"
            value={localData.press?.strokeLength || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Window Opening Size of Press (in)"
            name="press.windowSize"
            value={localData.press?.windowSize || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Press Max SPM"
            name="press.maxSPM"
            value={localData.press?.maxSPM || ""}
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
              checked={localData.dies?.transferDies === "true"}
              onChange={handleChange}
            />
            <Checkbox
              label="Progressive Dies"
              name="dies.progressiveDies"
              checked={localData.dies?.progressiveDies === "true"}
              onChange={handleChange}
              required
            />
            <Checkbox
              label="Blanking Dies"
              name="dies.blankingDies"
              checked={localData.dies?.blankingDies === "true"}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Input
            label="Average feed length"
            name="feed.average.length"
            value={localData.feed?.average?.length || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="at (SPM)"
            name="feed.average.spm"
            value={localData.feed?.average?.spm || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Feed Speed (FPM)"
            name="feed.average.fpm"
            value={localData.feed?.average?.fpm || ""}
            readOnly
            disabled
            className="bg-gray-50"
          />
          <Input
            label="Maximum feed length"
            name="feed.max.length"
            value={localData.feed?.max?.length || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="at (SPM)"
            name="feed.max.spm"
            value={localData.feed?.max?.spm || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Feed Speed (FPM)"
            name="feed.max.fpm"
            value={localData.feed?.max?.fpm || ""}
            readOnly
            disabled
            className="bg-gray-50"
          />
          <Input
            label="Minimum feed length"
            name="feed.min.length"
            value={localData.feed?.min?.length || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="at (SPM)"
            name="feed.min.spm"
            value={localData.feed?.min?.spm || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Feed Speed (FPM)"
            name="feed.min.fpm"
            value={localData.feed?.min?.fpm || ""}
            readOnly
            disabled
            className="bg-gray-50"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Voltage Required (VAC)"
            name="voltageRequired"
            value={localData.voltageRequired || ""}
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
            value={localData.equipmentSpaceLength || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Width (ft)"
            name="equipmentSpaceWidth"
            value={localData.equipmentSpaceWidth || ""}
            onChange={handleChange}
            type="number"
          />
        </div>

        <div className="space-y-4 mb-6">
          <Input
            label="Are there any walls or columns obstructing the equipment's location?"
            name="obstructions"
            value={localData.obstructions || ""}
            onChange={handleChange}
          />
          <Input
            label="Can the feeder be mounted to the press?"
            name="mount.feederMountedToPress"
            value={localData.mount?.feederMountedToPress || ""}
            onChange={handleChange}
          />
          <Input
            label="If 'YES', we must verify there is adequate structural support to mount to. Is there adequate support?"
            name="mount.adequateSupport"
            value={localData.mount?.adequateSupport || ""}
            onChange={handleChange}
          />
          <Input
            label="If 'No', it will require a cabinet. Will you need custom mounting plate(s)?"
            name="mount.customMounting"
            value={localData.mount?.customMounting || ""}
            onChange={handleChange}
          />
          <Input
            label="Passline Height (in):"
            name="feed.passline"
            value={localData.feed?.passline || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Will there be a loop pit?"
            name="loopPit"
            value={localData.loopPit || ""}
            onChange={handleChange}
          />
          <Input
            label="Is coil change time a concern?"
            name="coil.changeTimeConcern"
            value={localData.coil?.changeTimeConcern || ""}
            onChange={handleChange}
          />
          <Input
            label="If so, what is your coil change time goal? (min)"
            name="coil.timeChangeGoal"
            value={localData.coil?.timeChangeGoal || ""}
            onChange={handleChange}
            type="number"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Select
            label="Feed Direction"
            name="feed.direction"
            value={localData.feed?.direction || ""}
            onChange={handleChange}
            options={FEED_DIRECTION_OPTIONS}
          />
          <Input
            label="Coil Loading"
            name="coil.loading"
            value={localData.coil?.loading || ""}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Will your line require guarding or special safety requirements?"
            name="requireGuarding"
            value={localData.requireGuarding || ""}
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
            value={localData.dates?.decisionDate || ""}
            onChange={handleChange}
          />
          <Input
            label="Ideal Delivery Date"
            name="dates.idealDeliveryDate"
            type="date"
            value={localData.dates?.idealDeliveryDate || ""}
            onChange={handleChange}
          />
          <Input
            label="Earliest date customer can accept delivery"
            name="dates.earliestDeliveryDate"
            type="date"
            value={localData.dates?.earliestDeliveryDate || ""}
            onChange={handleChange}
          />
          <Input
            label="Latest date customer can accept delivery"
            name="dates.latestDeliveryDate"
            type="date"
            value={localData.dates?.latestDeliveryDate || ""}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Textarea
            label="Special Considerations"
            name="specialConsiderations"
            value={localData.specialConsiderations || ""}
            onChange={handleChange}
            rows={3}
          />
        </div>
      </Card>
    </div>
  );
};

export default RFQ;