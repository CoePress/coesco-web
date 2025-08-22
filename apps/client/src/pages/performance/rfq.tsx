import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import Input from "@/components/common/input";
import Select from "@/components/common/select";
import Textarea from "@/components/common/textarea";
import Text from "@/components/common/text";
import Card from "@/components/common/card";
import {
  TYPE_OF_LINE_OPTIONS,
  MATERIAL_TYPE_OPTIONS,
  PRESS_APPLICATION_OPTIONS,
  YES_NO_OPTIONS,
  FEED_DIRECTION_OPTIONS,
  LOADING_OPTIONS,
} from "@/utils/select-options";
import { PerformanceData } from "@/contexts/performance.context";
import { usePerformanceDataService } from "@/utils/performance-service.ts";
import Checkbox from "@/components/common/checkbox";

export interface RFQProps {
  data: PerformanceData;
  isEditing: boolean;
}

const RFQ: React.FC<RFQProps> = ({ data, isEditing }) => {
  const { id: performanceSheetId } = useParams();
  
  // Use the performance data service
  const dataService = usePerformanceDataService(data, performanceSheetId, isEditing);
  const { state, handleFieldChange, getFieldValue, hasFieldError, getFieldError } = dataService;
  const { localData, fieldErrors, isDirty, lastSaved, isLoading, error } = state;

  // Basic Information Section
  const basicInfoSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Basic Information
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <Input
            label="Reference Number *"
            name="referenceNumber"
            value={localData.referenceNumber || ""}
            onChange={handleFieldChange}
            error={getFieldError("referenceNumber")}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Date"
            type="date"
            name="rfq.dates.date"
            value={localData.rfq?.dates?.date || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <Input
            label="Company Name *"
            name="common.customer"
            value={localData.common?.customer || ""}
            onChange={handleFieldChange}
            error={fieldErrors["common.customer"]}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="State/Province"
            name="common.customerInfo.state"
            value={localData.common?.customerInfo?.state || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Street Address"
            name="common.customerInfo.streetAddress"
            value={localData.common?.customerInfo?.streetAddress || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="ZIP/Postal Code"
            name="common.customerInfo.zip"
            value={localData.common?.customerInfo?.zip?.toString() || ""}
            onChange={handleFieldChange}
            error={fieldErrors["common.customerInfo.zip"]}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="City"
            name="common.customerInfo.city"
            value={localData.common?.customerInfo?.city || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Country"
            name="common.customerInfo.country"
            value={localData.common?.customerInfo?.country || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <Input
            label="Contact Name"
            name="common.customerInfo.contactName"
            value={localData.common?.customerInfo?.contactName || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Position"
            name="common.customerInfo.position"
            value={localData.common?.customerInfo?.position || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Phone"
            name="common.customerInfo.phoneNumber"
            value={localData.common?.customerInfo?.phoneNumber || ""}
            onChange={handleFieldChange}
            error={fieldErrors["common.customerInfo.phoneNumber"]}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Email"
            name="common.customerInfo.email"
            value={localData.common?.customerInfo?.email || ""}
            onChange={handleFieldChange}
            error={fieldErrors["common.customerInfo.email"]}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Dealer Name"
            name="common.customerInfo.dealerName"
            value={localData.common?.customerInfo?.dealerName || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Dealer Salesman"
            name="common.customerInfo.dealerSalesman"
            value={localData.common?.customerInfo?.dealerSalesman || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            label="Days per week running"
            name="common.customerInfo.daysPerWeek"
            value={localData.common?.customerInfo?.daysPerWeek?.toString() || ""}
            onChange={handleFieldChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Shifts per day"
            name="common.customerInfo.shiftsPerDay"
            value={localData.common?.customerInfo?.shiftsPerDay?.toString() || ""}
            onChange={handleFieldChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div>
          <Input
            label="Decision Date"
            type="date"
            name="rfq.dates.decisionDate"
            value={localData.rfq?.dates?.decisionDate || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Ideal Delivery Date"
            type="date"
            name="rfq.dates.idealDeliveryDate"
            value={localData.rfq?.dates?.idealDeliveryDate || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Earliest Delivery Date"
            type="date"
            name="rfq.dates.earliestDeliveryDate"
            value={localData.rfq?.dates?.earliestDeliveryDate || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Latest Delivery Date"
            type="date"
            name="rfq.dates.latestDeliveryDate"
            value={localData.rfq?.dates?.latestDeliveryDate || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
        </div>
      </div>
    </Card>
  ), [localData, fieldErrors, handleFieldChange, isEditing]);

  // Line Configuration Section
  const lineConfigSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Line Configuration
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <Select
            label="Line Application"
            name="feed.feed.application"
            value={localData.feed?.feed?.application || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
            options={PRESS_APPLICATION_OPTIONS}
          />
        </div>
        <div>
          <Select
            label="Type of Line"
            name="common.equipment.feed.typeOfLine"
            value={localData.common?.equipment?.feed?.typeOfLine || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
            options={TYPE_OF_LINE_OPTIONS}
          />
        </div>
        <div>
          <Select
            label="Pull Through"
            name="feed.feed.pullThru.isPullThru"
            value={localData.feed?.feed?.pullThru?.isPullThru || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
            options={YES_NO_OPTIONS}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            label="Brand of Feed"
            name="rfq.brandOfFeed"
            value={localData.rfq?.brandOfFeed || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Select
            label="Running Cosmetic Material"
            name="rfq.runningCosmeticMaterial"
            value={localData.rfq?.runningCosmeticMaterial || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
            options={YES_NO_OPTIONS}
          />
        </div>
      </div>
    </Card>
  ), [localData, handleFieldChange, isEditing]);

  // Coil Specifications Section
  const coilSpecsSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Coil Specifications
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div>
          <Input
            label="Max Coil Width (in)"
            name="common.coil.maxCoilWidth"
            value={localData.common?.coil?.maxCoilWidth?.toString() || ""}
            onChange={handleFieldChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Min Coil Width (in)"
            name="common.coil.minCoilWidth"
            value={localData.common?.coil?.minCoilWidth?.toString() || ""}
            onChange={handleFieldChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Max Coil OD (in)"
            name="common.coil.maxCoilOD"
            value={localData.common?.coil?.maxCoilOD?.toString() || ""}
            onChange={handleFieldChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Coil ID (in)"
            name="common.coil.coilID"
            value={localData.common?.coil?.coilID?.toString() || ""}
            onChange={handleFieldChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Max Coil Weight (lbs)"
            name="common.coil.maxCoilWeight"
            value={localData.common?.coil?.maxCoilWeight?.toString() || ""}
            onChange={handleFieldChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Max Coil Handling Cap (lbs)"
            name="common.coil.maxCoilHandlingCap"
            value={localData.common?.coil?.maxCoilHandlingCap?.toString() || ""}
            onChange={handleFieldChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <Checkbox
            label="Slit Edge"
            name="rfq.coil.slitEdgeCB"
            checked={localData.rfq?.coil?.slitEdge || false}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Checkbox
            label="Mill Edge"
            name="rfq.coil.millEdge"
            checked={localData.rfq?.coil?.millEdge || false}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Select
            label="Require Coil Car"
            name="rfq.coil.requireCoilCar"
            value={localData.rfq?.coil?.requireCoilCar || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
            options={YES_NO_OPTIONS}
          />
        </div>
        <div>
          <Select
            label="Running Off Backplate"
            name="rfq.coil.runningOffBackplate"
            value={localData.rfq?.coil?.runningOffBackplate || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
            options={YES_NO_OPTIONS}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Select
            label="Require Rewinding"
            name="rfq.coil.requireRewinding"
            value={localData.rfq?.coil?.requireRewinding || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
            options={YES_NO_OPTIONS}
          />
        </div>
        <div>
          <Select
            label="Change Time Concern"
            name="rfq.coil.changeTimeConcern"
            value={localData.rfq?.coil?.changeTimeConcern || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
            options={YES_NO_OPTIONS}
          />
        </div>
        <div>
          <Input
            label="Time Change Goal (min)"
            name="rfq.coil.timeChangeGoal"
            value={localData.rfq?.coil?.timeChangeGoal || ""}
            onChange={handleFieldChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
        <div>
          <Select
            label="Loading"
            name="rfq.coil.loading"
            value={localData.rfq?.coil?.loading || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
            options={LOADING_OPTIONS}
          />
        </div>
      </div>
    </Card>
  ), [localData, handleFieldChange, isEditing]);

  // Material Specifications Section
  const materialSpecsSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Material Specifications
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <Input
            label="Material Thickness (in)"
            name="common.material.materialThickness"
            value={localData.common?.material?.materialThickness?.toString() || ""}
            onChange={handleFieldChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Coil Width (in)"
            name="common.material.coilWidth"
            value={localData.common?.material?.coilWidth?.toString() || ""}
            onChange={handleFieldChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
        <div>
          <Select
            label="Material Type"
            name="common.material.materialType"
            value={localData.common?.material?.materialType || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
            options={MATERIAL_TYPE_OPTIONS}
          />
        </div>
        <div>
          <Input
            label="Max Yield Strength (PSI)"
            name="common.material.maxYieldStrength"
            value={localData.common?.material?.maxYieldStrength?.toString() || ""}
            onChange={handleFieldChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Max Tensile Strength (PSI)"
            name="common.material.maxTensileStrength"
            value={localData.common?.material?.maxTensileStrength?.toString() || ""}
            onChange={handleFieldChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
      </div>
    </Card>
  ), [localData, handleFieldChange, isEditing]);

  // Press Information Section
  const pressInfoSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Press Information
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div>
          <Checkbox
            label="Gap Frame Press"
            name="rfq.press.gapFramePress"
            checked={localData.rfq?.press?.gapFramePress || false}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Checkbox
            label="Hydraulic Press"
            name="rfq.press.hydraulicPress"
            checked={localData.rfq?.press?.hydraulicPress || false}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Checkbox
            label="OBI"
            name="rfq.press.obi"
            checked={localData.rfq?.press?.obi || false}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Checkbox
            label="Servo Press"
            name="rfq.press.servoPress"
            checked={localData.rfq?.press?.servoPress || false}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Checkbox
            label="Shear Die Application"
            name="rfq.press.shearDieApplication"
            checked={localData.rfq?.press?.shearDieApplication || false}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Checkbox
            label="Straight Side Press"
            name="rfq.press.straightSidePress"
            checked={localData.rfq?.press?.straightSidePress || false}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Checkbox
            label="Other Press Type"
            name="rfq.press.other"
            checked={localData.rfq?.press?.other || false}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div>
          <Input
            label="Tonnage of Press"
            name="rfq.press.tonnageOfPress"
            value={localData.rfq?.press?.tonnageOfPress || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Stroke Length (in)"
            name="rfq.press.strokeLength"
            value={localData.rfq?.press?.strokeLength || ""}
            onChange={handleFieldChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Max SPM"
            name="rfq.press.maxSPM"
            value={localData.rfq?.press?.maxSPM || ""}
            onChange={handleFieldChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Bed Width (in)"
            name="rfq.press.bedWidth"
            value={localData.rfq?.press?.bedWidth || ""}
            onChange={handleFieldChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Bed Length (in)"
            name="rfq.press.bedLength"
            value={localData.common?.press?.bedLength || ""}
            onChange={handleFieldChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Window Size (in)"
            name="rfq.press.windowSize"
            value={localData.rfq?.press?.windowSize || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            label="Cycle Time (sec)"
            name="rfq.press.cycleTime"
            value={localData.rfq?.press?.cycleTime || ""}
            onChange={handleFieldChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
      </div>
    </Card>
  ), [localData, handleFieldChange, isEditing]);

  // Dies Information Section
  const diesInfoSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Dies Information
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Checkbox
            label="Transfer Dies"
            name="rfq.dies.transferDies"
            checked={localData.rfq?.dies?.transferDies || false}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Checkbox
            label="Progressive Dies"
            name="rfq.dies.progressiveDies"
            checked={localData.rfq?.dies?.progressiveDies || false}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Checkbox
            label="Blanking Dies"
            name="rfq.dies.blankingDies"
            checked={localData.rfq?.dies?.blankingDies || false}
            onChange={handleFieldChange}
            disabled={!isEditing}
          />
        </div>
      </div>
    </Card>
  ), [localData, handleFieldChange, isEditing]);

  // Feed Requirements Section - This is where the FPM calculations show
  const feedRequirementsSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Feed Requirements
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <Text as="h4" className="mb-2 text-sm font-medium">Average</Text>
          <div className="space-y-3">
            <Input
              label="Length (in)"
              name="common.feedRates.average.length"
              value={localData.common?.feedRates?.average?.length?.toString() || ""}
              onChange={handleFieldChange}
              type="number"
              disabled={!isEditing}
            />
            <Input
              label="SPM"
              name="common.feedRates.average.spm"
              value={localData.common?.feedRates?.average?.spm?.toString() || ""}
              onChange={handleFieldChange}
              type="number"
              disabled={!isEditing}
            />
            <Input
              label="FPM (Calculated)"
              name="common.feedRates.average.fpm"
              value={localData.common?.feedRates?.average?.fpm?.toString() || ""}
              disabled={true}
              className="bg-gray-50"
            />
          </div>
        </div>
        <div>
          <Text as="h4" className="mb-2 text-sm font-medium">Maximum</Text>
          <div className="space-y-3">
            <Input
              label="Length (in)"
              name="common.feedRates.max.length"
              value={localData.common?.feedRates?.max?.length?.toString() || ""}
              onChange={handleFieldChange}
              type="number"
              disabled={!isEditing}
            />
            <Input
              label="SPM"
              name="common.feedRates.max.spm"
              value={localData.common?.feedRates?.max?.spm?.toString() || ""}
              onChange={handleFieldChange}
              type="number"
              disabled={!isEditing}
            />
            <Input
              label="FPM (Calculated)"
              name="common.feedRates.max.fpm"
              value={localData.common?.feedRates?.max?.fpm?.toString() || ""}
              disabled={true}
              className="bg-gray-50"
            />
          </div>
        </div>
        <div>
          <Text as="h4" className="mb-2 text-sm font-medium">Minimum</Text>
          <div className="space-y-3">
            <Input
              label="Length (in)"
              name="common.feedRates.min.length"
              value={localData.common?.feedRates?.min?.length?.toString() || ""}
              onChange={handleFieldChange}
              type="number"
              disabled={!isEditing}
            />
            <Input
              label="SPM"
              name="common.feedRates.min.spm"
              value={localData.common?.feedRates?.min?.spm?.toString() || ""}
              onChange={handleFieldChange}
              type="number"
              disabled={!isEditing}
            />
            <Input
              label="FPM (Calculated)"
              name="common.feedRates.min.fpm"
              value={localData.common?.feedRates?.min?.fpm?.toString() || ""}
              disabled={true}
              className="bg-gray-50"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            label="Voltage Required"
            name="rfq.voltageRequired"
            value={localData.rfq?.voltageRequired?.toString() || ""}
            onChange={handleFieldChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
      </div>
    </Card>
  ), [localData, handleFieldChange, isEditing]);

  // Space & Mounting Section
  const spaceMountingSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Space & Mounting
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <Input
            label="Equipment Space Length (in)"
            name="rfq.equipmentSpaceLength"
            value={localData.rfq?.equipmentSpaceLength?.toString() || ""}
            onChange={handleFieldChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Equipment Space Width (in)"
            name="rfq.equipmentSpaceWidth"
            value={localData.rfq?.equipmentSpaceWidth?.toString() || ""}
            onChange={handleFieldChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <Select
            label="Feeder Mounted to Press"
            name="rfq.mount.feederMountedToPress"
            value={localData.rfq?.mount?.feederMountedToPress || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
            options={YES_NO_OPTIONS}
          />
        </div>
        <div>
          <Select
            label="Adequate Support"
            name="rfq.mount.adequateSupport"
            value={localData.rfq?.mount?.adequateSupport || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
            options={YES_NO_OPTIONS}
          />
        </div>
        <div>
          <Select
            label="Custom Mounting"
            name="rfq.mount.customMounting"
            value={localData.rfq?.mount?.customMounting || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
            options={YES_NO_OPTIONS}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <Input
            label="Passline Height (in)"
            name="common.equipment.feed.passline"
            value={localData.common?.equipment?.feed?.passline || ""}
            onChange={handleFieldChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
        <div>
          <Select
            label="Loop Pit"
            name="rfq.loopPit"
            value={localData.common?.equipment?.feed?.loopPit || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
            options={YES_NO_OPTIONS}
          />
        </div>
        <div>
          <Select
            label="Feed Direction"
            name="common.equipment.feed.direction"
            value={localData.common?.equipment?.feed?.direction || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
            options={FEED_DIRECTION_OPTIONS}
          />
        </div>
      </div>

      <div className="mb-6">
        <Textarea
          label="Obstructions"
          name="rfq.obstructions"
          value={localData.rfq?.obstructions || ""}
          onChange={handleFieldChange}
          rows={3}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData, handleFieldChange, isEditing]);

  // Special Requirements Section
  const specialRequirementsSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Special Requirements
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <Select
            label="Require Guarding"
            name="rfq.requireGuarding"
            value={localData.rfq?.requireGuarding || ""}
            onChange={handleFieldChange}
            disabled={!isEditing}
            options={YES_NO_OPTIONS}
          />
        </div>
      </div>

      <div>
        <Textarea
          label="Special Considerations"
          name="rfq.specialConsiderations"
          value={localData.rfq?.specialConsiderations || ""}
          onChange={handleFieldChange}
          rows={4}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData, handleFieldChange, isEditing]);

  // Status indicator component
  const StatusIndicator = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent"></div>
          Saving...
        </div>
      );
    }
    
    if (isDirty) {
      return (
        <div className="flex items-center gap-2 text-sm text-amber-600">
          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
          Unsaved changes
        </div>
      );
    }
    
    if (lastSaved) {
      return (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          Saved {lastSaved.toLocaleTimeString()}
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="w-full flex flex-1 flex-col p-2 gap-2">
      {/* Status bar */}
      <div className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
        <StatusIndicator />
        {fieldErrors._general && (
          <div className="text-sm text-red-600">{fieldErrors._general}</div>
        )}
      </div>

      {/* Loading and error states */}
      {(isLoading) && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-blue-800">
              {isLoading ? "Saving changes and calculating FPM..." : "Loading..."}
            </span>
          </div>
        </div>
      )}

      {(error) && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <span className="text-red-800">
            Error: {error}
          </span>
        </div>
      )}

      {/* Form sections */}
      {basicInfoSection}
      {lineConfigSection}
      {coilSpecsSection}
      {materialSpecsSection}
      {pressInfoSection}
      {diesInfoSection}
      {feedRequirementsSection}
      {spaceMountingSection}
      {specialRequirementsSection}
    </div>
  );
};

export default RFQ;