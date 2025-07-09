import Card from "@/components/shared/card";
import Input from "@/components/shared/input";
import Text from "@/components/shared/text";
import Tabs from "@/components/shared/tabs";
import { useState } from "react";
import { Button } from "@/components";
import { useCreateTDDBHD } from '@/hooks/performance/use-create-tddbhd';
import { useGetTDDBHD } from '@/hooks/performance/use-get-tddbhd';
import { snakeToCamel } from "@/utils";
import Select from "@/components/shared/select";
import { MATERIAL_TYPE_OPTIONS, YES_NO_OPTIONS } from '@/utils/select-options';

const VERSIONS = [
  "Maximum Thick",
  "Max @ Full",
  "Minimum Thick",
  "Max @ Width",
] as const;

type VersionKey = typeof VERSIONS[number];

type VersionedSection<T> = {
  [K in VersionKey]: T;
};

type TDDBHDData = {
  referenceNumber: string;
  customer: string;
  date: string;
  reel: VersionedSection<{
    model: string;
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
    model: string;
    quantity: string;
    torqueRequired: string;
    failsafePSI: string;
    failsafeHoldingForce: string;
  }>;
};

const emptyReel = { model: '', width: '', backplate: '', materialType: '', materialWidth: '', thickness: '', yieldStrength: '', airPressure: '', decelRate: '' };
const emptyCoil = { weight: '', od: '', dispReel: '', webTensionPsi: '', webTensionLbs: '' };
const emptyBrake = { padDiameter: '', cylinderBore: '', friction: '' };
const emptyThreadingDrive = { airClutch: '', hydThreadingDrive: '', torqueAtMandrel: '', rewindTorque: '' };
const emptyHoldDown = { assy: '', pressure: '', forceRequired: '', forceAvailable: '', minWidth: '' };
const emptyCylinder = { type: '', pressure: '' };
const emptyDragBrake = { model: '', quantity: '', torqueRequired: '', failsafePSI: '', failsafeHoldingForce: '' };

const defaultTDDBHDData: TDDBHDData = {
  referenceNumber: '',
  customer: '',
  date: '',
  reel: {
    'Maximum Thick': { ...emptyReel },
    'Max @ Full': { ...emptyReel },
    'Minimum Thick': { ...emptyReel },
    'Max @ Width': { ...emptyReel },
  },
  coil: {
    'Maximum Thick': { ...emptyCoil },
    'Max @ Full': { ...emptyCoil },
    'Minimum Thick': { ...emptyCoil },
    'Max @ Width': { ...emptyCoil },
  },
  brake: {
    'Maximum Thick': { ...emptyBrake },
    'Max @ Full': { ...emptyBrake },
    'Minimum Thick': { ...emptyBrake },
    'Max @ Width': { ...emptyBrake },
  },
  threadingDrive: {
    'Maximum Thick': { ...emptyThreadingDrive },
    'Max @ Full': { ...emptyThreadingDrive },
    'Minimum Thick': { ...emptyThreadingDrive },
    'Max @ Width': { ...emptyThreadingDrive },
  },
  holdDown: {
    'Maximum Thick': { ...emptyHoldDown },
    'Max @ Full': { ...emptyHoldDown },
    'Minimum Thick': { ...emptyHoldDown },
    'Max @ Width': { ...emptyHoldDown },
  },
  cylinder: {
    'Maximum Thick': { ...emptyCylinder },
    'Max @ Full': { ...emptyCylinder },
    'Minimum Thick': { ...emptyCylinder },
    'Max @ Width': { ...emptyCylinder },
  },
  dragBrake: {
    'Maximum Thick': { ...emptyDragBrake },
    'Max @ Full': { ...emptyDragBrake },
    'Minimum Thick': { ...emptyDragBrake },
    'Max @ Width': { ...emptyDragBrake },
  },
};

// Add mapping for material type label to value
const MATERIAL_TYPE_LABEL_TO_VALUE: Record<string, string> = Object.fromEntries(
  MATERIAL_TYPE_OPTIONS.map(opt => [opt.label, opt.value])
);

export default function TDDBHD() {
  const [confirmed, setConfirmed] = useState(false);
  const [version, setVersion] = useState<VersionKey>(VERSIONS[0]);
  const [status, setStatus] = useState<string>("");
  const [form, setForm] = useState<TDDBHDData>(() => defaultTDDBHDData);
  const { createTDDBHD, isLoading: isSaving, status: backendStatus } = useCreateTDDBHD();
  const { getTDDBHD, isLoading: isGetting, status: getBackendStatus } = useGetTDDBHD();

  function handleInputChange(section: keyof Omit<TDDBHDData, 'referenceNumber' | 'customer' | 'date'>, field: string, value: string) {
    setForm(prev => {
      const prevData = prev ?? defaultTDDBHDData;
      return {
        ...prevData,
        [section]: {
          ...prevData[section],
          [version]: {
            ...prevData[section][version],
            [field]: value
          }
        }
      };
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleGetData() {
    if (!form.referenceNumber) {
      setStatus('No reference number.');
      return;
    }
    try {
      setStatus('Fetching from backend...');
      const backendData = await getTDDBHD(form.referenceNumber);
      if (backendData) {
        // Map flat backend fields to versioned frontend structure
        const versionMap = [
          { key: 'Maximum Thick', prefix: 'max' },
          { key: 'Max @ Full', prefix: 'full' },
          { key: 'Minimum Thick', prefix: 'min' },
          { key: 'Max @ Width', prefix: 'width' },
        ];
        const buildReel = (prefix: string) => ({
          model: '',
          width: backendData[`${prefix}_material_width`] ?? '',
          backplate: '',
          materialType: MATERIAL_TYPE_LABEL_TO_VALUE[backendData[`${prefix}_material_type`]] ?? backendData[`${prefix}_material_type`] ?? '',
          materialWidth: backendData[`${prefix}_material_width`] ?? '',
          thickness: backendData[`${prefix}_material_thickness`] ?? '',
          yieldStrength: backendData[`${prefix}_yield_strength`] ?? '',
          airPressure: '',
          decelRate: '',
        });
        const buildCoil = (prefix: string) => ({
          weight: backendData[`${prefix}_coil_weight`] ?? '',
          od: backendData[`${prefix}_coil_od`] ?? '',
          dispReel: '',
          webTensionPsi: '',
          webTensionLbs: '',
        });
        const buildBrake = (prefix: string) => ({
          padDiameter: '',
          cylinderBore: '',
          friction: '',
        });
        const buildThreadingDrive = (prefix: string) => ({
          airClutch: '',
          hydThreadingDrive: '',
          torqueAtMandrel: '',
          rewindTorque: '',
        });
        const buildHoldDown = (prefix: string) => ({
          assy: '',
          pressure: '',
          forceRequired: '',
          forceAvailable: '',
          minWidth: '',
        });
        const buildCylinder = (prefix: string) => ({
          type: '',
          pressure: '',
        });
        const buildDragBrake = (prefix: string) => ({
          model: '',
          quantity: '',
          torqueRequired: '',
          failsafePSI: '',
          failsafeHoldingForce: '',
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
        setForm((prev: TDDBHDData | undefined) => {
          const prevData = prev ?? defaultTDDBHDData;
          return {
            ...prevData,
            referenceNumber: backendData.reference || prevData.referenceNumber || '',
            customer: backendData.customer || backendData.customer || prevData.customer || '',
            date: backendData.date || prevData.date || '',
            reel,
            coil,
            brake,
            threadingDrive,
            holdDown,
            cylinder,
            dragBrake,
          };
        });
        setStatus('Loaded from backend.');
      } else {
        setStatus('No saved data found.');
      }
    } catch (err) {
      setStatus('Backend unavailable. No saved data found.');
    }
  }

  async function handleSetData() {
    if (!form.referenceNumber) {
      setStatus('No reference number.');
      return;
    }
    const tddbhdFormData = {
      referenceNumber: form.referenceNumber,
      customer: form.customer,
      date: form.date,
      reel: form.reel,
      coil: form.coil,
      brake: form.brake,
      threadingDrive: form.threadingDrive,
      holdDown: form.holdDown,
      cylinder: form.cylinder,
      dragBrake: form.dragBrake,
    };
    try {
      setStatus('Saving to backend...');
      await createTDDBHD(tddbhdFormData);
      setStatus('Saved to backend.');
    } catch (err) {
      setStatus('Backend unavailable. Unable to save.');
    }
  }

  // Use form state for all fields with safe fallback
  const data = form || defaultTDDBHDData;

  return (
    <div className="max-w-[1200px] mx-auto text-sm p-6">
      {/* Reference Info */}
      <Card className="mb-8 p-6">
        <Text as="h3" className="mb-4 text-lg font-medium">Reference Information</Text>
        <div className="grid grid-cols-2 gap-6">
          <Input label="Reference" name="referenceNumber" value={data.referenceNumber || ''} onChange={handleChange} required />
          <div className="flex items-end gap-2">
            <Button as="button" onClick={handleGetData} disabled={isGetting}>Get TDDBHD</Button>
            <Button as="button" onClick={handleSetData} disabled={isSaving}>Set Data</Button>
          </div>
        </div>
      </Card>
      {/* Customer and Date Info */}
      <Card className="mb-8 p-6">
        <Text as="h3" className="mb-4 text-lg font-medium">Customer & Date</Text>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Customer" name="customer" value={data.customer || ''} onChange={handleChange} />
          <Input label="Date" name="date" type="date" value={data.date || ''} onChange={handleChange} />
        </div>
      </Card>
      {/* Version Tabs and Badge */}
      <Card className="mb-8 p-6">
        <Text as="h3" className="mb-4 text-lg font-medium">Reel & Material Specs</Text>
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <Tabs activeTab={version} setActiveTab={tab => setVersion(tab as VersionKey)} tabs={VERSIONS.map(v => ({ label: v, value: v }))} />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
            version === 'Maximum Thick' ? 'bg-blue-100 text-blue-800' :
            version === 'Max @ Full' ? 'bg-green-100 text-green-800' :
            version === 'Minimum Thick' ? 'bg-yellow-100 text-yellow-800' :
            'bg-purple-100 text-purple-800'}`}
          >
            {version} Version
          </span>
        </div>
      {/* TD/DB/HD Layout for selected version */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Input label="Reel Model" value={data.reel[version]?.model || ''} onChange={e => handleInputChange('reel', 'model', e.target.value)} />
          <Input label="Reel Width" value={data.reel[version]?.width || ''} onChange={e => handleInputChange('reel', 'width', e.target.value)} />
          <Input label="Backplate Diameter" value={data.reel[version]?.backplate || ''} onChange={e => handleInputChange('reel', 'backplate', e.target.value)} />
          <Select
            label="Material Type"
            value={data.reel[version]?.materialType || ''}
            onChange={e => handleInputChange('reel', 'materialType', e.target.value)}
            options={MATERIAL_TYPE_OPTIONS}
          />
          <Input label="Material Width (in)" value={data.reel[version]?.materialWidth || ''} onChange={e => handleInputChange('reel', 'materialWidth', e.target.value)} />
          <Input label="Material Thickness (in)" value={data.reel[version]?.thickness || ''} onChange={e => handleInputChange('reel', 'thickness', e.target.value)} />
          <Input label="Material Yield Strength (psi)" value={data.reel[version]?.yieldStrength || ''} onChange={e => handleInputChange('reel', 'yieldStrength', e.target.value)} />
          <Input label="Air Pressure Available (psi)" value={data.reel[version]?.airPressure || ''} onChange={e => handleInputChange('reel', 'airPressure', e.target.value)} />
          <Input label="Required Decel. Rate (ft/sec²)" value={data.reel[version]?.decelRate || ''} onChange={e => handleInputChange('reel', 'decelRate', e.target.value)} />
        </div>
      </Card>
      <Card className="mb-8 p-6">
        <Text as="h3" className="mb-4 text-lg font-medium">Coil, Brake & Other Specs</Text>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Input label="Coil Weight (lbs)" value={data.coil[version]?.weight || ''} onChange={e => handleInputChange('coil', 'weight', e.target.value)} />
          <Input label="Coil O.D. (in)" value={data.coil[version]?.od || ''} onChange={e => handleInputChange('coil', 'od', e.target.value)} />
          <Input label="Disp. (Reel) Mtr." value={data.coil[version]?.dispReel || ''} onChange={e => handleInputChange('coil', 'dispReel', e.target.value)} />
          <Input label="Web Tension (psi)" value={data.coil[version]?.webTensionPsi || ''} onChange={e => handleInputChange('coil', 'webTensionPsi', e.target.value)} />
          <Input label="Web Tension (lbs)" value={data.coil[version]?.webTensionLbs || ''} onChange={e => handleInputChange('coil', 'webTensionLbs', e.target.value)} />
          <Input label="Brake Pad Diameter (in)" value={data.brake[version]?.padDiameter || ''} onChange={e => handleInputChange('brake', 'padDiameter', e.target.value)} />
          <Input label="Cylinder Bore (in)" value={data.brake[version]?.cylinderBore || ''} onChange={e => handleInputChange('brake', 'cylinderBore', e.target.value)} />
          <Input label="Coefficient of Friction" value={data.brake[version]?.friction || ''} onChange={e => handleInputChange('brake', 'friction', e.target.value)} />
        </div>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <Card className="p-6">
          <Text as="h3" className="mb-4 text-lg font-medium">Threading Drive</Text>
          <Input label="Air Clutch" value={data.threadingDrive[version]?.airClutch || ''} onChange={e => handleInputChange('threadingDrive', 'airClutch', e.target.value)} />
          <Input label="Hyd. Threading Drive" value={data.threadingDrive[version]?.hydThreadingDrive || ''} onChange={e => handleInputChange('threadingDrive', 'hydThreadingDrive', e.target.value)} />
          <Input label="Torque At Mandrel (in. lbs.)" value={data.threadingDrive[version]?.torqueAtMandrel || ''} onChange={e => handleInputChange('threadingDrive', 'torqueAtMandrel', e.target.value)} />
          <Input label="Rewind Torque Req. (in. lbs.)" value={data.threadingDrive[version]?.rewindTorque || ''} onChange={e => handleInputChange('threadingDrive', 'rewindTorque', e.target.value)} />
        </Card>
        <Card className="p-6">
          <Text as="h3" className="mb-4 text-lg font-medium">Hold Down</Text>
          <Input label="Hold Down Assy" value={data.holdDown[version]?.assy || ''} onChange={e => handleInputChange('holdDown', 'assy', e.target.value)} />
          <Input label="Holddown Pressure (psi)" value={data.holdDown[version]?.pressure || ''} onChange={e => handleInputChange('holdDown', 'pressure', e.target.value)} />
          <Input label="Hold Down Force Required (lbs)" value={data.holdDown[version]?.forceRequired || ''} onChange={e => handleInputChange('holdDown', 'forceRequired', e.target.value)} />
          <Input label="Hold Down Force Available (lbs)" value={data.holdDown[version]?.forceAvailable || ''} onChange={e => handleInputChange('holdDown', 'forceAvailable', e.target.value)} />
          <Input label="Min. Material Width (in)" value={data.holdDown[version]?.minWidth || ''} onChange={e => handleInputChange('holdDown', 'minWidth', e.target.value)} />
        </Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <Card className="p-6">
          <Text as="h3" className="mb-4 text-lg font-medium">Cylinder</Text>
          <Input label="Type" value={data.cylinder[version]?.type || ''} onChange={e => handleInputChange('cylinder', 'type', e.target.value)} />
          <Input label="Pressure (psi)" value={data.cylinder[version]?.pressure || ''} onChange={e => handleInputChange('cylinder', 'pressure', e.target.value)} />
        </Card>
        <Card className="p-6">
          <Text as="h3" className="mb-4 text-lg font-medium">Drag Brake</Text>
          <Input label="Brake Model" value={data.dragBrake[version]?.model || ''} onChange={e => handleInputChange('dragBrake', 'model', e.target.value)} />
          <Input label="Brake Quantity" value={data.dragBrake[version]?.quantity || ''} onChange={e => handleInputChange('dragBrake', 'quantity', e.target.value)} />
          <Input label="Torque Required (in. lbs.)" value={data.dragBrake[version]?.torqueRequired || ''} onChange={e => handleInputChange('dragBrake', 'torqueRequired', e.target.value)} />
          <Input label="Failsafe - Single Stage (psi air req.)" value={data.dragBrake[version]?.failsafePSI || ''} onChange={e => handleInputChange('dragBrake', 'failsafePSI', e.target.value)} />
          <Input label="Failsafe Holding Force (in. lbs.)" value={data.dragBrake[version]?.failsafeHoldingForce || ''} onChange={e => handleInputChange('dragBrake', 'failsafeHoldingForce', e.target.value)} />
        </Card>
      </div>
      {status && <div className="text-center text-xs text-primary mt-2">{status}</div>}
      {backendStatus && <div className="text-center text-xs text-primary mt-2">{backendStatus}</div>}
      {getBackendStatus && <div className="text-center text-xs text-primary mt-2">{getBackendStatus}</div>}
    </div>
  );
} 