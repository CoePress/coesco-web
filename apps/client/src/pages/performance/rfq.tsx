import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { debounce } from "lodash";
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
  EDGE_TYPE_OPTIONS,
  LOADING_OPTIONS,
} from "@/utils/select-options";
import { PerformanceData } from "@/contexts/performance.context";
import { useUpdateEntity } from "@/hooks/_base/use-update-entity";
import { useGetEntity } from "@/hooks/_base/use-get-entity";

export interface RFQProps {
  data: PerformanceData;
  isEditing: boolean;
}

// Validation schema
const validateField = (name: string, value: any): string | null => {
  if (name === "referenceNumber" && !value?.trim()) {
    return "Reference number is required";
  }
  if (name === "common.customer" && !value?.trim()) {
    return "Customer name is required";
  }
  if (name.includes("email") && value && !/\S+@\S+\.\S+/.test(value)) {
    return "Invalid email format";
  }
  if (name.includes("phone") && value && !/^\+?[\d\s\-\(\)]+$/.test(value)) {
    return "Invalid phone format";
  }
  if (name.includes("zip") && value && !/^\d{5}(-\d{4})?$/.test(value)) {
    return "Invalid ZIP code format";
  }
  return null;
};

// Helper to safely update nested object properties
const setNestedValue = (obj: any, path: string, value: any) => {
  const keys = path.split(".");
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  
  current[keys[keys.length - 1]] = value;
};

const RFQ: React.FC<RFQProps> = ({ data, isEditing }) => {
  const endpoint = `/performance/sheets`;
  const { loading, error } = useGetEntity(endpoint);
  const { updateEntity, loading: updateLoading, error: updateError } = useUpdateEntity(endpoint);
  const { id: performanceSheetId } = useParams();
  
  // Local state management
  const [localData, setLocalData] = useState<PerformanceData>(data);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Refs for cleanup and debouncing
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingChangesRef = useRef<Record<string, any>>({});

  // Sync with prop data on initial load only
  useEffect(() => {
    if (data && data.referenceNumber && !localData.referenceNumber) {
      setLocalData(data);
    }
  }, [data, localData.referenceNumber]);

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async (changes: Record<string, any>) => {
      if (!performanceSheetId || !isEditing) return;

      try {
        // Create a deep copy and apply all pending changes
        const updatedData = JSON.parse(JSON.stringify(localData));
        
        Object.entries(changes).forEach(([path, value]) => {
          setNestedValue(updatedData, path, value);
        });

        console.log("Saving RFQ changes:", changes);
        
        const response = await updateEntity(performanceSheetId, { data: updatedData });
        
        // Handle calculated values from backend - specifically FPM calculations
        if (response?.data) {
          console.log("Updating calculated FPM values from backend response");
          setLocalData(prevData => ({
            ...prevData,
            // Update calculated fields from backend response
            common: {
              feedRates: {
                ...prevData.common?.feedRates,
                average: {
                  ...prevData.common?.feedRates?.average,
                  fpm: response.data.feedRates?.average?.fpm || prevData.common?.feedRates?.average?.fpm,
                },
                max: {
                  ...prevData.common?.feedRates?.max,
                  fpm: response.data.feedRates?.max?.fpm || prevData.common?.feedRates?.max?.fpm,
                },
                min: {
                  ...prevData.common?.feedRates?.min,
                  fpm: response.data.feedRates?.min?.fpm || prevData.common?.feedRates?.min?.fpm,
                },
              }
          }}));
        }

        setLastSaved(new Date());
        setIsDirty(false);
        pendingChangesRef.current = {};
        
      } catch (error) {
        console.error('Error saving RFQ:', error);
        setFieldErrors(prev => ({ 
          ...prev, 
          _general: 'Failed to save changes. Please try again.' 
        }));
      }
    }, 1000),
    [performanceSheetId, updateEntity, isEditing, localData]
  );

  // Optimized change handler
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!isEditing) return;

    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    const actualValue = type === "checkbox" ? checked : value;

    // Clear field error
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Validate field
    const error = validateField(name, actualValue);
    if (error) {
      setFieldErrors(prev => ({ ...prev, [name]: error }));
      return;
    }

    // Update local state immediately
    setLocalData(prevData => {
      const newData = { ...prevData };
      const processedValue = type === "checkbox" ? (actualValue ? "true" : "false") : actualValue;
      
      // Handle nested paths directly
      setNestedValue(newData, name, processedValue);
      
      return newData;
    });

    // Track pending changes
    pendingChangesRef.current[name] = type === "checkbox" ? (actualValue ? "true" : "false") : actualValue;
    setIsDirty(true);

    // Debounce save
    debouncedSave(pendingChangesRef.current);
  }, [isEditing, fieldErrors, debouncedSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

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
            onChange={handleChange}
            error={fieldErrors.referenceNumber}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Date"
            type="date"
            name="rfq.dates.date"
            value={localData.rfq?.dates?.date || ""}
            onChange={handleChange}
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
            onChange={handleChange}
            error={fieldErrors["common.customer"]}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="State/Province"
            name="common.customerInfo.state"
            value={localData.common?.customerInfo?.state || ""}
            onChange={handleChange}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Street Address"
            name="common.customerInfo.streetAddress"
            value={localData.common?.customerInfo?.streetAddress || ""}
            onChange={handleChange}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="ZIP/Postal Code"
            name="common.customerInfo.zip"
            value={localData.common?.customerInfo?.zip?.toString() || ""}
            onChange={handleChange}
            error={fieldErrors["common.customerInfo.zip"]}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="City"
            name="common.customerInfo.city"
            value={localData.common?.customerInfo?.city || ""}
            onChange={handleChange}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Country"
            name="common.customerInfo.country"
            value={localData.common?.customerInfo?.country || ""}
            onChange={handleChange}
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
            onChange={handleChange}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Position"
            name="common.customerInfo.position"
            value={localData.common?.customerInfo?.position || ""}
            onChange={handleChange}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Phone"
            name="common.customerInfo.phoneNumber"
            value={localData.common?.customerInfo?.phoneNumber || ""}
            onChange={handleChange}
            error={fieldErrors["common.customerInfo.phoneNumber"]}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Email"
            name="common.customerInfo.email"
            value={localData.common?.customerInfo?.email || ""}
            onChange={handleChange}
            error={fieldErrors["common.customerInfo.email"]}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Dealer Name"
            name="common.customerInfo.dealerName"
            value={localData.common?.customerInfo?.dealerName || ""}
            onChange={handleChange}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Dealer Salesman"
            name="common.customerInfo.dealerSalesman"
            value={localData.common?.customerInfo?.dealerSalesman || ""}
            onChange={handleChange}
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
            onChange={handleChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Shifts per day"
            name="common.customerInfo.shiftsPerDay"
            value={localData.common?.customerInfo?.shiftsPerDay?.toString() || ""}
            onChange={handleChange}
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
            onChange={handleChange}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Ideal Delivery Date"
            type="date"
            name="rfq.dates.idealDeliveryDate"
            value={localData.rfq?.dates?.idealDeliveryDate || ""}
            onChange={handleChange}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Earliest Delivery Date"
            type="date"
            name="rfq.dates.earliestDeliveryDate"
            value={localData.rfq?.dates?.earliestDeliveryDate || ""}
            onChange={handleChange}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Latest Delivery Date"
            type="date"
            name="rfq.dates.latestDeliveryDate"
            value={localData.rfq?.dates?.latestDeliveryDate || ""}
            onChange={handleChange}
            disabled={!isEditing}
          />
        </div>
      </div>
    </Card>
  ), [localData, fieldErrors, handleChange, isEditing]);

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
            name="rfq.lineApplication"
            value={localData.rfq?.lineApplication || ""}
            onChange={handleChange}
            disabled={!isEditing}
            options={PRESS_APPLICATION_OPTIONS}
          />
        </div>
        <div>
          <Select
            label="Type of Line"
            name="common.equipment.feed.typeOfLine"
            value={localData.common?.equipment?.feed?.typeOfLine || ""}
            onChange={handleChange}
            disabled={!isEditing}
            options={TYPE_OF_LINE_OPTIONS}
          />
        </div>
        <div>
          <Select
            label="Pull Through"
            name="rfq.pullThrough"
            value={localData.rfq?.pullThrough || ""}
            onChange={handleChange}
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
            onChange={handleChange}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Select
            label="Running Cosmetic Material"
            name="rfq.runningCosmeticMaterial"
            value={localData.rfq?.runningCosmeticMaterial || ""}
            onChange={handleChange}
            disabled={!isEditing}
            options={YES_NO_OPTIONS}
          />
        </div>
      </div>
    </Card>
  ), [localData, handleChange, isEditing]);

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
            onChange={handleChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Min Coil Width (in)"
            name="common.coil.minCoilWidth"
            value={localData.common?.coil?.minCoilWidth?.toString() || ""}
            onChange={handleChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Max Coil OD (in)"
            name="common.coil.maxCoilOD"
            value={localData.common?.coil?.maxCoilOD?.toString() || ""}
            onChange={handleChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Coil ID (in)"
            name="common.coil.coilID"
            value={localData.common?.coil?.coilID?.toString() || ""}
            onChange={handleChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Max Coil Weight (lbs)"
            name="common.coil.maxCoilWeight"
            value={localData.common?.coil?.maxCoilWeight?.toString() || ""}
            onChange={handleChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Max Coil Handling Cap (lbs)"
            name="common.coil.maxCoilHandlingCap"
            value={localData.common?.coil?.maxCoilHandlingCap?.toString() || ""}
            onChange={handleChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <Select
            label="Slit Edge"
            name="rfq.coil.slitEdge"
            value={localData.rfq?.coil?.slitEdge || ""}
            onChange={handleChange}
            disabled={!isEditing}
            options={EDGE_TYPE_OPTIONS}
          />
        </div>
        <div>
          <Select
            label="Mill Edge"
            name="rfq.coil.millEdge"
            value={localData.rfq?.coil?.millEdge || ""}
            onChange={handleChange}
            disabled={!isEditing}
            options={EDGE_TYPE_OPTIONS}
          />
        </div>
        <div>
          <Select
            label="Require Coil Car"
            name="rfq.coil.requireCoilCar"
            value={localData.rfq?.coil?.requireCoilCar || ""}
            onChange={handleChange}
            disabled={!isEditing}
            options={YES_NO_OPTIONS}
          />
        </div>
        <div>
          <Select
            label="Running Off Backplate"
            name="rfq.coil.runningOffBackplate"
            value={localData.rfq?.coil?.runningOffBackplate || ""}
            onChange={handleChange}
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
            onChange={handleChange}
            disabled={!isEditing}
            options={YES_NO_OPTIONS}
          />
        </div>
        <div>
          <Select
            label="Change Time Concern"
            name="rfq.coil.changeTimeConcern"
            value={localData.rfq?.coil?.changeTimeConcern || ""}
            onChange={handleChange}
            disabled={!isEditing}
            options={YES_NO_OPTIONS}
          />
        </div>
        <div>
          <Input
            label="Time Change Goal (min)"
            name="rfq.coil.timeChangeGoal"
            value={localData.rfq?.coil?.timeChangeGoal || ""}
            onChange={handleChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
        <div>
          <Select
            label="Loading"
            name="rfq.coil.loading"
            value={localData.rfq?.coil?.loading || ""}
            onChange={handleChange}
            disabled={!isEditing}
            options={LOADING_OPTIONS}
          />
        </div>
      </div>
    </Card>
  ), [localData, handleChange, isEditing]);

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
            onChange={handleChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Coil Width (in)"
            name="common.material.coilWidth"
            value={localData.common?.material?.coilWidth?.toString() || ""}
            onChange={handleChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
        <div>
          <Select
            label="Material Type"
            name="common.material.materialType"
            value={localData.common?.material?.materialType || ""}
            onChange={handleChange}
            disabled={!isEditing}
            options={MATERIAL_TYPE_OPTIONS}
          />
        </div>
        <div>
          <Input
            label="Max Yield Strength (PSI)"
            name="common.material.maxYieldStrength"
            value={localData.common?.material?.maxYieldStrength?.toString() || ""}
            onChange={handleChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Max Tensile Strength (PSI)"
            name="common.material.maxTensileStrength"
            value={localData.common?.material?.maxTensileStrength?.toString() || ""}
            onChange={handleChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
      </div>
    </Card>
  ), [localData, handleChange, isEditing]);

  // Press Information Section
  const pressInfoSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Press Information
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div>
          <Select
            label="Gap Frame Press"
            name="rfq.press.gapFramePress"
            value={localData.rfq?.press?.gapFramePress || ""}
            onChange={handleChange}
            disabled={!isEditing}
            options={YES_NO_OPTIONS}
          />
        </div>
        <div>
          <Select
            label="Hydraulic Press"
            name="rfq.press.hydraulicPress"
            value={localData.rfq?.press?.hydraulicPress || ""}
            onChange={handleChange}
            disabled={!isEditing}
            options={YES_NO_OPTIONS}
          />
        </div>
        <div>
          <Select
            label="OBI"
            name="rfq.press.obi"
            value={localData.rfq?.press?.obi || ""}
            onChange={handleChange}
            disabled={!isEditing}
            options={YES_NO_OPTIONS}
          />
        </div>
        <div>
          <Select
            label="Servo Press"
            name="rfq.press.servoPress"
            value={localData.rfq?.press?.servoPress || ""}
            onChange={handleChange}
            disabled={!isEditing}
            options={YES_NO_OPTIONS}
          />
        </div>
        <div>
          <Select
            label="Shear Die Application"
            name="rfq.press.shearDieApplication"
            value={localData.rfq?.press?.shearDieApplication || ""}
            onChange={handleChange}
            disabled={!isEditing}
            options={YES_NO_OPTIONS}
          />
        </div>
        <div>
          <Select
            label="Straight Side Press"
            name="rfq.press.straightSidePress"
            value={localData.rfq?.press?.straightSidePress || ""}
            onChange={handleChange}
            disabled={!isEditing}
            options={YES_NO_OPTIONS}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div>
          <Input
            label="Tonnage of Press"
            name="rfq.press.tonnageOfPress"
            value={localData.rfq?.press?.tonnageOfPress || ""}
            onChange={handleChange}
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Stroke Length (in)"
            name="rfq.press.strokeLength"
            value={localData.rfq?.press?.strokeLength || ""}
            onChange={handleChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Max SPM"
            name="rfq.press.maxSPM"
            value={localData.rfq?.press?.maxSPM || ""}
            onChange={handleChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Bed Width (in)"
            name="rfq.press.bedWidth"
            value={localData.rfq?.press?.bedWidth || ""}
            onChange={handleChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Bed Length (in)"
            name="rfq.press.bedLength"
            value={localData.rfq?.press?.bedLength || ""}
            onChange={handleChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Window Size (in)"
            name="rfq.press.windowSize"
            value={localData.rfq?.press?.windowSize || ""}
            onChange={handleChange}
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
            onChange={handleChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Other Press Type"
            name="rfq.press.other"
            value={localData.rfq?.press?.other || ""}
            onChange={handleChange}
            disabled={!isEditing}
          />
        </div>
      </div>
    </Card>
  ), [localData, handleChange, isEditing]);

  // Dies Information Section
  const diesInfoSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Dies Information
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Select
            label="Transfer Dies"
            name="rfq.dies.transferDies"
            value={localData.rfq?.dies?.transferDies || ""}
            onChange={handleChange}
            disabled={!isEditing}
            options={YES_NO_OPTIONS}
          />
        </div>
        <div>
          <Select
            label="Progressive Dies"
            name="rfq.dies.progressiveDies"
            value={localData.rfq?.dies?.progressiveDies || ""}
            onChange={handleChange}
            disabled={!isEditing}
            options={YES_NO_OPTIONS}
          />
        </div>
        <div>
          <Select
            label="Blanking Dies"
            name="rfq.dies.blankingDies"
            value={localData.rfq?.dies?.blankingDies || ""}
            onChange={handleChange}
            disabled={!isEditing}
            options={YES_NO_OPTIONS}
          />
        </div>
      </div>
    </Card>
  ), [localData, handleChange, isEditing]);

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
              onChange={handleChange}
              type="number"
              disabled={!isEditing}
            />
            <Input
              label="SPM"
              name="common.feedRates.average.spm"
              value={localData.common?.feedRates?.average?.spm?.toString() || ""}
              onChange={handleChange}
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
              onChange={handleChange}
              type="number"
              disabled={!isEditing}
            />
            <Input
              label="SPM"
              name="common.feedRates.max.spm"
              value={localData.common?.feedRates?.max?.spm?.toString() || ""}
              onChange={handleChange}
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
              onChange={handleChange}
              type="number"
              disabled={!isEditing}
            />
            <Input
              label="SPM"
              name="common.feedRates.min.spm"
              value={localData.common?.feedRates?.min?.spm?.toString() || ""}
              onChange={handleChange}
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
            onChange={handleChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
      </div>
    </Card>
  ), [localData, handleChange, isEditing]);

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
            onChange={handleChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
        <div>
          <Input
            label="Equipment Space Width (in)"
            name="rfq.equipmentSpaceWidth"
            value={localData.rfq?.equipmentSpaceWidth?.toString() || ""}
            onChange={handleChange}
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
            onChange={handleChange}
            disabled={!isEditing}
            options={YES_NO_OPTIONS}
          />
        </div>
        <div>
          <Select
            label="Adequate Support"
            name="rfq.mount.adequateSupport"
            value={localData.rfq?.mount?.adequateSupport || ""}
            onChange={handleChange}
            disabled={!isEditing}
            options={YES_NO_OPTIONS}
          />
        </div>
        <div>
          <Select
            label="Custom Mounting"
            name="rfq.mount.customMounting"
            value={localData.rfq?.mount?.customMounting || ""}
            onChange={handleChange}
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
            onChange={handleChange}
            type="number"
            disabled={!isEditing}
          />
        </div>
        <div>
          <Select
            label="Loop Pit"
            name="rfq.loopPit"
            value={localData.rfq?.loopPit || ""}
            onChange={handleChange}
            disabled={!isEditing}
            options={YES_NO_OPTIONS}
          />
        </div>
        <div>
          <Select
            label="Feed Direction"
            name="common.equipment.feed.direction"
            value={localData.common?.equipment?.feed?.direction || ""}
            onChange={handleChange}
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
          onChange={handleChange}
          rows={3}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData, handleChange, isEditing]);

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
            onChange={handleChange}
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
          onChange={handleChange}
          rows={4}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData, handleChange, isEditing]);

  // Status indicator component
  const StatusIndicator = () => {
    if (updateLoading) {
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
      {(loading || updateLoading) && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-blue-800">
              {updateLoading ? "Saving changes and calculating FPM..." : "Loading..."}
            </span>
          </div>
        </div>
      )}

      {(error || updateError) && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <span className="text-red-800">
            Error: {error || updateError}
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