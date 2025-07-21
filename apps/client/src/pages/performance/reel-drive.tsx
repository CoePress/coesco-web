import { useState } from "react";
import Card from "@/components/common/card";
import Input from "@/components/common/input";
import Text from "@/components/common/text";
import { useCreateReelDrive } from "@/hooks/performance/use-create-reel-drive";
import { useGetReelDrive } from "@/hooks/performance/use-get-reel-drive";
import { snakeToCamel } from "@/utils";
import { usePerformanceSheet } from "@/contexts/performance.context";

// Mapping utility for backend-to-frontend Reel Drive data
export function mapBackendToFrontendReelDrive(
  backendData: any,
  prevReelDrive?: any
) {
  const camel = snakeToCamel(backendData || {});
  return {
    referenceNumber:
      backendData.reference ||
      backendData.referenceNumber ||
      prevReelDrive?.referenceNumber ||
      "",
    ...(prevReelDrive || {}),
    ...camel,
  };
}

export default function ReelDrive() {
  const { performanceSheet, setPerformanceSheet, updatePerformanceSheet } =
    usePerformanceSheet();
  const {
    createReelDrive,
    isLoading: isSaving,
    status: backendStatus,
  } = useCreateReelDrive();
  const {
    getReelDrive,
    isLoading: isGetting,
    status: getBackendStatus,
  } = useGetReelDrive();
  const [status, setStatus] = useState("");

  // Always use context as the single source of truth
  const form = performanceSheet.reelDrive || {};

  // (Removed: useEffect that auto-fetches on reference number change)

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    updatePerformanceSheet({ reelDrive: { ...form, [name]: value } });
  };

  // Accept an optional reference number to fetch by
  const handleGetData = async (refOverride?: string) => {
    const ref =
      refOverride || form.referenceNumber || performanceSheet.referenceNumber;
    if (!ref) {
      setStatus("No reference number.");
      return;
    }
    try {
      const backendData = await getReelDrive(ref);
      if (backendData) {
        setPerformanceSheet((prev) => ({
          ...prev,
          reelDrive: mapBackendToFrontendReelDrive(backendData, prev.reelDrive),
        }));
        setStatus("Loaded from backend.");
      } else {
        setStatus("No saved data found.");
      }
    } catch (err) {
      setStatus("Backend unavailable. No saved data found.");
    }
  };

  const handleSetData = async () => {
    if (!form.referenceNumber && !performanceSheet.referenceNumber) {
      setStatus("No reference number.");
      return;
    }
    try {
      await createReelDrive({
        ...form,
        referenceNumber:
          form.referenceNumber || performanceSheet.referenceNumber,
      });
      setStatus("Saved to backend.");
    } catch (err) {
      setStatus("Backend unavailable. Unable to save.");
    }
  };

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
            value={form.customer || ""}
            onChange={handleChange}
          />
          <Input
            label="Date"
            name="date"
            type="date"
            value={form.date || ""}
            onChange={handleChange}
          />
        </div>
      </Card>
      <Card className="mb-0 p-4">
        <Text
          as="h3"
          className="mb-4 text-lg font-medium">
          Model & HP
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Input
            label="Reel Model"
            name="reelModel"
            value={form.reelModel || ""}
            onChange={handleChange}
          />
          <Input
            label="HP"
            name="hp"
            value={form.hp || ""}
            onChange={handleChange}
          />
        </div>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {/* REEL */}
        <Card className="p-4">
          <Text
            as="h3"
            className="mb-4 text-lg font-medium">
            Reel
          </Text>
          <div className="space-y-2">
            <Input
              id="reelSize"
              name="reelSize"
              label="SIZE"
              value={form.reelSize || ""}
              onChange={handleChange}
            />
            <Input
              id="reelMaxWidth"
              name="reelMaxWidth"
              label="MAX WIDTH"
              value={form.reelMaxWidth || ""}
              onChange={handleChange}
            />
            <Input
              id="reelBrgDist"
              name="reelBrgDist"
              label="BRG. DIST."
              value={form.reelBrgDist || ""}
              onChange={handleChange}
            />
            <Input
              id="reelFBrgDia"
              name="reelFBrgDia"
              label="F. BRG. DIA."
              value={form.reelFBrgDia || ""}
              onChange={handleChange}
            />
            <Input
              id="reelRBrgDia"
              name="reelRBrgDia"
              label="R. BRG. DIA."
              value={form.reelRBrgDia || ""}
              onChange={handleChange}
            />
          </div>
        </Card>
        {/* MANDREL */}
        <Card className="p-4">
          <Text
            as="h3"
            className="mb-4 text-lg font-medium">
            Mandrel
          </Text>
          <div className="space-y-2">
            <Input
              id="mandrelDiameter"
              name="mandrelDiameter"
              label="DIAMETER"
              value={form.mandrelDiameter || ""}
              onChange={handleChange}
            />
            <Input
              id="mandrelLength"
              name="mandrelLength"
              label="LENGTH"
              value={form.mandrelLength || ""}
              onChange={handleChange}
            />
            <Input
              id="mandrelMaxRPM"
              name="mandrelMaxRPM"
              label="MAX RPM"
              value={form.mandrelMaxRPM || ""}
              onChange={handleChange}
            />
            <Input
              id="mandrelRPMFull"
              name="mandrelRPMFull"
              label="RPM FULL"
              value={form.mandrelRPMFull || ""}
              onChange={handleChange}
            />
            <Input
              id="mandrelWeight"
              name="mandrelWeight"
              label="WEIGHT"
              value={form.mandrelWeight || ""}
              onChange={handleChange}
            />
            <Input
              id="mandrelInertia"
              name="mandrelInertia"
              label="INERTIA"
              value={form.mandrelInertia || ""}
              onChange={handleChange}
            />
            <Input
              id="mandrelReflInert"
              name="mandrelReflInert"
              label="REFL. INERT."
              value={form.mandrelReflInert || ""}
              onChange={handleChange}
            />
          </div>
        </Card>
        {/* BACKPLATE */}
        <Card className="p-4">
          <Text
            as="h3"
            className="mb-4 text-lg font-medium">
            Backplate
          </Text>
          <div className="space-y-2">
            <Input
              id="backplateDiameter"
              name="backplateDiameter"
              label="DIAMETER"
              value={form.backplateDiameter || ""}
              onChange={handleChange}
            />
            <Input
              id="backplateThickness"
              name="backplateThickness"
              label="THICKNESS"
              value={form.backplateThickness || ""}
              onChange={handleChange}
            />
            <Input
              id="backplateWeight"
              name="backplateWeight"
              label="WEIGHT"
              value={form.backplateWeight || ""}
              onChange={handleChange}
            />
            <Input
              id="backplateInertia"
              name="backplateInertia"
              label="INERTIA"
              value={form.backplateInertia || ""}
              onChange={handleChange}
            />
            <Input
              id="backplateReflInert"
              name="backplateReflInert"
              label="REFL. INERT."
              value={form.backplateReflInert || ""}
              onChange={handleChange}
            />
          </div>
        </Card>
        {/* COIL */}
        <Card className="p-4">
          <Text
            as="h3"
            className="mb-4 text-lg font-medium">
            Coil
          </Text>
          <div className="space-y-2">
            <Input
              id="coilDensity"
              name="coilDensity"
              label="DENSITY"
              value={form.coilDensity || ""}
              onChange={handleChange}
            />
            <Input
              id="coilOD"
              name="coilOD"
              label="O.D."
              value={form.coilOD || ""}
              onChange={handleChange}
            />
            <Input
              id="coilID"
              name="coilID"
              label="I.D."
              value={form.coilID || ""}
              onChange={handleChange}
            />
            <Input
              id="coilWidth"
              name="coilWidth"
              label="WIDTH"
              value={form.coilWidth || ""}
              onChange={handleChange}
            />
            <Input
              id="coilWeight"
              name="coilWeight"
              label="WEIGHT"
              value={form.coilWeight || ""}
              onChange={handleChange}
            />
            <Input
              id="coilInertia"
              name="coilInertia"
              label="INERTIA"
              value={form.coilInertia || ""}
              onChange={handleChange}
            />
            <Input
              id="coilReflInert"
              name="coilReflInert"
              label="REFL. INERT."
              value={form.coilReflInert || ""}
              onChange={handleChange}
            />
          </div>
        </Card>
        {/* REDUCER */}
        <Card className="p-4">
          <Text
            as="h3"
            className="mb-4 text-lg font-medium">
            Reducer
          </Text>
          <div className="space-y-2">
            <Input
              id="reducerRatio"
              name="reducerRatio"
              label="RATIO"
              value={form.reducerRatio || ""}
              onChange={handleChange}
            />
            <Input
              id="reducerEfficiency"
              name="reducerEfficiency"
              label="EFFICIENCY"
              value={form.reducerEfficiency || ""}
              onChange={handleChange}
            />
            <Input
              id="reducerDriving"
              name="reducerDriving"
              label="DRIVING"
              value={form.reducerDriving || ""}
              onChange={handleChange}
            />
            <Input
              id="reducerBackdriving"
              name="reducerBackdriving"
              label="BACKDRIVING"
              value={form.reducerBackdriving || ""}
              onChange={handleChange}
            />
            <Input
              id="reducerInertia"
              name="reducerInertia"
              label="INERTIA"
              value={form.reducerInertia || ""}
              onChange={handleChange}
            />
            <Input
              id="reducerReflInert"
              name="reducerReflInert"
              label="REFL. INERT."
              value={form.reducerReflInert || ""}
              onChange={handleChange}
            />
          </div>
        </Card>
        {/* CHAIN */}
        <Card className="p-4">
          <Text
            as="h3"
            className="mb-4 text-lg font-medium">
            Chain
          </Text>
          <div className="space-y-2">
            <Input
              id="chainRatio"
              name="chainRatio"
              label="RATIO"
              value={form.chainRatio || ""}
              onChange={handleChange}
            />
            <Input
              id="chainSprktOD"
              name="chainSprktOD"
              label="SPRK. O.D."
              value={form.chainSprktOD || ""}
              onChange={handleChange}
            />
            <Input
              id="chainSprktThk"
              name="chainSprktThk"
              label="SPRK. THK."
              value={form.chainSprktThk || ""}
              onChange={handleChange}
            />
            <Input
              id="chainWeight"
              name="chainWeight"
              label="WEIGHT"
              value={form.chainWeight || ""}
              onChange={handleChange}
            />
            <Input
              id="chainInertia"
              name="chainInertia"
              label="INERTIA"
              value={form.chainInertia || ""}
              onChange={handleChange}
            />
            <Input
              id="chainReflInert"
              name="chainReflInert"
              label="REFL. INERT."
              value={form.chainReflInert || ""}
              onChange={handleChange}
            />
          </div>
        </Card>
        {/* TOTAL */}
        <Card className="p-4">
          <Text
            as="h3"
            className="mb-4 text-lg font-medium">
            Total
          </Text>
          <div className="space-y-2">
            <Input
              id="totalRatio"
              name="totalRatio"
              label="RATIO"
              value={form.totalRatio || ""}
              onChange={handleChange}
            />
            <Input
              id="totalReflInertiaEmpty"
              name="totalReflInertiaEmpty"
              label="TOTAL REFL. INERTIA EMPTY"
              value={form.totalReflInertiaEmpty || ""}
              onChange={handleChange}
            />
            <Input
              id="totalReflInertiaFull"
              name="totalReflInertiaFull"
              label="TOTAL REFL. INERTIA FULL"
              value={form.totalReflInertiaFull || ""}
              onChange={handleChange}
            />
          </div>
        </Card>
        {/* MOTOR */}
        <Card className="p-4">
          <Text
            as="h3"
            className="mb-4 text-lg font-medium">
            Motor
          </Text>
          <div className="space-y-2">
            <Input
              id="motorHP"
              name="motorHP"
              label="HP"
              value={form.motorHP || ""}
              onChange={handleChange}
            />
            <Input
              id="motorInertia"
              name="motorInertia"
              label="INERTIA"
              value={form.motorInertia || ""}
              onChange={handleChange}
            />
            <Input
              id="motorBaseRPM"
              name="motorBaseRPM"
              label="BASE RPM"
              value={form.motorBaseRPM || ""}
              onChange={handleChange}
            />
            <Input
              id="motorRPMFull"
              name="motorRPMFull"
              label="RPM FULL"
              value={form.motorRPMFull || ""}
              onChange={handleChange}
            />
          </div>
        </Card>
        {/* FRICTION */}
        <Card className="p-4">
          <Text
            as="h3"
            className="mb-4 text-lg font-medium">
            Friction
          </Text>
          <div className="space-y-2">
            <Input
              id="frictionRBrgMand"
              name="frictionRBrgMand"
              label="R. BRG. MAND."
              value={form.frictionRBrgMand || ""}
              onChange={handleChange}
            />
            <Input
              id="frictionFBrgMand"
              name="frictionFBrgMand"
              label="F. BRG. MAND."
              value={form.frictionFBrgMand || ""}
              onChange={handleChange}
            />
            <Input
              id="frictionFBrgCoil"
              name="frictionFBrgCoil"
              label="F. BRG. COIL"
              value={form.frictionFBrgCoil || ""}
              onChange={handleChange}
            />
            <Input
              id="frictionTotalEmpty"
              name="frictionTotalEmpty"
              label="TOTAL EMPTY"
              value={form.frictionTotalEmpty || ""}
              onChange={handleChange}
            />
            <Input
              id="frictionTotalFull"
              name="frictionTotalFull"
              label="TOTAL FULL"
              value={form.frictionTotalFull || ""}
              onChange={handleChange}
            />
            <Input
              id="frictionReflEmpty"
              name="frictionReflEmpty"
              label="REFL. EMPTY"
              value={form.frictionReflEmpty || ""}
              onChange={handleChange}
            />
            <Input
              id="frictionReflFull"
              name="frictionReflFull"
              label="REFL. FULL"
              value={form.frictionReflFull || ""}
              onChange={handleChange}
            />
          </div>
        </Card>
        {/* SPEED & ACCELERATION */}
        <Card className="p-4">
          <Text
            as="h3"
            className="mb-4 text-lg font-medium">
            Speed & Acceleration
          </Text>
          <div className="space-y-2">
            <Input
              id="speed"
              name="speed"
              label="SPEED"
              value={form.speed || ""}
              onChange={handleChange}
            />
            <Input
              id="accelRate"
              name="accelRate"
              label="ACCEL RATE"
              value={form.accelRate || ""}
              onChange={handleChange}
            />
            <Input
              id="accelTime"
              name="accelTime"
              label="ACCEL TIME"
              value={form.accelTime || ""}
              onChange={handleChange}
            />
          </div>
        </Card>
        {/* TORQUE */}
        <Card className="p-4">
          <Text
            as="h3"
            className="mb-4 text-lg font-medium">
            Torque
          </Text>
          <div className="space-y-2">
            <Input
              id="torqueEmpty"
              name="torqueEmpty"
              label="EMPTY"
              value={form.torqueEmpty || ""}
              onChange={handleChange}
            />
            <Input
              id="torqueFull"
              name="torqueFull"
              label="FULL"
              value={form.torqueFull || ""}
              onChange={handleChange}
            />
          </div>
        </Card>
        {/* HP REQ'D */}
        <Card className="p-4">
          <Text
            as="h3"
            className="mb-4 text-lg font-medium">
            HP Req'd
          </Text>
          <div className="space-y-2">
            <Input
              id="hpReqdEmpty"
              name="hpReqdEmpty"
              label="EMPTY"
              value={form.hpReqdEmpty || ""}
              onChange={handleChange}
            />
            <Input
              id="hpReqdFull"
              name="hpReqdFull"
              label="FULL"
              value={form.hpReqdFull || ""}
              onChange={handleChange}
            />
            <div className="flex items-center">
              <label className="w-36 font-medium">OK:</label>
              <span className="bg-green-100 text-green-800 font-semibold px-2 py-1 rounded">
                OK
              </span>
            </div>
          </div>
        </Card>
        {/* REGEN */}
        <Card className="p-4">
          <Text
            as="h3"
            className="mb-4 text-lg font-medium">
            Regen
          </Text>
          <div className="space-y-2">
            <Input
              id="regenEmpty"
              name="regenEmpty"
              label="EMPTY"
              value={form.regenEmpty || ""}
              onChange={handleChange}
            />
            <Input
              id="regenFull"
              name="regenFull"
              label="FULL"
              value={form.regenFull || ""}
              onChange={handleChange}
            />
            <div className="flex items-center">
              <label className="w-36 font-medium">YES:</label>
              <span className="bg-green-100 text-green-800 font-semibold px-2 py-1 rounded">
                YES
              </span>
            </div>
          </div>
        </Card>
        {/* NOTES */}
        <Card className="p-4">
          <Text
            as="h3"
            className="mb-4 text-lg font-medium">
            Notes
          </Text>
          <div className="space-y-2">
            <Input
              id="usePulloff"
              name="usePulloff"
              label="USE PULLOFF"
              value={form.usePulloff || ""}
              onChange={handleChange}
            />
          </div>
        </Card>
      </div>
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
