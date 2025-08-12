import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { debounce } from "lodash";
import Card from "@/components/common/card";
import Input from "@/components/common/input";
import Select from "@/components/common/select";
import Text from "@/components/common/text";
import { PerformanceData } from "@/contexts/performance.context";
import { 
  REEL_MODEL_OPTIONS,
  REEL_HORSEPOWER_OPTIONS,
} from "@/utils/select-options";
import { useUpdateEntity } from "@/hooks/_base/use-update-entity";
import { useGetEntity } from "@/hooks/_base/use-get-entity";

export interface ReelDriveProps {
  data: PerformanceData;
  isEditing: boolean;
}

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

const ReelDrive: React.FC<ReelDriveProps> = ({ data, isEditing }) => {
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

        console.log("Saving Reel Drive changes:", changes);
        
        const response = await updateEntity(performanceSheetId, { data: updatedData });
        
        // Handle calculated values from backend
        if (response?.data?.reel_drive) {
          console.log("Updating calculated reel drive values from backend response");
          
          setLocalData(prevData => ({
            ...prevData,
            reel: {
              ...prevData.reelDrive?.reel,
              // Update calculated fields from response
              mandrel: {
                ...prevData.reelDrive?.reel?.mandrel,
                maxRPM: response.data.reel_drive.mandrel?.maxRPM || prevData.reelDrive?.reel?.mandrel?.maxRPM,
                RpmFull: response.data.reel_drive.mandrel?.RpmFull || prevData.reelDrive?.reel?.mandrel?.RpmFull,
                weight: response.data.reel_drive.mandrel?.weight || prevData.reelDrive?.reel?.mandrel?.weight,
                inertia: response.data.reel_drive.mandrel?.inertia || prevData.reelDrive?.reel?.mandrel?.inertia,
                reflInertia: response.data.reel_drive.mandrel?.reflInertia || prevData.reelDrive?.reel?.mandrel?.reflInertia,
              },
              backplate: {
                ...prevData.reelDrive?.reel?.backplate,
                weight: response.data.reel_drive.backplate?.weight || prevData.reelDrive?.reel?.backplate?.weight,
                inertia: response.data.reel_drive.backplate?.inertia || prevData.reelDrive?.reel?.backplate?.inertia,
                reflInertia: response.data.reel_drive.backplate?.reflInertia || prevData.reelDrive?.reel?.backplate?.reflInertia,
              },
              reducer: {
                ...prevData.reelDrive?.reel?.reducer,
                reflInertia: response.data.reel_drive.reducer?.reflInertia || prevData.reelDrive?.reel?.reducer?.reflInertia,
              },
              chain: {
                ...prevData.reelDrive?.reel?.chain,
                inertia: response.data.reel_drive.chain?.inertia || prevData.reelDrive?.reel?.chain?.inertia,
                reflInertia: response.data.reel_drive.chain?.reflInertia || prevData.reelDrive?.reel?.chain?.reflInertia,
              },
              ratio: response.data.reel_drive.ratio || prevData.reelDrive?.reel?.ratio,
              totalReflInertia: {
                ...prevData.reelDrive?.reel?.totalReflInertia,
                empty: response.data.reel_drive.totalReflInertia?.empty || prevData.reelDrive?.reel?.totalReflInertia?.empty,
                full: response.data.reel_drive.totalReflInertia?.full || prevData.reelDrive?.reel?.totalReflInertia?.full,
              },
              motor: {
                ...prevData.reelDrive?.reel?.motor,
                rpm: {
                  ...prevData.reelDrive?.reel?.motor?.rpm,
                  base: response.data.reel_drive.motor?.rpm?.base || prevData.reelDrive?.reel?.motor?.rpm?.base,
                  full: response.data.reel_drive.motor?.rpm?.full || prevData.reelDrive?.reel?.motor?.rpm?.full,
                }
              },
              friction: {
                ...prevData.reelDrive?.reel?.friction,
                bearing: {
                  ...prevData.reelDrive?.reel?.friction?.bearing,
                  mandrel: {
                    ...prevData.reelDrive?.reel?.friction?.bearing?.mandrel,
                    rear: response.data.reel_drive.friction?.bearing?.mandrel?.rear || prevData.reelDrive?.reel?.friction?.bearing?.mandrel?.rear,
                    front: response.data.reel_drive.friction?.bearing?.mandrel?.front || prevData.reelDrive?.reel?.friction?.bearing?.mandrel?.front,
                  },
                  coil: {
                    ...prevData.reelDrive?.reel?.friction?.bearing?.coil,
                    front: response.data.reel_drive.friction?.bearing?.coil?.front || prevData.reelDrive?.reel?.friction?.bearing?.coil?.front,
                  },
                  total: {
                    ...prevData.reelDrive?.reel?.friction?.bearing?.total,
                    empty: response.data.reel_drive.friction?.bearing?.total?.empty || prevData.reelDrive?.reel?.friction?.bearing?.total?.empty,
                    full: response.data.reel_drive.friction?.bearing?.total?.full || prevData.reelDrive?.reel?.friction?.bearing?.total?.full,
                  },
                  refl: {
                    ...prevData.reelDrive?.reel?.friction?.bearing?.refl,
                    empty: response.data.reel_drive.friction?.bearing?.refl?.empty || prevData.reelDrive?.reel?.friction?.bearing?.refl?.empty,
                    full: response.data.reel_drive.friction?.bearing?.refl?.full || prevData.reelDrive?.reel?.friction?.bearing?.refl?.full,
                  }
                }
              },
              accelerationTime: response.data.reel_drive.accelerationTime || prevData.reelDrive?.reel?.accelerationTime,
              torque: {
                ...prevData.reelDrive?.reel?.torque,
                empty: {
                  ...prevData.reelDrive?.reel?.torque?.empty,
                  torque: response.data.reel_drive.torque?.empty?.torque || prevData.reelDrive?.reel?.torque?.empty?.torque,
                  horsepowerRequired: response.data.reel_drive.torque?.empty?.horsepowerRequired || prevData.reelDrive?.reel?.torque?.empty?.horsepowerRequired,
                  regen: response.data.reel_drive.torque?.empty?.regen || prevData.reelDrive?.reel?.torque?.empty?.regen,
                  horsepowerCheck: response.data.reel_drive.hp_req?.status_empty || prevData.reelDrive?.reel?.torque?.empty?.horsepowerCheck,
                },
                full: {
                  ...prevData.reelDrive?.reel?.torque?.full,
                  torque: response.data.reel_drive.torque?.full?.torque || prevData.reelDrive?.reel?.torque?.full?.torque,
                  horsepowerRequired: response.data.reel_drive.torque?.full?.horsepowerRequired || prevData.reelDrive?.reel?.torque?.full?.horsepowerRequired,
                  regen: response.data.reel_drive.torque?.full?.regen || prevData.reelDrive?.reel?.torque?.full?.regen,
                  horsepowerCheck: response.data.reel_drive.hp_req?.status_full || prevData.reelDrive?.reel?.torque?.full?.horsepowerCheck,
                }
              },
              reelDriveOK: response.data.reel_drive.usePulloff || prevData.reelDrive?.reel?.reelDriveOK,
            },
            coil: {
              ...prevData.reelDrive?.coil,
              inertia: response.data.reel_drive.coil?.inertia || prevData.reelDrive?.coil?.inertia,
              reflInertia: response.data.reel_drive.coil?.reflInertia || prevData.reelDrive?.coil?.reflInertia,
            }
          }));
        }

        setLastSaved(new Date());
        setIsDirty(false);
        pendingChangesRef.current = {};
        
      } catch (error) {
        console.error('Error saving Reel Drive:', error);
        setFieldErrors(prev => ({ 
          ...prev, 
          _general: 'Failed to save changes. Please try again.' 
        }));
      }
    }, 1000),
    [performanceSheetId, updateEntity, isEditing, localData]
  );

  // Optimized change handler
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!isEditing) return;

    const { name, value, type } = e.target;

    // Clear field error
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Update local state immediately
    setLocalData(prevData => {
      const newData = { ...prevData };
      const processedValue = type === "number" ? (value === "" ? "" : value) : value;
      
      // Handle legacy field mappings
      if (name === "customer") {
        setNestedValue(newData, "rfq.customer", processedValue);
      } else if (name === "date") {
        setNestedValue(newData, "rfq.dates.date", processedValue);
      } else {
        setNestedValue(newData, name, processedValue);
      }
      
      return newData;
    });

    // Track pending changes
    const mappedName = name === "customer" ? "rfq.customer" : 
                      name === "date" ? "rfq.dates.date" : 
                      name;
    pendingChangesRef.current[mappedName] = type === "number" ? (value === "" ? "" : value) : value;
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

  // Header section
  const headerSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Customer & Date
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Customer"
          name="customer"
          value={localData.common?.customer || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          label="Date"
          name="date"
          type="date"
          value={localData.rfq?.dates?.date || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData.common?.customer, localData.rfq?.dates?.date, handleChange, isEditing]);

  // Model & HP section
  const modelHpSection = useMemo(() => (
    <Card className="mb-4 p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Model & HP
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Reel Model"
          name="reel.model"
          value={localData.common?.equipment?.reel?.model !== undefined && localData.common?.equipment?.reel?.model !== null ? String(localData.common?.equipment?.reel.model) : ""}
          onChange={handleChange}
          options={REEL_MODEL_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
          disabled={!isEditing}
        />
        <Select
          label="HP"
          name="reel.horsepower"
          value={localData.common?.equipment?.reel?.horsepower !== undefined && localData.common?.equipment?.reel?.horsepower !== null ? String(localData.common?.equipment?.reel.horsepower) : ""}
          onChange={handleChange}
          options={REEL_HORSEPOWER_OPTIONS.map((opt) => ({
            value: String(opt.value),
            label: opt.label,
          }))}
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData.common?.equipment?.reel?.model, localData.common?.equipment?.reel?.horsepower, handleChange, isEditing]);

  // Reel section
  const reelSection = useMemo(() => (
    <Card className="p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Reel
      </Text>
      <div className="space-y-3">
        <Input
          label="SIZE"
          name="reel.size"
          value={localData.reelDrive?.reel?.size?.toString() || ""}
          onChange={handleChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="MAX WIDTH"
          name="reel.width"
          value={localData.common?.equipment?.reel?.width?.toString() || ""}
          onChange={handleChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="BRG. DIST."
          name="reel.bearing.distance"
          value={localData.reelDrive?.reel?.bearing?.distance?.toString() || ""}
          onChange={handleChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="F. BRG. DIA."
          name="reel.bearing.diameter.front"
          value={localData.reelDrive?.reel?.bearing?.diameter?.front?.toString() || ""}
          onChange={handleChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="R. BRG. DIA."
          name="reel.bearing.diameter.rear"
          value={localData.reelDrive?.reel?.bearing?.diameter?.rear?.toString() || ""}
          onChange={handleChange}
          type="number"
          disabled={!isEditing}
        />
      </div>
    </Card>
  ), [localData.reelDrive?.reel, handleChange, isEditing]);

  // Mandrel section
  const mandrelSection = useMemo(() => (
    <Card className="p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Mandrel
      </Text>
      <div className="space-y-3">
        <Input
          label="DIAMETER"
          name="reel.mandrel.diameter"
          value={localData.reelDrive?.reel?.mandrel?.diameter?.toString() || ""}
          onChange={handleChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="LENGTH"
          name="reel.mandrel.length"
          value={localData.reelDrive?.reel?.mandrel?.length?.toString() || ""}
          onChange={handleChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="MAX RPM"
          name="reel.mandrel.maxRPM"
          value={localData.reelDrive?.reel?.mandrel?.maxRPM?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="RPM FULL"
          name="reel.mandrel.RpmFull"
          value={localData.reelDrive?.reel?.mandrel?.RpmFull?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="WEIGHT"
          name="reel.mandrel.weight"
          value={localData.reelDrive?.reel?.mandrel?.weight?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="INERTIA"
          name="reel.mandrel.inertia"
          value={localData.reelDrive?.reel?.mandrel?.inertia?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="REFL. INERT."
          name="reel.mandrel.reflInertia"
          value={localData.reelDrive?.reel?.mandrel?.reflInertia?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
      </div>
    </Card>
  ), [localData.reelDrive?.reel?.mandrel, handleChange, isEditing]);

  // Backplate section
  const backplateSection = useMemo(() => (
    <Card className="p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Backplate
      </Text>
      <div className="space-y-3">
        <Input
          label="DIAMETER"
          name="reel.backplate.diameter"
          value={localData.common?.equipment?.reel?.backplate?.diameter?.toString() || ""}
          onChange={handleChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="THICKNESS"
          name="reel.backplate.thickness"
          value={localData.reelDrive?.reel?.backplate?.thickness?.toString() || ""}
          onChange={handleChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="WEIGHT"
          name="reel.backplate.weight"
          value={localData.reelDrive?.reel?.backplate?.weight?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="INERTIA"
          name="reel.backplate.inertia"
          value={localData.reelDrive?.reel?.backplate?.inertia?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="REFL. INERT."
          name="reel.backplate.reflInertia"
          value={localData.reelDrive?.reel?.backplate?.reflInertia?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
      </div>
    </Card>
  ), [localData.reelDrive?.reel?.backplate, handleChange, isEditing]);

  // Coil section
  const coilSection = useMemo(() => (
    <Card className="p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Coil
      </Text>
      <div className="space-y-3">
        <Input
          label="DENSITY"
          name="coil.density"
          value={localData.reelDrive?.coil?.density?.toString() || ""}
          onChange={handleChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="O.D."
          name="coil.maxCoilOD"
          value={localData.common?.coil?.maxCoilOD?.toString() || ""}
          onChange={handleChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="I.D."
          name="coil.coilID"
          value={localData.common?.coil?.coilID?.toString() || ""}
          onChange={handleChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="WIDTH"
          name="material.coilWidth"
          value={localData.common?.material?.coilWidth?.toString() || ""}
          onChange={handleChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="WEIGHT"
          name="coil.maxCoilWeight"
          value={localData.common?.coil?.maxCoilWeight?.toString() || ""}
          onChange={handleChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="INERTIA"
          name="coil.inertia"
          value={localData.reelDrive?.coil?.inertia?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="REFL. INERT."
          name="coil.reflInertia"
          value={localData.reelDrive?.coil?.reflInertia?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
      </div>
    </Card>
  ), [localData.reelDrive?.coil, localData.common?.material?.coilWidth, handleChange, isEditing]);

  // Reducer section
  const reducerSection = useMemo(() => (
    <Card className="p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Reducer
      </Text>
      <div className="space-y-3">
        <Input
          label="RATIO"
          name="reel.reducer.ratio"
          value={localData.reelDrive?.reel?.reducer?.ratio?.toString() || ""}
          onChange={handleChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="EFFICIENCY"
          name="reel.reducer.efficiency"
          value={localData.reelDrive?.reel?.reducer?.efficiency?.toString() || ""}
          onChange={handleChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="DRIVING"
          name="reel.reducer.driving"
          value={localData.reelDrive?.reel?.reducer?.driving?.toString() || ""}
          onChange={handleChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="BACKDRIVING"
          name="reel.reducer.backdriving"
          value={localData.reelDrive?.reel?.reducer?.backdriving?.toString() || ""}
          onChange={handleChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="INERTIA"
          name="reel.reducer.inertia"
          value={localData.reelDrive?.reel?.reducer?.inertia?.toString() || ""}
          onChange={handleChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="REFL. INERT."
          name="reel.reducer.reflInertia"
          value={localData.reelDrive?.reel?.reducer?.reflInertia?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
      </div>
    </Card>
  ), [localData.reelDrive?.reel?.reducer, handleChange, isEditing]);

  // Chain section
  const chainSection = useMemo(() => (
    <Card className="p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Chain
      </Text>
      <div className="space-y-3">
        <Input
          label="RATIO"
          name="reel.chain.ratio"
          value={localData.reelDrive?.reel?.chain?.ratio?.toString() || ""}
          onChange={handleChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="SPRK. O.D."
          name="reel.chain.sprktOD"
          value={localData.reelDrive?.reel?.chain?.sprktOD?.toString() || ""}
          onChange={handleChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="SPRK. THK."
          name="reel.chain.sprktThickness"
          value={localData.reelDrive?.reel?.chain?.sprktThickness?.toString() || ""}
          onChange={handleChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="WEIGHT"
          name="reel.chain.weight"
          value={localData.reelDrive?.reel?.chain?.weight?.toString() || ""}
          onChange={handleChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="INERTIA"
          name="reel.chain.inertia"
          value={localData.reelDrive?.reel?.chain?.inertia?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="REFL. INERT."
          name="reel.chain.reflInertia"
          value={localData.reelDrive?.reel?.chain?.reflInertia?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
      </div>
    </Card>
  ), [localData.reelDrive?.reel?.chain, handleChange, isEditing]);

  // Total section
  const totalSection = useMemo(() => (
    <Card className="p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Total
      </Text>
      <div className="space-y-3">
        <Input
          label="RATIO"
          name="reel.ratio"
          value={localData.reelDrive?.reel?.ratio?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="TOTAL REFL. INERTIA EMPTY"
          name="reel.totalReflInertia.empty"
          value={localData.reelDrive?.reel?.totalReflInertia?.empty?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="TOTAL REFL. INERTIA FULL"
          name="reel.totalReflInertia.full"
          value={localData.reelDrive?.reel?.totalReflInertia?.full?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
      </div>
    </Card>
  ), [localData.reelDrive?.reel?.ratio, localData.reelDrive?.reel?.totalReflInertia]);

  // Motor section
  const motorSection = useMemo(() => (
    <Card className="p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Motor
      </Text>
      <div className="space-y-3">
        <Input
          label="HP"
          name="reel.horsepower"
          value={localData.common?.equipment?.reel?.horsepower?.toString() || ""}
          onChange={handleChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="INERTIA"
          name="reel.motor.inertia"
          value={localData.reelDrive?.reel?.motor?.inertia?.toString() || ""}
          onChange={handleChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="BASE RPM"
          name="reel.motor.rpm.base"
          value={localData.reelDrive?.reel?.motor?.rpm?.base?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="RPM FULL"
          name="reel.motor.rpm.full"
          value={localData.reelDrive?.reel?.motor?.rpm?.full?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
      </div>
    </Card>
  ), [localData.common?.equipment?.reel?.horsepower, localData.reelDrive?.reel?.motor, handleChange, isEditing]);

  // Friction section
  const frictionSection = useMemo(() => (
    <Card className="p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Friction
      </Text>
      <div className="space-y-3">
        <Input
          label="R. BRG. MAND."
          name="reel.friction.bearing.mandrel.rear"
          value={localData.reelDrive?.reel?.friction?.bearing?.mandrel?.rear?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="F. BRG. MAND."
          name="reel.friction.bearing.mandrel.front"
          value={localData.reelDrive?.reel?.friction?.bearing?.mandrel?.front?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="F. BRG. COIL"
          name="reel.friction.bearing.coil.front"
          value={localData.reelDrive?.reel?.friction?.bearing?.coil?.front?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="TOTAL EMPTY"
          name="reel.friction.bearing.total.empty"
          value={localData.reelDrive?.reel?.friction?.bearing?.total?.empty?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="TOTAL FULL"
          name="reel.friction.bearing.total.full"
          value={localData.reelDrive?.reel?.friction?.bearing?.total?.full?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="REFL. EMPTY"
          name="reel.friction.bearing.refl.empty"
          value={localData.reelDrive?.reel?.friction?.bearing?.refl?.empty?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="REFL. FULL"
          name="reel.friction.bearing.refl.full"
          value={localData.reelDrive?.reel?.friction?.bearing?.refl?.full?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
      </div>
    </Card>
  ), [localData.reelDrive?.reel?.friction]);

  // Speed & Acceleration section
  const speedAccelSection = useMemo(() => (
    <Card className="p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Speed & Acceleration
      </Text>
      <div className="space-y-3">
        <Input
          label="SPEED"
          name="reel.speed"
          value={localData.reelDrive?.reel?.speed?.toString() || ""}
          onChange={handleChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="ACCEL RATE"
          name="reel.motorization.accelRate"
          value={localData.reelDrive?.reel?.motorization?.accelRate?.toString() || ""}
          onChange={handleChange}
          type="number"
          disabled={!isEditing}
        />
        <Input
          label="ACCEL TIME"
          name="reel.accelerationTime"
          value={localData.reelDrive?.reel?.accelerationTime?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
      </div>
    </Card>
  ), [localData.reelDrive?.reel?.speed, localData.reelDrive?.reel?.motorization?.accelRate, localData.reelDrive?.reel?.accelerationTime, handleChange, isEditing]);

  // Torque section
  const torqueSection = useMemo(() => (
    <Card className="p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Torque
      </Text>
      <div className="space-y-3">
        <Input
          label="EMPTY"
          name="reel.torque.empty.torque"
          value={localData.reelDrive?.reel?.torque?.empty?.torque?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="FULL"
          name="reel.torque.full.torque"
          value={localData.reelDrive?.reel?.torque?.full?.torque?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
      </div>
    </Card>
  ), [localData.reelDrive?.reel?.torque]);

  // HP Req'd section
  const hpReqdSection = useMemo(() => (
    <Card className="p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        HP Req'd
      </Text>
      <div className="space-y-3">
        <Input
          label="EMPTY"
          name="reel.torque.empty.horsepowerRequired"
          value={localData.reelDrive?.reel?.torque?.empty?.horsepowerRequired?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="FULL"
          name="reel.torque.full.horsepowerRequired"
          value={localData.reelDrive?.reel?.torque?.full?.horsepowerRequired?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">OK:</label>
          <span className={`px-2 py-1 rounded text-sm font-semibold ${
            (localData.reelDrive?.reel?.torque?.empty?.horsepowerCheck && localData.reelDrive?.reel?.torque?.full?.horsepowerCheck) 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {(localData.reelDrive?.reel?.torque?.empty?.horsepowerCheck && localData.reelDrive?.reel?.torque?.full?.horsepowerCheck) ? "OK" : "NOT OK"}
          </span>
        </div>
      </div>
    </Card>
  ), [localData.reelDrive?.reel?.torque]);

  // Regen section
  const regenSection = useMemo(() => (
    <Card className="p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Regen
      </Text>
      <div className="space-y-3">
        <Input
          label="EMPTY"
          name="reel.torque.empty.regen"
          value={localData.reelDrive?.reel?.torque?.empty?.regen?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <Input
          label="FULL"
          name="reel.torque.full.regen"
          value={localData.reelDrive?.reel?.torque?.full?.regen?.toString() || ""}
          type="number"
          disabled={true}
          className="bg-gray-50"
        />
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Regen:</label>
          <span className={`px-2 py-1 rounded text-sm font-semibold ${
            (localData.reelDrive?.reel?.torque?.empty?.regen || localData.reelDrive?.reel?.torque?.full?.regen) 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {(localData.reelDrive?.reel?.torque?.empty?.regen || localData.reelDrive?.reel?.torque?.full?.regen) ? "YES" : "NO"}
          </span>
        </div>
      </div>
    </Card>
  ), [localData.reelDrive?.reel?.torque]);

  // Notes section
  const notesSection = useMemo(() => (
    <Card className="p-4">
      <Text as="h3" className="mb-4 text-lg font-medium">
        Notes
      </Text>
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">USE PULLOFF:</label>
          <span className={`px-2 py-1 rounded text-sm font-semibold ${
            localData.reelDrive?.reel?.reelDriveOK 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {localData.reelDrive?.reel?.reelDriveOK ? "NO" : "YES"}
          </span>
        </div>
      </div>
    </Card>
  ), [localData.reelDrive?.reel?.reelDriveOK]);

  // Status indicator component
  const StatusIndicator = () => {
    if (updateLoading) {
      return (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent"></div>
          Calculating...
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
              {updateLoading ? "Saving changes and calculating..." : "Loading..."}
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
      {headerSection}
      {modelHpSection}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {reelSection}
        {mandrelSection}
        {backplateSection}
        {coilSection}
        {reducerSection}
        {chainSection}
        {totalSection}
        {motorSection}
        {frictionSection}
        {speedAccelSection}
        {torqueSection}
        {hpReqdSection}
        {regenSection}
        {notesSection}
      </div>
    </div>
  );
};

export default ReelDrive;