import Card from "@/components/common/card";
import Input from "@/components/common/input";
import Text from "@/components/common/text";
import { useState, useEffect } from "react";
import { useCreateTDDBHD } from "@/hooks/performance/use-create-tddbhd";
import { useGetTDDBHD } from "@/hooks/performance/use-get-tddbhd";
import Select from "@/components/common/select";
import {
  MATERIAL_TYPE_OPTIONS,
  REEL_WIDTTH_OPTIONS,
  BACKPLATE_DIAMETER_OPTIONS,
  HYDRAULIC_THREADING_DRIVE_OPTIONS,
  HOLD_DOWN_ASSY_OPTIONS,
  HOLD_DOWN_CYLINDER_OPTIONS,
  BRAKE_MODEL_OPTIONS,
  BRAKE_QUANTITY_OPTIONS,
} from "@/utils/select-options";
import { usePerformanceSheet } from "@/contexts/performance.context";
import { 
  mapBackendToTDDBHD,
  mapBackendToRFQ,
  mapBackendToReelDrive 
} from "@/utils/universal-mapping";
import { useGetRFQ } from "@/hooks/performance/use-get-rfq";
import { useGetReelDrive } from "@/hooks/performance/use-get-reel-drive";

const TDDBHD = () => {
  const { 
    performanceData, 
    updatePerformanceData,
  } = usePerformanceSheet();
  
  const [status] = useState<string>("");
  const {
    status: backendStatus,
  } = useCreateTDDBHD();
  const {
    status: getBackendStatus,
    fetchedTDDBHD,
  } = useGetTDDBHD();
  const { getRFQ } = useGetRFQ();
  const { getReelDrive } = useGetReelDrive();

  useEffect(() => {
    if (fetchedTDDBHD) {
      const data =
        typeof fetchedTDDBHD === "object" && "tddbhd" in fetchedTDDBHD && fetchedTDDBHD.tddbhd
          ? (fetchedTDDBHD as any).tddbhd
          : fetchedTDDBHD;
      
      // Map backend TDDBHD data to new nested structure using universal mapping
      const mappedData = mapBackendToTDDBHD(data, performanceData);
      updatePerformanceData(mappedData);
      
      // Fetch related data
      const refNum = mappedData.referenceNumber || performanceData.referenceNumber;
      if (refNum) {
        console.log("Fetching RFQ with refNum:", refNum);
        getRFQ(refNum).then((rfqData) => {
          console.log("RFQ backend data:", rfqData);
          if (rfqData) {
            // Map RFQ data to nested structure using universal mapping
            const rfqMappedData = mapBackendToRFQ(rfqData, performanceData);
            updatePerformanceData(rfqMappedData);
            console.log("RFQ data mapped:", rfqMappedData);
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
  }, [fetchedTDDBHD, updatePerformanceData, getRFQ, getReelDrive]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
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
      current[rest[rest.length - 1]] = type === "number" ? (value === "" ? "" : value) : value;
      
      updatePerformanceData(updateObj);
    } else {
      // Handle top-level fields
      updatePerformanceData({
        [name]: value,
      });
    }
  };

  return (
    <div className="w-full flex flex-1 flex-col p-2 gap-2">
      {/* Customer and Date Info */}
      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Customer & Date
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Customer"
            name="customer"
            value={performanceData.customer || ""}
            onChange={handleChange}
          />
          <Input
            label="Date"
            name="dates.date"
            type="date"
            value={performanceData.dates?.date || ""}
            onChange={handleChange}
          />
        </div>
      </Card>
      
      {/* Reel & Material Specs */}
      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">
          Reel & Material Specs
        </Text>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <Input
            label="Reel Model"
            name="reel.model"
            value={performanceData.reel?.model || ""}
            onChange={handleChange}
          />
          <Select
            label="Reel Width"
            name="reel.width"
            value={performanceData.reel?.width !== undefined 
                && performanceData.reel?.width !== null ? String(performanceData.reel.width) : ""}
            onChange={handleChange}
            options={REEL_WIDTTH_OPTIONS.map((opt) => ({
              value: opt.value,
              label: opt.Label,
            }))}
          />
          <Select
            label="Backplate Diameter"
            name="reel.backplate.diameter"
            value={performanceData.reel?.backplate?.diameter !== undefined 
                && performanceData.reel?.backplate?.diameter !== null ? String(performanceData.reel.backplate.diameter) : ""}
            onChange={handleChange}
            options={BACKPLATE_DIAMETER_OPTIONS.map((opt) => ({
              value: opt.value,
              label: opt.Label,
            }))}
          />
          <Select
            label="Material Type"
            name="material.materialType"
            value={performanceData.material?.materialType || ""}
            onChange={handleChange}
            options={MATERIAL_TYPE_OPTIONS}
          />
          <Input
            label="Material Width (in)"
            name="material.coilWidth"
            value={performanceData.material?.coilWidth || ""}
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
          <Input
            label="Material Yield Strength (psi)"
            name="material.maxYieldStrength"
            value={performanceData.material?.maxYieldStrength || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Air Pressure Available (psi)"
            name="reel.airPressureAvailable"
            value={performanceData.reel?.airPressureAvailable || ""}
            onChange={handleChange}
            type="number"
          />
          <Input
            label="Required Decel. Rate (ft/sec²)"
            name="reel.requiredDecelRate"
            value={performanceData.reel?.requiredDecelRate || ""}
            onChange={handleChange}
            type="number"
          />
        </div>
        
        {/* Coil, Brake & Other Specs */}
        <Card className="mb-4 p-4">
          <Text as="h3" className="mb-4 text-lg font-medium">
            Coil, Brake & Other Specs
          </Text>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Input
              label="Coil Weight (lbs)"
              name="coil.maxCoilWeight"
              value={performanceData.coil?.maxCoilWeight || ""}
              onChange={handleChange}
              type="number"
            />
            <Input
              label="Coil O.D. (in)"
              name="coil.maxCoilOD"
              value={performanceData.coil?.maxCoilOD || ""}
              onChange={handleChange}
              type="number"
            />
            <Input
              label="Disp. (Reel) Mtr."
              name="reel.dispReelMtr"
              value={performanceData.reel?.dispReelMtr || ""}
              onChange={handleChange}
            />
            <Input
              label="Web Tension (psi)"
              name="reel.webTension.psi"
              value={performanceData.reel?.webTension?.psi || ""}
              onChange={handleChange}
              type="number"
            />
            <Input
              label="Web Tension (lbs)"
              name="reel.webTension.lbs"
              value={performanceData.reel?.webTension?.lbs || ""}
              onChange={handleChange}
              type="number"
            />
            <Input
              label="Brake Pad Diameter (in)"
              name="reel.brakePadDiameter"
              value={performanceData.reel?.brakePadDiameter || ""}
              onChange={handleChange}
              type="number"
            />
            <Input
              label="Cylinder Bore (in)"
              name="reel.cylinderBore"
              value={performanceData.reel?.cylinderBore || ""}
              onChange={handleChange}
              type="number"
            />
            <Input
              label="Coefficient of Friction"
              name="reel.coefficientOfFriction"
              value={performanceData.reel?.coefficientOfFriction || ""}
              onChange={handleChange}
              type="number"
            />
          </div>
        </Card>
        
        {/* Threading Drive and Hold Down */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Card className="p-4">
            <Text as="h3" className="mb-4 text-lg font-medium">
              Threading Drive
            </Text>
            <div className="space-y-4">
              <Input
                label="Air Clutch"
                name="reel.threadingDrive.airClutch"
                value={performanceData.reel?.threadingDrive?.airClutch || ""}
                onChange={handleChange}
              />
              <Select
                label="Hyd. Threading Drive"
                name="reel.threadingDrive.hydThreadingDrive"
                value={performanceData.reel?.threadingDrive?.hydThreadingDrive || ""}
                onChange={handleChange}
                options={HYDRAULIC_THREADING_DRIVE_OPTIONS}
              />
              <Input
                label="Torque At Mandrel (in. lbs.)"
                name="reel.torque.atMandrel"
                value={performanceData.reel?.torque?.atMandrel || ""}
                onChange={handleChange}
                type="number"
              />
              <Input
                label="Rewind Torque Req. (in. lbs.)"
                name="reel.torque.rewindRequired"
                value={performanceData.reel?.torque?.rewindRequired || ""}
                onChange={handleChange}
                type="number"
              />
            </div>
          </Card>
          
          <Card className="p-4">
            <Text as="h3" className="mb-4 text-lg font-medium">
              Hold Down
            </Text>
            <div className="space-y-4">
              <Select
                label="Hold Down Assy"
                name="reel.holddown.assy"
                value={performanceData.reel?.holddown?.assy || ""}
                onChange={handleChange}
                options={HOLD_DOWN_ASSY_OPTIONS}
              />
              <Input
                label="Holddown Pressure (psi)"
                name="reel.holddown.cylinderPressure"
                value={performanceData.reel?.holddown?.cylinderPressure || ""}
                onChange={handleChange}
                type="number"
              />
              <Input
                label="Hold Down Force Required (lbs)"
                name="reel.holddown.force.required"
                value={performanceData.reel?.holddown?.force?.required || ""}
                onChange={handleChange}
                type="number"
              />
              <Input
                label="Hold Down Force Available (lbs)"
                name="reel.holddown.force.available"
                value={performanceData.reel?.holddown?.force?.available || ""}
                onChange={handleChange}
                type="number"
              />
              <Input
                label="Min. Material Width (in)"
                name="reel.minMaterialWidth"
                value={performanceData.reel?.minMaterialWidth || ""}
                onChange={handleChange}
                type="number"
              />
            </div>
          </Card>
        </div>
        
        {/* Cylinder and Drag Brake */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Card className="p-4">
            <Text as="h3" className="mb-4 text-lg font-medium">
              Cylinder
            </Text>
            <div className="space-y-4">
              <Select
                label="Type"
                name="reel.holddown.cylinderType"
                value={performanceData.reel?.holddown?.cylinder || ""}
                onChange={handleChange}
                options={HOLD_DOWN_CYLINDER_OPTIONS}
              />
              <Input
                label="Pressure (psi)"
                name="reel.holddown.cylinderPressure"
                value={performanceData.reel?.holddown?.cylinderPressure || ""}
                onChange={handleChange}
                type="number"
              />
            </div>
          </Card>
          
          <Card className="p-4">
            <Text as="h3" className="mb-4 text-lg font-medium">
              Drag Brake
            </Text>
            <div className="space-y-4">
              <Select
                label="Brake Model"
                name="reel.dragBrake.model"
                value={performanceData.reel?.dragBrake?.model || ""}
                onChange={handleChange}
                options={BRAKE_MODEL_OPTIONS}
              />
              <Select
                label="Brake Quantity"
                name="reel.dragBrake.quantity"
                value={performanceData.reel?.dragBrake?.quantity !== undefined 
                    && performanceData.reel?.dragBrake?.quantity !== null ? String(performanceData.reel.dragBrake.quantity) : ""}
                onChange={handleChange}
                options={BRAKE_QUANTITY_OPTIONS}
              />
              <Input
                label="Torque Required (in. lbs.)"
                name="reel.torque.required"
                value={performanceData.reel?.torque?.required || ""}
                onChange={handleChange}
                type="number"
              />
              <Input
                label="Failsafe - Single Stage (psi air req.)"
                name="reel.dragBrake.psiAirRequired"
                value={performanceData.reel?.dragBrake?.psiAirRequired || ""}
                onChange={handleChange}
                type="number"
              />
              <Input
                label="Failsafe Holding Force (in. lbs.)"
                name="reel.dragBrake.holdingForce"
                value={performanceData.reel?.dragBrake?.holdingForce || ""}
                onChange={handleChange}
                type="number"
              />
            </div>
          </Card>
        </div>
      </Card>
      
      {/* Status Messages */}
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
};

export default TDDBHD;